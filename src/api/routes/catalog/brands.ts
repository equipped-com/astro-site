/**
 * Brands API Routes
 *
 * Public read access for browsing brands.
 * Sys admin only for creating/updating brands.
 */
import { Hono } from 'hono'
import { requireAuth } from '@/api/middleware/auth'
import { requireSysAdmin } from '@/api/middleware/sysadmin'
import { brands, type Brand, type NewBrand } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

const brandsRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /api/catalog/brands
 *
 * List all active brands (public - requires auth only)
 *
 * Response: { brands: Brand[] }
 */
brandsRouter.get('/', requireAuth(), async c => {
	const db = drizzle(c.env.DB)

	const result = await db
		.select({
			id: brands.id,
			name: brands.name,
			slug: brands.slug,
			logoUrl: brands.logoUrl,
		})
		.from(brands)
		.where(eq(brands.isActive, true))
		.orderBy(brands.name)
		.all()

	return c.json({ brands: result })
})

/**
 * POST /api/catalog/brands
 *
 * Create a new brand (sys_admin only)
 *
 * Request body:
 *   - name: string (required)
 *   - slug: string (required)
 *   - logo_url?: string (optional)
 *
 * Response: { brand: Brand }
 */
brandsRouter.post('/', requireSysAdmin(), async c => {
	const body = await c.req.json()

	// Validate required fields
	if (!body.name || !body.slug) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing required fields: name, slug',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Generate ID
	const id = crypto.randomUUID()

	// Create brand
	const newBrand: NewBrand = {
		id,
		name: body.name,
		slug: body.slug,
		logoUrl: body.logo_url || null,
		isActive: true,
	}

	try {
		await db.insert(brands).values(newBrand)

		// Fetch the created brand
		const result = await db.select().from(brands).where(eq(brands.id, id)).get()

		return c.json({ brand: result }, 201)
	} catch (error) {
		console.error('Error creating brand:', error)

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return c.json(
				{
					error: 'Conflict',
					message: 'A brand with this name or slug already exists',
				},
				409,
			)
		}

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to create brand',
			},
			500,
		)
	}
})

/**
 * PUT /api/catalog/brands/:id
 *
 * Update an existing brand (sys_admin only)
 *
 * Request body:
 *   - name?: string
 *   - slug?: string
 *   - logo_url?: string
 *   - is_active?: boolean
 *
 * Response: { brand: Brand }
 */
brandsRouter.put('/:id', requireSysAdmin(), async c => {
	const brandId = c.req.param('id')
	const body = await c.req.json()

	if (!brandId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing brand ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify brand exists
	const existingBrand = await db.select().from(brands).where(eq(brands.id, brandId)).get()

	if (!existingBrand) {
		return c.json(
			{
				error: 'Not found',
				message: 'Brand not found',
			},
			404,
		)
	}

	// Build update object with only provided fields
	const updates: Partial<Brand> = {}

	if (body.name !== undefined) {
		updates.name = body.name
	}

	if (body.slug !== undefined) {
		updates.slug = body.slug
	}

	if (body.logo_url !== undefined) {
		updates.logoUrl = body.logo_url
	}

	if (body.is_active !== undefined) {
		updates.isActive = body.is_active
	}

	try {
		await db.update(brands).set(updates).where(eq(brands.id, brandId))

		// Fetch the updated brand
		const result = await db.select().from(brands).where(eq(brands.id, brandId)).get()

		return c.json({ brand: result })
	} catch (error) {
		console.error('Error updating brand:', error)

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			return c.json(
				{
					error: 'Conflict',
					message: 'A brand with this name or slug already exists',
				},
				409,
			)
		}

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to update brand',
			},
			500,
		)
	}
})

/**
 * DELETE /api/catalog/brands/:id
 *
 * Delete a brand (sys_admin only)
 *
 * Response: { success: true }
 */
brandsRouter.delete('/:id', requireSysAdmin(), async c => {
	const brandId = c.req.param('id')

	if (!brandId) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Missing brand ID',
			},
			400,
		)
	}

	const db = drizzle(c.env.DB)

	// Verify brand exists
	const existingBrand = await db.select().from(brands).where(eq(brands.id, brandId)).get()

	if (!existingBrand) {
		return c.json(
			{
				error: 'Not found',
				message: 'Brand not found',
			},
			404,
		)
	}

	try {
		await db.delete(brands).where(eq(brands.id, brandId))

		return c.json({ success: true })
	} catch (error) {
		console.error('Error deleting brand:', error)

		return c.json(
			{
				error: 'Internal server error',
				message: 'Failed to delete brand',
			},
			500,
		)
	}
})

export default brandsRouter
