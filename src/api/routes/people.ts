/**
 * People API Routes
 *
 * Handles employee directory management with tenant scoping.
 * People can exist with or without platform access (User accounts).
 */

import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'

const people = new Hono<{ Bindings: Env }>()

/**
 * GET /api/people
 * List all people in the account with their device counts and platform access status
 */
people.get('/', async c => {
	const accountId = c.get('accountId')

	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const result = await c.env.DB.prepare(
		`
		SELECT
			p.id,
			p.first_name,
			p.last_name,
			p.email,
			p.phone,
			p.title,
			p.department,
			p.location,
			p.status,
			p.start_date,
			p.end_date,
			p.created_at,
			p.updated_at,
			CASE WHEN p.account_access_id IS NOT NULL THEN 1 ELSE 0 END as has_platform_access,
			COALESCE(device_counts.device_count, 0) as device_count
		FROM people p
		LEFT JOIN (
			SELECT assigned_to_person_id, COUNT(*) as device_count
			FROM devices
			WHERE status != 'retired'
			GROUP BY assigned_to_person_id
		) device_counts ON p.id = device_counts.assigned_to_person_id
		WHERE p.account_id = ?
		ORDER BY p.first_name, p.last_name
	`,
	)
		.bind(accountId)
		.all()

	return c.json({ people: result.results })
})

/**
 * GET /api/people/:id
 * Get a specific person by ID with their device assignments
 */
people.get('/:id', async c => {
	const accountId = c.get('accountId')
	const personId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	// Get person details
	const person = await c.env.DB.prepare(
		`
		SELECT
			p.*,
			CASE WHEN p.account_access_id IS NOT NULL THEN 1 ELSE 0 END as has_platform_access
		FROM people p
		WHERE p.id = ? AND p.account_id = ?
	`,
	)
		.bind(personId, accountId)
		.first()

	if (!person) {
		return c.json({ error: 'Person not found' }, 404)
	}

	// Get assigned devices
	const devices = await c.env.DB.prepare(
		`
		SELECT
			d.id,
			d.name,
			d.type,
			d.model,
			d.serial_number,
			d.status,
			d.assigned_to_person_id,
			d.created_at
		FROM devices d
		WHERE d.assigned_to_person_id = ? AND d.account_id = ?
		ORDER BY d.created_at DESC
	`,
	)
		.bind(personId, accountId)
		.all()

	return c.json({
		person,
		devices: devices.results,
	})
})

/**
 * POST /api/people
 * Create a new person (with or without platform access)
 */
people.post('/', async c => {
	const accountId = c.get('accountId')
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!accountId || !userId) {
		return c.json({ error: 'Account context and authentication required' }, 400)
	}

	const body = await c.req.json()
	const { first_name, last_name, email, phone, title, department, location, status = 'active' } = body

	// Validate required fields
	if (!first_name || !last_name) {
		return c.json({ error: 'First name and last name are required' }, 400)
	}

	// Generate ID
	const personId = `person_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

	// Insert person (without platform access by default)
	await c.env.DB.prepare(
		`
		INSERT INTO people (
			id, account_id, first_name, last_name, email, phone,
			title, department, location, status, account_access_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
	`,
	)
		.bind(personId, accountId, first_name, last_name, email, phone, title, department, location, status)
		.run()

	// Fetch created person
	const created = await c.env.DB.prepare(
		`
		SELECT
			p.*,
			CASE WHEN p.account_access_id IS NOT NULL THEN 1 ELSE 0 END as has_platform_access,
			0 as device_count
		FROM people p
		WHERE p.id = ?
	`,
	)
		.bind(personId)
		.first()

	return c.json({ person: created }, 201)
})

/**
 * PUT /api/people/:id
 * Update a person's information
 */
people.put('/:id', async c => {
	const accountId = c.get('accountId')
	const personId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	// Verify person belongs to account
	const existing = await c.env.DB.prepare('SELECT id FROM people WHERE id = ? AND account_id = ?')
		.bind(personId, accountId)
		.first()

	if (!existing) {
		return c.json({ error: 'Person not found' }, 404)
	}

	const body = await c.req.json()

	// Only allow updating safe fields
	const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'title', 'department', 'location', 'status']
	const updates: string[] = ['updated_at = CURRENT_TIMESTAMP']
	const params: unknown[] = []

	for (const [key, value] of Object.entries(body)) {
		if (allowedFields.includes(key) && value !== undefined) {
			updates.push(`${key} = ?`)
			params.push(value)
		}
	}

	// Only run update if we have fields to update
	if (updates.length > 1) {
		await c.env.DB.prepare(`UPDATE people SET ${updates.join(', ')} WHERE id = ?`)
			.bind(...params, personId)
			.run()
	}

	// Return updated person
	const updated = await c.env.DB.prepare(
		`
		SELECT
			p.*,
			CASE WHEN p.account_access_id IS NOT NULL THEN 1 ELSE 0 END as has_platform_access,
			COALESCE(device_counts.device_count, 0) as device_count
		FROM people p
		LEFT JOIN (
			SELECT assigned_to_person_id, COUNT(*) as device_count
			FROM devices
			WHERE status != 'retired'
			GROUP BY assigned_to_person_id
		) device_counts ON p.id = device_counts.assigned_to_person_id
		WHERE p.id = ?
	`,
	)
		.bind(personId)
		.first()

	return c.json({ person: updated })
})

/**
 * DELETE /api/people/:id
 * Delete a person (soft delete by setting end_date and status)
 */
people.delete('/:id', async c => {
	const accountId = c.get('accountId')
	const personId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	// Verify person belongs to account
	const existing = await c.env.DB.prepare('SELECT id FROM people WHERE id = ? AND account_id = ?')
		.bind(personId, accountId)
		.first()

	if (!existing) {
		return c.json({ error: 'Person not found' }, 404)
	}

	// Check if person has assigned devices
	const devices = await c.env.DB.prepare(
		`SELECT COUNT(*) as count FROM devices WHERE assigned_to_person_id = ? AND status != 'retired'`,
	)
		.bind(personId)
		.first()

	if (devices && (devices.count as number) > 0) {
		return c.json(
			{
				error: 'Cannot delete person with assigned devices',
				assigned_devices: devices.count,
			},
			400,
		)
	}

	// Soft delete: set status to departed and end_date to today
	await c.env.DB.prepare(
		`
		UPDATE people
		SET status = 'departed',
			end_date = DATE('now'),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`,
	)
		.bind(personId)
		.run()

	return c.json({ success: true, message: 'Person marked as departed' })
})

export default people
