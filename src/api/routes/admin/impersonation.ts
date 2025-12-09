/**
 * Impersonation API Routes
 *
 * Handles starting, ending, and logging impersonation sessions.
 * All routes require sys_admin authentication.
 *
 * @REQ-SA-006 Enter impersonation mode
 * @REQ-SA-008 Actions are logged with admin context
 * @REQ-SA-009 Exit impersonation
 */
import { Hono } from 'hono'
import { RESTRICTED_ACTIONS, type RestrictedAction } from '@/lib/impersonation'
import { requireSysAdmin } from '../../middleware/sysadmin'

interface Env {
	DB?: D1Database
}

interface Variables {
	userId: string
	user: {
		id: string
		email: string
		first_name?: string
		last_name?: string
	}
	sysAdmin: boolean
}

const impersonationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()

// All routes require sys_admin authentication
impersonationRoutes.use('*', requireSysAdmin())

/**
 * Start impersonation session
 *
 * POST /api/admin/impersonation/start
 *
 * @REQ-SA-006 Enter impersonation mode
 */
impersonationRoutes.post('/start', async c => {
	const { accountId } = await c.req.json<{ accountId: string }>()

	if (!accountId) {
		return c.json({ error: 'Account ID is required' }, 400)
	}

	const db = c.env.DB
	if (!db) {
		return c.json({ error: 'Database not available' }, 503)
	}

	const user = c.get('user')
	const userId = c.get('userId')

	// Verify account exists
	const account = await db
		.prepare('SELECT id, name, short_name FROM accounts WHERE id = ?')
		.bind(accountId)
		.first<{ id: string; name: string; short_name: string }>()

	if (!account) {
		return c.json({ error: 'Account not found' }, 404)
	}

	// Log the impersonation start
	const auditId = crypto.randomUUID()
	await db
		.prepare(
			`INSERT INTO audit_logs (id, user_id, account_id, action, details, is_impersonation, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			auditId,
			userId,
			accountId,
			'impersonation_started',
			JSON.stringify({
				admin_email: user.email,
				admin_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
				account_name: account.name,
			}),
			1, // is_impersonation = true
		)
		.run()

	return c.json({
		success: true,
		session: {
			adminUserId: userId,
			adminEmail: user.email,
			adminName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
			accountId: account.id,
			accountName: account.name,
			accountShortName: account.short_name,
			startedAt: new Date().toISOString(),
		},
	})
})

/**
 * End impersonation session
 *
 * POST /api/admin/impersonation/end
 *
 * @REQ-SA-009 Exit impersonation
 */
impersonationRoutes.post('/end', async c => {
	const { accountId } = await c.req.json<{ accountId: string }>()

	if (!accountId) {
		return c.json({ error: 'Account ID is required' }, 400)
	}

	const db = c.env.DB
	if (!db) {
		return c.json({ error: 'Database not available' }, 503)
	}

	const user = c.get('user')
	const userId = c.get('userId')

	// Log the impersonation end
	const auditId = crypto.randomUUID()
	await db
		.prepare(
			`INSERT INTO audit_logs (id, user_id, account_id, action, details, is_impersonation, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			auditId,
			userId,
			accountId,
			'impersonation_ended',
			JSON.stringify({
				admin_email: user.email,
				admin_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
			}),
			1, // is_impersonation = true
		)
		.run()

	return c.json({
		success: true,
	})
})

/**
 * Log an action performed during impersonation
 *
 * POST /api/admin/impersonation/log
 *
 * @REQ-SA-008 Actions are logged with admin context
 */
impersonationRoutes.post('/log', async c => {
	const { accountId, action, details } = await c.req.json<{
		accountId: string
		action: string
		details?: Record<string, unknown>
	}>()

	if (!accountId || !action) {
		return c.json({ error: 'Account ID and action are required' }, 400)
	}

	const db = c.env.DB
	if (!db) {
		return c.json({ error: 'Database not available' }, 503)
	}

	const user = c.get('user')
	const userId = c.get('userId')

	// Log the action
	const auditId = crypto.randomUUID()
	await db
		.prepare(
			`INSERT INTO audit_logs (id, user_id, account_id, action, details, is_impersonation, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			auditId,
			userId,
			accountId,
			action,
			JSON.stringify({
				...details,
				admin_email: user.email,
				admin_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
			}),
			1, // is_impersonation = true
		)
		.run()

	return c.json({
		success: true,
		auditId,
	})
})

/**
 * Check if an action is restricted during impersonation
 *
 * GET /api/admin/impersonation/check-action?action=...
 *
 * @REQ-SA-010 Restricted actions while impersonating
 */
impersonationRoutes.get('/check-action', async c => {
	const action = c.req.query('action')

	if (!action) {
		return c.json({ error: 'Action is required' }, 400)
	}

	const isRestricted = RESTRICTED_ACTIONS.includes(action as RestrictedAction)

	return c.json({
		action,
		isRestricted,
		message: isRestricted ? 'Action restricted in admin mode' : 'Action allowed',
	})
})

/**
 * Get audit logs for impersonation sessions
 *
 * GET /api/admin/impersonation/audit-logs?accountId=...
 */
impersonationRoutes.get('/audit-logs', async c => {
	const accountId = c.req.query('accountId')
	const limit = parseInt(c.req.query('limit') || '50', 10)

	const db = c.env.DB
	if (!db) {
		return c.json({ error: 'Database not available' }, 503)
	}

	let query = `
		SELECT al.*, u.email as admin_email, u.first_name, u.last_name
		FROM audit_logs al
		LEFT JOIN users u ON u.id = al.user_id
		WHERE al.is_impersonation = 1
	`
	const params: (string | number)[] = []

	if (accountId) {
		query += ' AND al.account_id = ?'
		params.push(accountId)
	}

	query += ' ORDER BY al.created_at DESC LIMIT ?'
	params.push(limit)

	const logs = await db
		.prepare(query)
		.bind(...params)
		.all()

	return c.json({
		logs: logs.results,
	})
})

export default impersonationRoutes
