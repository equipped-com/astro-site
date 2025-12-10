/**
 * Device CRUD Endpoints
 *
 * Tenant-scoped device management API.
 * All operations are automatically filtered by account_id from tenant context.
 */
import { Hono } from 'hono'
import type { Device } from '@/lib/scoped-queries'

const devices = new Hono<{ Bindings: Env }>()

/**
 * GET /api/devices
 *
 * List all devices for the current account.
 * Supports optional status filtering via query param.
 *
 * Query params:
 *   - status: Filter by device status (available, assigned, in_use, maintenance, retired)
 *
 * Response: { devices: Device[], total: number }
 */
devices.get('/', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const status = c.req.query('status') as Device['status'] | undefined

	// Build query with optional status filter
	let query = 'SELECT * FROM devices WHERE account_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
	const params: unknown[] = [accountId]

	if (status) {
		query = 'SELECT * FROM devices WHERE account_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC'
		params.push(status)
	}

	const result = await c.env.DB.prepare(query)
		.bind(...params)
		.all()

	return c.json({
		devices: result.results as Device[],
		total: result.results.length,
	})
})

/**
 * POST /api/devices
 *
 * Create a new device in the current account.
 *
 * Request body:
 *   - name: string (required)
 *   - type: string (required)
 *   - model: string (required)
 *   - serial_number: string (optional)
 *   - status: Device['status'] (optional, defaults to 'available')
 *   - assigned_to_person_id: string (optional)
 *
 * Response: { device: Device }
 */
devices.post('/', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const body = await c.req.json()

	// Validate required fields
	if (!body.name || !body.type || !body.model) {
		return c.json({ error: 'Missing required fields: name, type, model' }, 400)
	}

	// Generate ID before insert
	const id = crypto.randomUUID()

	// Insert device
	await c.env.DB.prepare(
		`INSERT INTO devices (id, account_id, name, type, model, serial_number, status, assigned_to_person_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
		.bind(
			id,
			accountId,
			body.name,
			body.type,
			body.model,
			body.serial_number || null,
			body.status || 'available',
			body.assigned_to_person_id || null,
		)
		.run()

	// Get the created device
	const device = (await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?')
		.bind(id, accountId)
		.first()) as Device

	return c.json({ device }, 201)
})

/**
 * GET /api/devices/:id
 *
 * Get a specific device by ID (scoped to current account).
 *
 * Response: { device: Device }
 * Status: 404 if device not found or belongs to different account
 */
devices.get('/:id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const id = c.req.param('id')

	const device = (await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL')
		.bind(id, accountId)
		.first()) as Device | null

	if (!device) {
		return c.json({ error: 'Device not found' }, 404)
	}

	return c.json({ device })
})

/**
 * PUT /api/devices/:id
 *
 * Update a device (scoped to current account).
 *
 * Request body (all optional):
 *   - name: string
 *   - type: string
 *   - model: string
 *   - serial_number: string
 *   - status: Device['status']
 *   - assigned_to_person_id: string
 *
 * Response: { device: Device }
 * Status: 404 if device not found or belongs to different account
 */
devices.put('/:id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const id = c.req.param('id')
	const body = await c.req.json()

	// Verify device exists and belongs to account
	const existing = (await c.env.DB.prepare(
		'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
	)
		.bind(id, accountId)
		.first()) as Device | null

	if (!existing) {
		return c.json({ error: 'Device not found' }, 404)
	}

	// Build dynamic update
	const updates: string[] = ["updated_at = datetime('now')"]
	const params: unknown[] = []

	const allowedFields = ['name', 'type', 'model', 'serial_number', 'status', 'assigned_to_person_id']
	for (const [key, value] of Object.entries(body)) {
		if (allowedFields.includes(key) && value !== undefined) {
			updates.push(`${key} = ?`)
			params.push(value)
		}
	}

	// Only run update if we have fields to update besides updated_at
	if (updates.length > 1) {
		await c.env.DB.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ? AND account_id = ?`)
			.bind(...params, id, accountId)
			.run()
	}

	// Get updated device
	const device = (await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?')
		.bind(id, accountId)
		.first()) as Device

	return c.json({ device })
})

/**
 * DELETE /api/devices/:id
 *
 * Soft delete a device (scoped to current account).
 * Sets deleted_at timestamp instead of removing the record.
 *
 * Response: { success: true }
 * Status: 404 if device not found or belongs to different account
 */
devices.delete('/:id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const id = c.req.param('id')

	// Verify device exists and belongs to account
	const existing = (await c.env.DB.prepare(
		'SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL',
	)
		.bind(id, accountId)
		.first()) as Device | null

	if (!existing) {
		return c.json({ error: 'Device not found' }, 404)
	}

	// Soft delete by setting deleted_at timestamp
	await c.env.DB.prepare("UPDATE devices SET deleted_at = datetime('now') WHERE id = ? AND account_id = ?")
		.bind(id, accountId)
		.run()

	return c.json({ success: true })
})

export default devices
