/**
 * Device Assignment API Routes
 *
 * Handles assignment of devices to people with full audit trail.
 * Tracks assignment history and device returns with collection scheduling.
 */
import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'

const deviceAssignments = new Hono<{ Bindings: Env }>()

/**
 * POST /api/device-assignments/assign
 * Assign a device to a person
 */
deviceAssignments.post('/assign', async c => {
	const accountId = c.get('accountId')
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!accountId || !userId) {
		return c.json({ error: 'Account context and authentication required' }, 400)
	}

	const body = await c.req.json()
	const { device_id, person_id, notes } = body

	if (!device_id || !person_id) {
		return c.json({ error: 'device_id and person_id are required' }, 400)
	}

	// Verify device exists and belongs to account
	const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL')
		.bind(device_id, accountId)
		.first()

	if (!device) {
		return c.json({ error: 'Device not found' }, 404)
	}

	// Verify person exists and belongs to account
	const person = await c.env.DB.prepare('SELECT * FROM people WHERE id = ? AND account_id = ?')
		.bind(person_id, accountId)
		.first()

	if (!person) {
		return c.json({ error: 'Person not found' }, 404)
	}

	// Create assignment record
	const assignmentId = crypto.randomUUID()
	await c.env.DB.prepare(
		`INSERT INTO device_assignments (id, device_id, person_id, assigned_by_user_id, assigned_at, notes)
		VALUES (?, ?, ?, ?, datetime('now'), ?)`,
	)
		.bind(assignmentId, device_id, person_id, userId, notes || null)
		.run()

	// Update device status and assigned_to_person_id
	await c.env.DB.prepare(
		`UPDATE devices SET status = 'deployed', assigned_to_person_id = ?, updated_at = datetime('now')
		WHERE id = ? AND account_id = ?`,
	)
		.bind(person_id, device_id, accountId)
		.run()

	// Create audit log entry
	const auditId = crypto.randomUUID()
	await c.env.DB.prepare(
		`INSERT INTO audit_log (id, account_id, user_id, action, entity_type, entity_id, changes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
		.bind(
			auditId,
			accountId,
			userId,
			'assign',
			'device_assignment',
			assignmentId,
			JSON.stringify({ device_id, person_id, notes }),
		)
		.run()

	// Fetch the created assignment with person details
	const assignment = await c.env.DB.prepare(
		`SELECT
			da.*,
			p.first_name,
			p.last_name,
			p.email,
			d.name as device_name,
			d.model as device_model
		FROM device_assignments da
		JOIN people p ON da.person_id = p.id
		JOIN devices d ON da.device_id = d.id
		WHERE da.id = ?`,
	)
		.bind(assignmentId)
		.first()

	return c.json({ assignment }, 201)
})

/**
 * POST /api/device-assignments/unassign
 * Unassign a device (mark as returned) with optional collection scheduling
 */
deviceAssignments.post('/unassign', async c => {
	const accountId = c.get('accountId')
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!accountId || !userId) {
		return c.json({ error: 'Account context and authentication required' }, 400)
	}

	const body = await c.req.json()
	const { device_id, collection_method, notes } = body

	if (!device_id) {
		return c.json({ error: 'device_id is required' }, 400)
	}

	// Verify device exists and belongs to account
	const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL')
		.bind(device_id, accountId)
		.first()

	if (!device) {
		return c.json({ error: 'Device not found' }, 404)
	}

	// Find active assignment (no returned_at)
	const activeAssignment = await c.env.DB.prepare(
		'SELECT * FROM device_assignments WHERE device_id = ? AND returned_at IS NULL ORDER BY assigned_at DESC LIMIT 1',
	)
		.bind(device_id)
		.first()

	if (!activeAssignment) {
		return c.json({ error: 'No active assignment found for this device' }, 404)
	}

	// Update assignment with returned_at timestamp
	await c.env.DB.prepare(
		`UPDATE device_assignments SET returned_at = datetime('now'), notes = CASE WHEN notes IS NULL THEN ? ELSE notes || '\n' || ? END
		WHERE id = ?`,
	)
		.bind(notes || '', notes || '', activeAssignment.id)
		.run()

	// Update device status to available and clear assignment
	await c.env.DB.prepare(
		`UPDATE devices SET status = 'available', assigned_to_person_id = NULL, updated_at = datetime('now')
		WHERE id = ? AND account_id = ?`,
	)
		.bind(device_id, accountId)
		.run()

	// Create audit log entry
	const auditId = crypto.randomUUID()
	await c.env.DB.prepare(
		`INSERT INTO audit_log (id, account_id, user_id, action, entity_type, entity_id, changes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
		.bind(
			auditId,
			accountId,
			userId,
			'unassign',
			'device_assignment',
			activeAssignment.id,
			JSON.stringify({ device_id, collection_method, notes }),
		)
		.run()

	// Fetch the updated assignment
	const assignment = await c.env.DB.prepare(
		`SELECT
			da.*,
			p.first_name,
			p.last_name,
			p.email,
			d.name as device_name,
			d.model as device_model
		FROM device_assignments da
		JOIN people p ON da.person_id = p.id
		JOIN devices d ON da.device_id = d.id
		WHERE da.id = ?`,
	)
		.bind(activeAssignment.id)
		.first()

	return c.json({
		assignment,
		collection_method: collection_method || 'in_person',
	})
})

/**
 * GET /api/device-assignments/device/:device_id
 * Get assignment history for a specific device
 */
deviceAssignments.get('/device/:device_id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const deviceId = c.req.param('device_id')

	// Verify device exists and belongs to account
	const device = await c.env.DB.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ? AND deleted_at IS NULL')
		.bind(deviceId, accountId)
		.first()

	if (!device) {
		return c.json({ error: 'Device not found' }, 404)
	}

	// Get assignment history
	const assignments = await c.env.DB.prepare(
		`SELECT
			da.*,
			p.first_name,
			p.last_name,
			p.email,
			u.first_name as assigned_by_first_name,
			u.last_name as assigned_by_last_name
		FROM device_assignments da
		JOIN people p ON da.person_id = p.id
		LEFT JOIN users u ON da.assigned_by_user_id = u.id
		WHERE da.device_id = ?
		ORDER BY da.assigned_at DESC`,
	)
		.bind(deviceId)
		.all()

	return c.json({
		device,
		assignments: assignments.results || [],
	})
})

