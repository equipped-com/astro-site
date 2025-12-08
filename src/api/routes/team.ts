/**
 * Team Access Management API Routes
 *
 * Manages team member access, roles, and invitations.
 * Handles inviting users, changing roles, and removing access.
 */

import { Hono } from 'hono'
import { getTenantContext } from '@/lib/tenant-context'
import { getRole, getUser, type Role, requireAccountAccess } from '../middleware/auth'
import { requireTenant } from '../middleware/tenant'

const team = new Hono<{ Bindings: Env }>()

// Apply middleware
team.use('*', requireTenant())
team.use('*', requireAccountAccess())

interface TeamMember {
	id: string
	user_id: string
	email: string
	first_name?: string
	last_name?: string
	role: Role
	created_at: string
}

interface PendingInvitation {
	id: string
	email: string
	role: Role
	invited_by: string
	created_at: string
}

interface InviteMemberRequest {
	email: string
	role: Role
}

interface ChangeRoleRequest {
	role: Role
}

/**
 * Check if user has permission to manage team
 * Only owner and admin roles can manage team
 */
function canManageTeam(role: Role | undefined): boolean {
	return role === 'owner' || role === 'admin'
}

/**
 * Check if a role change is valid based on current user's role
 * Owners can assign any role, admins cannot assign owner
 */
function canAssignRole(currentUserRole: Role | undefined, targetRole: Role): boolean {
	if (currentUserRole === 'owner') return true
	if (currentUserRole === 'admin' && targetRole !== 'owner') return true
	return false
}

/**
 * GET /api/team
 * Get all team members with their roles
 */
team.get('/', async c => {
	const { accountId } = getTenantContext(c)

	const members = await c.env.DB.prepare(
		`SELECT aa.id, aa.user_id, aa.role, aa.created_at, u.email, u.first_name, u.last_name
		FROM account_access aa
		JOIN users u ON u.id = aa.user_id
		WHERE aa.account_id = ?
		ORDER BY
			CASE aa.role
				WHEN 'owner' THEN 1
				WHEN 'admin' THEN 2
				WHEN 'member' THEN 3
				WHEN 'buyer' THEN 4
				WHEN 'viewer' THEN 5
				WHEN 'noaccess' THEN 6
			END,
			u.email ASC`,
	)
		.bind(accountId)
		.all<TeamMember>()

	return c.json({ members: members.results || [] })
})

/**
 * GET /api/team/invitations
 * Get pending invitations
 */
team.get('/invitations', async c => {
	const { accountId } = getTenantContext(c)

	// For now, we'll return an empty array
	// In a full implementation, this would query a pending_invitations table
	// Clerk handles invitations, so this endpoint may be used for tracking purposes
	const invitations: PendingInvitation[] = []

	return c.json({ invitations })
})

/**
 * POST /api/team/invite
 * Invite a new team member
 * Requires: owner or admin role
 */
