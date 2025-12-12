/**
 * Products API Routes
 *
 * Public read access for browsing products with filters.
 * Sys admin only for creating/updating products.
 */
import { Hono } from 'hono'
import { requireAuth } from '@/api/middleware/auth'
import { requireSysAdmin } from '@/api/middleware/sysadmin'
import { products, brands, type Product, type NewProduct } from '@/db/schema'
import { eq, and, like, or, desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

const productsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /api/catalog/products
 *
 * List products with optional filters (public - requires auth only)
 *
 * Query params:
 *   - brand: Filter by brand_id
 *   - type: Filter by product_type
 *   - active: Filter by is_active (true/false)
 *   - search: Search by name or SKU
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *
 * Response: {
 *   products: Product[],
 *   pagination: { page, limit, total }
 * }
 */
productsRouter.get('/', requireAuth(), async c => {
	const db = drizzle(c.env.DB)

	// Parse query params
	const brandFilter = c.req.query('brand')
	const typeFilter = c.req.query('type')
	const activeFilter = c.req.query('active')
	const searchQuery = c.req.query('search')
	const page = Number.parseInt(c.req.query('page') || '1', 10)
	const limit = Math.min(Number.parseInt(c.req.query('limit') || '50', 10), 100)
	const offset = (page - 1) * limit

	// Build WHERE conditions
	const conditions = []

	if (brandFilter) {
		conditions.push(eq(products.brandId, brandFilter))
	}

	if (typeFilter) {
		conditions.push(eq(products.productType, typeFilter))
	}

	if (activeFilter !== undefined) {
		const isActive = activeFilter === 'true'
		conditions.push(eq(products.isActive, isActive))
	}

	if (searchQuery) {
		// Search in both name and SKU
		conditions.push(
			or(like(products.name, `%${searchQuery}%`), like(products.sku, `%${searchQuery}%`)),
		)
	}

	// Get total count for pagination
	const countQuery =
		conditions.length > 0
			? db
					.select({ count: products.id })
					.from(products)
					.where(and(...conditions))
			: db.select({ count: products.id }).from(products)

	const countResult = await countQuery.all()
	const total = countResult.length

	// Get paginated results with brand info
	const query =
		conditions.length > 0
			? db
					.select({
						id: products.id,
						brandId: products.brandId,
						brandName: brands.name,
						name: products.name,
						modelIdentifier: products.modelIdentifier,
						modelNumber: products.modelNumber,
						sku: products.sku,
						productType: products.productType,
						description: products.description,
						specs: products.specs,
						msrp: products.msrp,
						imageUrl: products.imageUrl,
						isActive: products.isActive,
						createdAt: products.createdAt,
						updatedAt: products.updatedAt,
					})
					.from(products)
					.leftJoin(brands, eq(products.brandId, brands.id))
					.where(and(...conditions))
					.orderBy(desc(products.createdAt))
					.limit(limit)
					.offset(offset)
			: db
					.select({
						id: products.id,
						brandId: products.brandId,
						brandName: brands.name,
						name: products.name,
						modelIdentifier: products.modelIdentifier,
						modelNumber: products.modelNumber,
						sku: products.sku,
						productType: products.productType,
						description: products.description,
						specs: products.specs,
						msrp: products.msrp,
						imageUrl: products.imageUrl,
						isActive: products.isActive,
						createdAt: products.createdAt,
						updatedAt: products.updatedAt,
					})
					.from(products)
					.leftJoin(brands, eq(products.brandId, brands.id))
					.orderBy(desc(products.createdAt))
					.limit(limit)
					.offset(offset)

	const result = await query.all()

	return c.json({
		products: result,
		pagination: {
			page,
			limit,
			total,
		},
	})
})

/**
 * POST /api/catalog/products
 *
 * Create a new product (sys_admin only)
 *
 * Request body:
 *   - brand_id: string (required)
 *   - name: string (required)
 *   - sku: string (required)
 *   - product_type: string (required)
 *   - model_identifier?: string
 *   - model_number?: string
 *   - description?: string
 *   - specs?: object
 *   - msrp?: number
 *   - image_url?: string
 *
 * Response: { product: Product }
 */
productsRouter.post('/', requireSysAdmin(), async c => {
	const body = await c.req.json()

	// Validate required fields
	if (!body.brand_id || !body.name || !body.sku || !body.product_type) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing required fields: brand_id, name, sku, product_type',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify brand exists
	const brand = await db.select().from(brands).where(eq(brands.id, body.brand_id)).get()

	if (!brand) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Invalid brand_id: brand does not exist',
			},
			400,
		)
	}

	// Generate ID
	const id = crypto.randomUUID()

	// Create product
	const newProduct: NewProduct = {
		id,
		brandId: body.brand_id,
		name: body.name,
		modelIdentifier: body.model_identifier || null,
		modelNumber: body.model_number || null,
		sku: body.sku,
		productType: body.product_type,
		description: body.description || null,
		specs: body.specs ? JSON.stringify(body.specs) : null,
		msrp: body.msrp || null,
		imageUrl: body.image_url || null,
		isActive: true,
	}

	try {
		await db.insert(products).values(newProduct)

		// Fetch the created product with brand info
		const result = await db
			.select({
				id: products.id,
				brandId: products.brandId,
				brandName: brands.name,
				name: products.name,
				modelIdentifier: products.modelIdentifier,
				modelNumber: products.modelNumber,
				sku: products.sku,
				productType: products.productType,
				description: products.description,
				specs: products.specs,
				msrp: products.msrp,
				imageUrl: products.imageUrl,
				isActive: products.isActive,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt,
			})
			.from(products)
			.leftJoin(brands, eq(products.brandId, brands.id))
			.where(eq(products.id, id))
			.get()

		return c.json({ product: result }, 201)
	} catch (error) {
		console.error('Error creating product:', error)

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return c.json(
				{
					error: 'Conflict',
					message: 'A product with this SKU already exists',
				},
				409,
			)
		}

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to create product',
			},
			500,
		)
	}
})