/**
 * GET /api/device-assignments/person/:person_id
 * Get assignment history for a specific person
 */
deviceAssignments.get('/person/:person_id', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const personId = c.req.param('person_id')

	// Verify person exists and belongs to account
	const person = await c.env.DB.prepare('SELECT * FROM people WHERE id = ? AND account_id = ?')
		.bind(personId, accountId)
		.first()

	if (!person) {
		return c.json({ error: 'Person not found' }, 404)
	}

	// Get assignment history
	const assignments = await c.env.DB.prepare(
		`SELECT
			da.*,
			d.name as device_name,
			d.model as device_model,
			d.type as device_type,
			d.serial_number,
			u.first_name as assigned_by_first_name,
			u.last_name as assigned_by_last_name
		FROM device_assignments da
		JOIN devices d ON da.device_id = d.id
		LEFT JOIN users u ON da.assigned_by_user_id = u.id
		WHERE da.person_id = ?
		ORDER BY da.assigned_at DESC`,
	)
		.bind(personId)
		.all()

	return c.json({
		person,
		assignments: assignments.results || [],
	})
})

/**
 * GET /api/device-assignments/active
 * Get all active assignments for the account
 */
deviceAssignments.get('/active', async c => {
	const accountId = c.get('accountId')
	if (!accountId) {
		return c.json({ error: 'Account context required' }, 400)
	}

	const assignments = await c.env.DB.prepare(
		`SELECT
			da.*,
			p.first_name,
			p.last_name,
			p.email,
			p.status as person_status,
			d.name as device_name,
			d.model as device_model,
			d.type as device_type,
			d.serial_number,
			u.first_name as assigned_by_first_name,
			u.last_name as assigned_by_last_name
		FROM device_assignments da
		JOIN devices d ON da.device_id = d.id
		JOIN people p ON da.person_id = p.id
		LEFT JOIN users u ON da.assigned_by_user_id = u.id
		WHERE d.account_id = ? AND da.returned_at IS NULL
		ORDER BY da.assigned_at DESC`,
	)
		.bind(accountId)
		.all()

	return c.json({
		assignments: assignments.results || [],
		total: assignments.results?.length || 0,
	})
})

export default deviceAssignments
