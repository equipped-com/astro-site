/**
 * Organization Settings API Routes
 *
 * Manages organization profile, billing info, and settings.
 * Requires owner/admin role for updates.
 */

import { Hono } from 'hono'
import { getTenantContext } from '@/lib/tenant-context'
import { getRole, type Role, requireAccountAccess } from '../middleware/auth'
import { requireTenant } from '../middleware/tenant'

const organization = new Hono<{ Bindings: Env }>()

// Apply middleware
organization.use('*', requireTenant())
organization.use('*', requireAccountAccess())

interface Account {
	id: string
	short_name: string
	name: string
	billing_email?: string
	address?: string
	logo_url?: string
	stripe_customer_id?: string
	upgraded_store_id?: string
	device_source?: string
	created_at: string
	updated_at?: string
}

interface UpdateAccountData {
	name?: string
	billing_email?: string
	address?: string
	logo_url?: string
}

/**
 * Check if user has permission to modify organization settings
 * Only owner and admin roles can modify
 */
function canModifyOrganization(role: Role | undefined): boolean {
	return role === 'owner' || role === 'admin'
}

/**
 * GET /api/organization
 * Get current organization details
 */
organization.get('/', async c => {
	const { accountId } = getTenantContext(c)

	const account = await c.env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(accountId).first<Account>()

	if (!account) {
		return c.json({ error: 'Organization not found' }, 404)
	}

	// Exclude sensitive internal fields
	const publicAccount = {
		id: account.id,
		short_name: account.short_name,
		name: account.name,
		billing_email: account.billing_email,
		address: account.address,
		logo_url: account.logo_url,
		created_at: account.created_at,
		updated_at: account.updated_at,
	}

	return c.json({ organization: publicAccount })
})

/**
 * PUT /api/organization
 * Update organization profile
 * Requires: owner or admin role
 */
organization.put('/', async c => {
	const role = getRole(c)

	if (!canModifyOrganization(role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'Only account owners and admins can modify organization settings',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const body = (await c.req.json()) as UpdateAccountData

	// Only allow updating safe fields
	const allowedFields: (keyof UpdateAccountData)[] = ['name', 'billing_email', 'address', 'logo_url']
	const updates: string[] = ["updated_at = datetime('now')"]
	const params: unknown[] = []

	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			updates.push(`${field} = ?`)
			params.push(body[field])
		}
	}

	// Only run update if we have fields to update
	if (updates.length > 1) {
		await c.env.DB.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`)
			.bind(...params, accountId)
			.run()
	}

	// Return updated organization
	const updated = await c.env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(accountId).first<Account>()

	if (!updated) {
		return c.json({ error: 'Organization not found after update' }, 404)
	}

	const publicAccount = {
		id: updated.id,
		short_name: updated.short_name,
		name: updated.name,
		billing_email: updated.billing_email,
		address: updated.address,
		logo_url: updated.logo_url,
		created_at: updated.created_at,
		updated_at: updated.updated_at,
	}

	return c.json({ organization: publicAccount })
})

/**
 * GET /api/organization/billing
 * Get billing information and subscription details
 */
organization.get('/billing', async c => {
	const { accountId } = getTenantContext(c)

	const account = await c.env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(accountId).first<Account>()

	if (!account) {
		return c.json({ error: 'Organization not found' }, 404)
	}

	// Get device count for usage stats
	const deviceCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM devices WHERE account_id = ?')
		.bind(accountId)
		.first<{ count: number }>()

	// Get user count
	const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM account_access WHERE account_id = ?')
		.bind(accountId)
		.first<{ count: number }>()

	// Get active lease agreements
	const leases = await c.env.DB.prepare(
		`SELECT * FROM lease_agreements
		WHERE account_id = ? AND status = 'active'
		ORDER BY start_date DESC`,
	)
		.bind(accountId)
		.all()

	return c.json({
		billing: {
			stripe_customer_id: account.stripe_customer_id,
			billing_email: account.billing_email,
		},
		usage: {
			devices: deviceCount?.count || 0,
			users: userCount?.count || 0,
		},
		leases: leases.results,
	})
})

/**
 * DELETE /api/organization
 * Delete organization (danger zone)
 * Requires: owner role only
 */
organization.delete('/', async c => {
	const role = getRole(c)

	if (role !== 'owner') {
		return c.json(
			{
				error: 'Permission denied',
				message: 'Only account owners can delete the organization',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)

	// Verify confirmation token in request body
	const body = (await c.req.json()) as { confirm_name?: string }
	const account = await c.env.DB.prepare('SELECT name FROM accounts WHERE id = ?')
		.bind(accountId)
		.first<{ name: string }>()

	if (!account) {
		return c.json({ error: 'Organization not found' }, 404)
	}

	if (body.confirm_name !== account.name) {
		return c.json(
			{
				error: 'Confirmation failed',
				message: 'Organization name does not match',
			},
			400,
		)
	}

	// Delete the account (CASCADE will handle related records)
	await c.env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId).run()

	return c.json({ success: true, message: 'Organization deleted successfully' })
})

export default organization
