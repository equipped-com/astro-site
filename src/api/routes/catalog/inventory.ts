/**
 * Inventory API Routes
 *
 * Sys admin only - manage physical inventory items.
 */
import { Hono } from 'hono'
import { requireSysAdmin } from '@/api/middleware/sysadmin'
import { inventoryItems, products, brands, type InventoryItem, type NewInventoryItem } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

const inventoryRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /api/catalog/inventory
 *
 * List inventory items with optional filters (sys_admin only)
 *
 * Query params:
 *   - product_id: Filter by product_id
 *   - status: Filter by status (available, reserved, sold, allocated)
 *   - condition: Filter by condition (new, like_new, good, fair, refurbished)
 *
 * Response: { items: InventoryItem[] }
 */
inventoryRouter.get('/', requireSysAdmin(), async c => {
	const db = drizzle(c.env.DB)

	// Parse query params
	const productIdFilter = c.req.query('product_id')
	const statusFilter = c.req.query('status')
	const conditionFilter = c.req.query('condition')

	// Build WHERE conditions
	const conditions = []

	if (productIdFilter) {
		conditions.push(eq(inventoryItems.productId, productIdFilter))
	}

	if (statusFilter) {
		conditions.push(eq(inventoryItems.status, statusFilter))
	}

	if (conditionFilter) {
		conditions.push(eq(inventoryItems.condition, conditionFilter))
	}

	// Get inventory items with product and brand info
	const query =
		conditions.length > 0
			? db
					.select({
						id: inventoryItems.id,
						productId: inventoryItems.productId,
						productName: products.name,
						brandName: brands.name,
						serialNumber: inventoryItems.serialNumber,
						condition: inventoryItems.condition,
						status: inventoryItems.status,
						purchaseCost: inventoryItems.purchaseCost,
						salePrice: inventoryItems.salePrice,
						notes: inventoryItems.notes,
						warehouseLocation: inventoryItems.warehouseLocation,
						createdAt: inventoryItems.createdAt,
						updatedAt: inventoryItems.updatedAt,
					})
					.from(inventoryItems)
					.leftJoin(products, eq(inventoryItems.productId, products.id))
					.leftJoin(brands, eq(products.brandId, brands.id))
					.where(and(...conditions))
					.orderBy(desc(inventoryItems.createdAt))
			: db
					.select({
						id: inventoryItems.id,
						productId: inventoryItems.productId,
						productName: products.name,
						brandName: brands.name,
						serialNumber: inventoryItems.serialNumber,
						condition: inventoryItems.condition,
						status: inventoryItems.status,
						purchaseCost: inventoryItems.purchaseCost,
						salePrice: inventoryItems.salePrice,
						notes: inventoryItems.notes,
						warehouseLocation: inventoryItems.warehouseLocation,
						createdAt: inventoryItems.createdAt,
						updatedAt: inventoryItems.updatedAt,
					})
					.from(inventoryItems)
					.leftJoin(products, eq(inventoryItems.productId, products.id))
					.leftJoin(brands, eq(products.brandId, brands.id))
					.orderBy(desc(inventoryItems.createdAt))

	const result = await query.all()

	return c.json({ items: result })
})

/**
 * POST /api/catalog/inventory
 *
 * Add a new inventory item (sys_admin only)
 *
 * Request body:
 *   - product_id: string (required)
 *   - serial_number?: string (optional)
 *   - condition: string (required)
 *   - status: string (required)
 *   - purchase_cost?: number (optional)
 *   - sale_price?: number (optional)
 *   - notes?: string (optional)
 *   - warehouse_location?: string (optional)
 *
 * Response: { item: InventoryItem }
 */