/**
 * GET /api/catalog/products/:id
 *
 * Get a single product by ID (requires auth only)
 *
 * Response: { product: Product }
 */
productsRouter.get('/:id', requireAuth(), async c => {
	const productId = c.req.param('id')

	if (!productId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing product ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	const result = await db
		.select({
			id: products.id,
			brandId: products.brandId,
			brandName: brands.name,
			name: products.name,
			modelIdentifier: products.modelIdentifier,
			modelNumber: products.modelNumber,
			sku: products.sku,
			productType: products.productType,
			description: products.description,
			specs: products.specs,
			msrp: products.msrp,
			imageUrl: products.imageUrl,
			isActive: products.isActive,
			createdAt: products.createdAt,
			updatedAt: products.updatedAt,
		})
		.from(products)
		.leftJoin(brands, eq(products.brandId, brands.id))
		.where(eq(products.id, productId))
		.get()

	if (!result) {
		return c.json(
			{
				error: 'Not found',
				message: 'Product not found',
			},
			404,
		)
	}

	return c.json({ product: result })
})

/**
 * PUT /api/catalog/products/:id
 *
 * Update an existing product (sys_admin only)
 *
 * Request body:
 *   - brand_id?: string
 *   - name?: string
 *   - sku?: string
 *   - product_type?: string
 *   - model_identifier?: string
 *   - model_number?: string
 *   - description?: string
 *   - specs?: object
 *   - msrp?: number
 *   - image_url?: string
 *   - is_active?: boolean
 *
 * Response: { product: Product }
 */
productsRouter.put('/:id', requireSysAdmin(), async c => {
	const productId = c.req.param('id')
	const body = await c.req.json()

	if (!productId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing product ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify product exists
	const existingProduct = await db.select().from(products).where(eq(products.id, productId)).get()

	if (!existingProduct) {
		return c.json(
			{
				error: 'Not found',
				message: 'Product not found',
			},
			404,
		)
	}

	// If brand_id is being updated, verify it exists
	if (body.brand_id) {
		const brand = await db.select().from(brands).where(eq(brands.id, body.brand_id)).get()

		if (!brand) {
			return c.json(
				{
					error: 'Validation failed',
					message: 'Invalid brand_id: brand does not exist',
				},
				400,
			)
		}
	}

	// Build update object with only provided fields
	const updates: Partial<Product> = {}

	if (body.brand_id !== undefined) {
		updates.brandId = body.brand_id
	}

	if (body.name !== undefined) {
		updates.name = body.name
	}

	if (body.model_identifier !== undefined) {
		updates.modelIdentifier = body.model_identifier
	}

	if (body.model_number !== undefined) {
		updates.modelNumber = body.model_number
	}

	if (body.sku !== undefined) {
		updates.sku = body.sku
	}

	if (body.product_type !== undefined) {
		updates.productType = body.product_type
	}

	if (body.description !== undefined) {
		updates.description = body.description
	}

	if (body.specs !== undefined) {
		updates.specs = body.specs ? JSON.stringify(body.specs) : null
	}

	if (body.msrp !== undefined) {
		updates.msrp = body.msrp
	}

	if (body.image_url !== undefined) {
		updates.imageUrl = body.image_url
	}

	if (body.is_active !== undefined) {
		updates.isActive = body.is_active
	}

	try {
		await db.update(products).set(updates).where(eq(products.id, productId))

		// Fetch the updated product with brand info
		const result = await db
			.select({
				id: products.id,
				brandId: products.brandId,
				brandName: brands.name,
				name: products.name,
				modelIdentifier: products.modelIdentifier,
				modelNumber: products.modelNumber,
				sku: products.sku,
				productType: products.productType,
				description: products.description,
				specs: products.specs,
				msrp: products.msrp,
				imageUrl: products.imageUrl,
				isActive: products.isActive,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt,
			})
			.from(products)
			.leftJoin(brands, eq(products.brandId, brands.id))
			.where(eq(products.id, productId))
			.get()

		return c.json({ product: result })
	} catch (error) {
		console.error('Error updating product:', error)

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return c.json(
				{
					error: 'Conflict',
					message: 'A product with this SKU already exists',
				},
				409,
			)
		}

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to update product',
			},
			500,
		)
	}
})

/**
 * DELETE /api/catalog/products/:id
 *
 * Delete a product (sys_admin only)
 *
 * Response: { success: true }
 */
productsRouter.delete('/:id', requireSysAdmin(), async c => {
	const productId = c.req.param('id')

	if (!productId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing product ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify product exists
	const existingProduct = await db.select().from(products).where(eq(products.id, productId)).get()

	if (!existingProduct) {
		return c.json(
			{
				error: 'Not found',
				message: 'Product not found',
			},
			404,
		)
	}

	try {
		await db.delete(products).where(eq(products.id, productId))

		return c.json({ success: true })
	} catch (error) {
		console.error('Error deleting product:', error)

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to delete product',
			},
			500,
		)
	}
})

export default productsRouter