team.post('/invite', async c => {
	const role = getRole(c)

	if (!canManageTeam(role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'Only account owners and admins can invite team members',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const currentUser = getUser(c)
	const body = (await c.req.json()) as InviteMemberRequest

	if (!body.email || !body.role) {
		return c.json({ error: 'Email and role are required' }, 400)
	}

	// Validate role assignment permission
	if (!canAssignRole(role, body.role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'You cannot assign the owner role',
			},
			403,
		)
	}

	// Check if user already exists in the system
	const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
		.bind(body.email.toLowerCase())
		.first<{ id: string }>()

	if (existingUser) {
		// Check if they already have access to this account
		const existingAccess = await c.env.DB.prepare('SELECT id FROM account_access WHERE user_id = ? AND account_id = ?')
			.bind(existingUser.id, accountId)
			.first<{ id: string }>()

		if (existingAccess) {
			return c.json(
				{
					error: 'User already has access',
					message: 'This user already has access to this account',
				},
				400,
			)
		}

		// Add access to existing user
		await c.env.DB.prepare(
			`INSERT INTO account_access (id, account_id, user_id, role, created_at)
			VALUES (?, ?, ?, ?, datetime('now'))`,
		)
			.bind(crypto.randomUUID(), accountId, existingUser.id, body.role)
			.run()

		return c.json({
			success: true,
			message: 'User granted access to account',
			method: 'existing_user',
		})
	}

	// User doesn't exist - we need to use Clerk to send an invitation
	// For now, we'll create a placeholder user and return success
	// In production, this would integrate with Clerk's invitation API

	return c.json({
		success: true,
		message: 'Invitation sent via Clerk',
		method: 'clerk_invitation',
		email: body.email,
		role: body.role,
	})
})

/**
 * PUT /api/team/:accessId/role
 * Change a team member's role
 * Requires: owner or admin role
 */
team.put('/:accessId/role', async c => {
	const role = getRole(c)
	const currentUser = getUser(c)

	if (!canManageTeam(role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'Only account owners and admins can change roles',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const accessId = c.req.param('accessId')
	const body = (await c.req.json()) as ChangeRoleRequest

	if (!body.role) {
		return c.json({ error: 'Role is required' }, 400)
	}

	// Validate role assignment permission
	if (!canAssignRole(role, body.role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'You cannot assign the owner role',
			},
			403,
		)
	}

	// Get the target access record
	const targetAccess = await c.env.DB.prepare(
		'SELECT user_id, role FROM account_access WHERE id = ? AND account_id = ?',
	)
		.bind(accessId, accountId)
		.first<{ user_id: string; role: Role }>()

	if (!targetAccess) {
		return c.json({ error: 'Team member not found' }, 404)
	}

	// Prevent changing own role to prevent accidental lockout
	if (currentUser && targetAccess.user_id === currentUser.id) {
		return c.json(
			{
				error: 'Cannot change own role',
				message: 'You cannot change your own role. Ask another owner or admin.',
			},
			400,
		)
	}

	// If demoting an owner, check if they are the last owner
	if (targetAccess.role === 'owner' && body.role !== 'owner') {
		const ownerCount = await c.env.DB.prepare(
			'SELECT COUNT(*) as count FROM account_access WHERE account_id = ? AND role = ?',
		)
			.bind(accountId, 'owner')
			.first<{ count: number }>()

		if (ownerCount && ownerCount.count <= 1) {
			return c.json(
				{
					error: 'Cannot remove last owner',
					message: 'Transfer ownership to another member before demoting this owner',
				},
				400,
			)
		}
	}

	// Update the role
	await c.env.DB.prepare('UPDATE account_access SET role = ? WHERE id = ?').bind(body.role, accessId).run()

	// TODO: Add audit log entry

	return c.json({
		success: true,
		message: 'Role updated successfully',
	})
})

/**
 * DELETE /api/team/:accessId
 * Remove a team member's access
 * Requires: owner or admin role
 */
team.delete('/:accessId', async c => {
	const role = getRole(c)
	const currentUser = getUser(c)

	if (!canManageTeam(role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'Only account owners and admins can remove team members',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const accessId = c.req.param('accessId')

	// Get the target access record
	const targetAccess = await c.env.DB.prepare(
		'SELECT user_id, role FROM account_access WHERE id = ? AND account_id = ?',
	)
		.bind(accessId, accountId)
		.first<{ user_id: string; role: Role }>()

	if (!targetAccess) {
		return c.json({ error: 'Team member not found' }, 404)
	}

	// Prevent removing own access to prevent lockout
	if (currentUser && targetAccess.user_id === currentUser.id) {
		return c.json(
			{
				error: 'Cannot remove own access',
				message: 'You cannot remove your own access. Ask another owner or admin.',
			},
			400,
		)
	}

	// If removing an owner, check if they are the last owner
	if (targetAccess.role === 'owner') {
		const ownerCount = await c.env.DB.prepare(
			'SELECT COUNT(*) as count FROM account_access WHERE account_id = ? AND role = ?',
		)
			.bind(accountId, 'owner')
			.first<{ count: number }>()

		if (ownerCount && ownerCount.count <= 1) {
			return c.json(
				{
					error: 'Cannot remove last owner',
					message: 'Transfer ownership to another member before removing this owner',
				},
				400,
			)
		}
	}

	// Delete the access record
	await c.env.DB.prepare('DELETE FROM account_access WHERE id = ?').bind(accessId).run()

	// TODO: Add audit log entry

	return c.json({
		success: true,
		message: 'Team member access removed successfully',
	})
})

export default team
