/**
 * Invitation API Routes
 *
 * Manages invitation lifecycle: create, list, accept, decline, revoke.
 * Implements REQ-ID-005 to REQ-ID-008 from PRD.md
 *
 * Routes:
 * - POST /api/invitations - Create and send invitation (owner/admin only)
 * - GET /api/invitations - List all invitations for account (owner/admin only)
 * - POST /api/invitations/:id/accept - Accept invitation (authenticated user)
 * - POST /api/invitations/:id/decline - Decline invitation (authenticated user)
 * - POST /api/invitations/:id/revoke - Revoke invitation (owner/admin only)
 */

import { Hono } from 'hono'
import { formatInvitationResponse, InvitationService, isValidRole } from '@/lib/invitations'
import { getTenantContext, tryGetTenantContext } from '@/lib/tenant-context'
import { getRole, getUser, type Role, requireAccountAccess, requireAuth } from '../middleware/auth'
import { requireTenant } from '../middleware/tenant'

const invitations = new Hono<{ Bindings: Env }>()

/**
 * Check if user has permission to manage invitations
 * Only owner and admin roles can create/revoke invitations
 */
function canManageInvitations(role: Role | undefined): boolean {
	return role === 'owner' || role === 'admin'
}

/**
 * Check if a role assignment is valid based on current user's role
 * Owners can assign any role, admins cannot assign owner
 */
function canAssignRole(currentUserRole: Role | undefined, targetRole: Role): boolean {
	if (currentUserRole === 'owner') return true
	if (currentUserRole === 'admin' && targetRole !== 'owner') return true
	return false
}

// ============================================================================
// PROTECTED ROUTES (requires auth + account access + admin/owner role)
// ============================================================================

/**
 * POST /api/invitations
 * Create and send an invitation
 *
 * @REQ-API-001 - Owner/admin can create invitations
 * @REQ-API-003 - Cannot invite existing team member
 */
invitations.post('/', requireTenant(), requireAccountAccess(), async c => {
	const role = getRole(c)
	const user = getUser(c)

	if (!canManageInvitations(role)) {
		return c.json(
			{
				error: 'Insufficient permissions',
				message: 'Only account owners and admins can send invitations',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const body = await c.req.json<{ email?: string; role?: string }>()

	if (!body.email) {
		return c.json({ error: 'Email is required' }, 400)
	}

	if (!body.role) {
		return c.json({ error: 'Role is required' }, 400)
	}

	if (!isValidRole(body.role)) {
		return c.json({ error: 'Invalid role' }, 400)
	}

	// Validate role assignment permission
	if (!canAssignRole(role, body.role as Role)) {
		return c.json(
			{
				error: 'Permission denied',
				message: 'You cannot assign the owner role',
			},
			403,
		)
	}

	const service = new InvitationService(c.env.DB)
	const result = await service.createInvitation({
		accountId,
		email: body.email,
		role: body.role as Role,
		invitedByUserId: user?.id || '',
	})

	if (!result.success) {
		return c.json({ error: result.error }, 400)
	}

	// TODO: Queue email notification
	// In production, this would trigger an email service
	// For now, the invitation is created and can be shared manually

	return c.json(
		{
			id: result.invitation?.id,
			email: result.invitation?.email,
			role: result.invitation?.role,
			expires_at: result.invitation?.expires_at,
		},
		201,
	)
})

/**
 * GET /api/invitations
 * List all invitations for the current account
 *
 * @REQ-API-008 - List all invitations for account
 */
invitations.get('/', requireTenant(), requireAccountAccess(), async c => {
	const role = getRole(c)

	if (!canManageInvitations(role)) {
		return c.json(
			{
				error: 'Insufficient permissions',
				message: 'Only account owners and admins can view invitations',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const service = new InvitationService(c.env.DB)
	const invitationsList = await service.getInvitationsForAccount(accountId)

	return c.json({
		invitations: invitationsList.map(formatInvitationResponse),
	})
})

/**
 * POST /api/invitations/:id/revoke
 * Revoke a pending invitation
 *
 * @REQ-API-006 - Revoke pending invitation
 */
invitations.post('/:id/revoke', requireTenant(), requireAccountAccess(), async c => {
	const role = getRole(c)

	if (!canManageInvitations(role)) {
		return c.json(
			{
				error: 'Insufficient permissions',
				message: 'Only account owners and admins can revoke invitations',
			},
			403,
		)
	}

	const { accountId } = getTenantContext(c)
	const invitationId = c.req.param('id')

	const service = new InvitationService(c.env.DB)
	const result = await service.revokeInvitation(invitationId, accountId)

	if (!result.success) {
		return c.json({ error: result.error }, 400)
	}

	return c.json({ message: 'Invitation revoked' })
})

// ============================================================================
// PUBLIC/INVITATION RECIPIENT ROUTES (requires auth only, no account access)
// These routes are accessed by the invitation recipient
// ============================================================================

/**
 * POST /api/invitations/:id/accept
 * Accept an invitation
 *
 * @REQ-API-004 - Accept invitation
 * @REQ-API-007 - Cannot accept expired invitation
 */
invitations.post('/:id/accept', requireAuth(), async c => {
	const userId = c.get('userId') as string
	const invitationId = c.req.param('id')

	const service = new InvitationService(c.env.DB)
	const result = await service.acceptInvitation(invitationId, userId)

	if (!result.success) {
		// Determine appropriate status code
		const isExpired = result.error?.includes('expired')
		const isNotFound = result.error?.includes('not found')
		const statusCode = isNotFound ? 404 : isExpired ? 400 : 400

		return c.json({ error: result.error }, statusCode)
	}

	return c.json({
		account: result.account,
		role: result.role,
	})
})

/**
 * POST /api/invitations/:id/decline
 * Decline an invitation
 *
 * @REQ-API-005 - Decline invitation
 */
invitations.post('/:id/decline', requireAuth(), async c => {
	const invitationId = c.req.param('id')

	const service = new InvitationService(c.env.DB)
	const result = await service.declineInvitation(invitationId)

	if (!result.success) {
		const isNotFound = result.error?.includes('not found')
		const statusCode = isNotFound ? 404 : 400

		return c.json({ error: result.error }, statusCode)
	}

	return c.json({ message: 'Invitation declined' })
})

export default invitations