inventoryRouter.post('/', requireSysAdmin(), async c => {
	const body = await c.req.json()

	// Validate required fields
	if (!body.product_id || !body.condition || !body.status) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing required fields: product_id, condition, status',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify product exists
	const product = await db.select().from(products).where(eq(products.id, body.product_id)).get()

	if (!product) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Invalid product_id: product does not exist',
			},
			400,
		)
	}

	// Generate ID
	const id = crypto.randomUUID()

	// Create inventory item
	const newItem: NewInventoryItem = {
		id,
		productId: body.product_id,
		serialNumber: body.serial_number || null,
		condition: body.condition,
		status: body.status,
		purchaseCost: body.purchase_cost || null,
		salePrice: body.sale_price || null,
		notes: body.notes || null,
		warehouseLocation: body.warehouse_location || null,
	}

	try {
		await db.insert(inventoryItems).values(newItem)

		// Fetch the created item with product info
		const result = await db
			.select({
				id: inventoryItems.id,
				productId: inventoryItems.productId,
				productName: products.name,
				brandName: brands.name,
				serialNumber: inventoryItems.serialNumber,
				condition: inventoryItems.condition,
				status: inventoryItems.status,
				purchaseCost: inventoryItems.purchaseCost,
				salePrice: inventoryItems.salePrice,
				notes: inventoryItems.notes,
				warehouseLocation: inventoryItems.warehouseLocation,
				createdAt: inventoryItems.createdAt,
				updatedAt: inventoryItems.updatedAt,
			})
			.from(inventoryItems)
			.leftJoin(products, eq(inventoryItems.productId, products.id))
			.leftJoin(brands, eq(products.brandId, brands.id))
			.where(eq(inventoryItems.id, id))
			.get()

		return c.json({ item: result }, 201)
	} catch (error) {
		console.error('Error creating inventory item:', error)

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return c.json(
				{
					error: 'Conflict',
					message: 'An inventory item with this serial number already exists',
				},
				409,
			)
		}

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to create inventory item',
			},
			500,
		)
	}
})

/**
 * PUT /api/catalog/inventory/:id
 *
 * Update an inventory item (sys_admin only)
 *
 * Request body:
 *   - status?: string
 *   - condition?: string
 *   - notes?: string
 *   - warehouse_location?: string
 *
 * Response: { item: InventoryItem }
 */
inventoryRouter.put('/:id', requireSysAdmin(), async c => {
	const itemId = c.req.param('id')
	const body = await c.req.json()

	if (!itemId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing item ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify item exists
	const existingItem = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).get()

	if (!existingItem) {
		return c.json(
			{
				error: 'Not found',
				message: 'Inventory item not found',
			},
			404,
		)
	}

	// Build update object with only provided fields
	const updates: Partial<InventoryItem> = {}

	if (body.status !== undefined) {
		updates.status = body.status
	}

	if (body.condition !== undefined) {
		updates.condition = body.condition
	}

	if (body.notes !== undefined) {
		updates.notes = body.notes
	}

	if (body.warehouse_location !== undefined) {
		updates.warehouseLocation = body.warehouse_location
	}

	// Always update the updatedAt timestamp
	updates.updatedAt = sql`CURRENT_TIMESTAMP`.toString()

	try {
		await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, itemId))

		// Fetch the updated item with product info
		const result = await db
			.select({
				id: inventoryItems.id,
				productId: inventoryItems.productId,
				productName: products.name,
				brandName: brands.name,
				serialNumber: inventoryItems.serialNumber,
				condition: inventoryItems.condition,
				status: inventoryItems.status,
				purchaseCost: inventoryItems.purchaseCost,
				salePrice: inventoryItems.salePrice,
				notes: inventoryItems.notes,
				warehouseLocation: inventoryItems.warehouseLocation,
				createdAt: inventoryItems.createdAt,
				updatedAt: inventoryItems.updatedAt,
			})
			.from(inventoryItems)
			.leftJoin(products, eq(inventoryItems.productId, products.id))
			.leftJoin(brands, eq(products.brandId, brands.id))
			.where(eq(inventoryItems.id, itemId))
			.get()

		return c.json({ item: result })
	} catch (error) {
		console.error('Error updating inventory item:', error)

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to update inventory item',
			},
			500,
		)
	}
})

export default inventoryRouter
