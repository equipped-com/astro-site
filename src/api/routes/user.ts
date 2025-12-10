/**
 * User Profile API Routes
 *
 * Handles user profile management and account switching for multi-tenant access.
 * Users can belong to multiple accounts (consultant pattern).
 */

import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

const user = new Hono<{ Bindings: Env }>()

/**
 * GET /api/user
 * Get current user profile with account memberships
 */
user.get('/', async c => {
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!userId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const result = await c.env.DB.prepare(
		`
		SELECT u.*, json_group_array(json_object(
			'account_id', aa.account_id,
			'role', aa.role,
			'account_name', a.name
		)) as accounts
		FROM users u
		LEFT JOIN account_access aa ON u.id = aa.user_id
		LEFT JOIN accounts a ON aa.account_id = a.id
		WHERE u.id = ?
		GROUP BY u.id
	`,
	)
		.bind(userId)
		.first()

	if (!result) {
		return c.json({ error: 'User not found' }, 404)
	}

	// Parse accounts JSON and filter out nulls
	const accounts = JSON.parse(result.accounts as string).filter(
		(a: { account_id: string | null }) => a.account_id !== null,
	)

	return c.json({
		user: {
			id: result.id,
			email: result.email,
			first_name: result.first_name,
			last_name: result.last_name,
			phone: result.phone,
			primary_account_id: result.primary_account_id,
			avatar_url: result.avatar_url,
		},
		accounts,
	})
})

/**
 * PUT /api/user
 * Update user profile fields (only safe fields allowed)
 */
user.put('/', async c => {
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!userId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const body = await c.req.json()

	// Only allow updating safe fields
	const allowedFields = ['first_name', 'last_name', 'phone']
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
		await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
			.bind(...params, userId)
			.run()
	}

	// Return updated user
	const updated = await c.env.DB.prepare(
		'SELECT id, email, first_name, last_name, phone, primary_account_id, avatar_url FROM users WHERE id = ?',
	)
		.bind(userId)
		.first()

	if (!updated) {
		return c.json({ error: 'User not found after update' }, 404)
	}

	return c.json({ user: updated })
})

/**
 * GET /api/user/accounts
 * List all account memberships for the current user
 * Returns accounts sorted by primary first, then alphabetically
 */
user.get('/accounts', async c => {
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!userId) {
		return c.json({ error: 'Authentication required' }, 401)
	}

	const result = await c.env.DB.prepare(
		`
		SELECT
			a.id,
			a.name,
			a.short_name,
			a.logo_url,
			aa.role,
			aa.id as account_access_id,
			CASE WHEN u.primary_account_id = a.id THEN 1 ELSE 0 END as is_primary
		FROM account_access aa
		JOIN accounts a ON aa.account_id = a.id
		JOIN users u ON aa.user_id = u.id
		WHERE aa.user_id = ?
		ORDER BY is_primary DESC, a.name ASC
	`,
	)
		.bind(userId)
		.all()

	return c.json({
		accounts: result.results.map((row: Record<string, unknown>) => ({
			id: row.id,
			name: row.name,
			short_name: row.short_name,
			logo_url: row.logo_url,
			role: row.role,
			is_primary: Boolean(row.is_primary),
			account_access_id: row.account_access_id,
		})),
	})
})

/**
 * POST /api/user/accounts/:id/switch
 * Switch active account context (sets cookie for subsequent requests)
 */
user.post('/accounts/:id/switch', async c => {
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!userId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const accountId = c.req.param('id')

	// Verify user has access to this account
	const access = await c.env.DB.prepare(
		`
		SELECT aa.role, a.name, a.short_name
		FROM account_access aa
		JOIN accounts a ON aa.account_id = a.id
		WHERE aa.user_id = ? AND aa.account_id = ?
	`,
	)
		.bind(userId, accountId)
		.first()

	if (!access) {
		return c.json({ error: 'Access denied' }, 403)
	}

	// Set account context cookie for subsequent requests
	setCookie(c, 'equipped_account', accountId, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'Strict',
		maxAge: 60 * 60 * 24 * 30, // 30 days
	})

	return c.json({
		success: true,
		account: {
			id: accountId,
			name: access.name,
			short_name: access.short_name,
			role: access.role,
		},
	})
})

/**
 * PUT /api/user/primary-account
 * Set the user's primary account
 * Validates user has access to the specified account before updating
 */
user.put('/primary-account', async c => {
	const auth = getAuth(c)
	const userId = auth?.userId

	if (!userId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const body = await c.req.json()
	const accountId = body.account_id

	if (!accountId) {
		return c.json({ error: 'account_id is required' }, 400)
	}

	// Verify user has access to this account
	const access = await c.env.DB.prepare(
		`
		SELECT aa.role, a.name
		FROM account_access aa
		JOIN accounts a ON aa.account_id = a.id
		WHERE aa.user_id = ? AND aa.account_id = ?
	`,
	)
		.bind(userId, accountId)
		.first()

	if (!access) {
		return c.json({ error: 'You do not have access to this account' }, 403)
	}

	// Update user's primary account
	await c.env.DB.prepare(
		`
		UPDATE users
		SET primary_account_id = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`,
	)
		.bind(accountId, userId)
		.run()

	// Return updated user profile
	const updated = await c.env.DB.prepare(
		'SELECT id, email, first_name, last_name, phone, primary_account_id, avatar_url FROM users WHERE id = ?',
	)
		.bind(userId)
		.first()

	if (!updated) {
		return c.json({ error: 'User not found after update' }, 404)
	}

	return c.json({ user: updated })
})

export default user
