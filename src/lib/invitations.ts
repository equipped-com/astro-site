/**
 * Invitation Business Logic
 *
 * Handles the complete invitation lifecycle: create, accept, decline, revoke.
 * Includes validation, expiry handling, and Account::Access creation.
 *
 * REQ-ID-005 to REQ-ID-008 from PRD.md
 */

import type { Role } from '@/api/middleware/auth'

export interface Invitation {
	id: string
	account_id: string
	email: string
	role: Role
	invited_by_user_id: string
	sent_at: string
	accepted_at?: string
	declined_at?: string
	revoked_at?: string
	expires_at: string
}

export interface InvitationWithStatus extends Invitation {
	status: InvitationStatus
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'

export interface CreateInvitationParams {
	accountId: string
	email: string
	role: Role
	invitedByUserId: string
}

export interface InvitationResult {
	success: boolean
	invitation?: Invitation
	error?: string
}

export interface AcceptInvitationResult {
	success: boolean
	account?: {
		id: string
		name: string
		short_name: string
	}
	role?: Role
	error?: string
}

// Default expiry is 14 days
const INVITATION_EXPIRY_DAYS = 14

/**
 * Generate an invitation ID
 */
export function generateInvitationId(): string {
	return `inv_${crypto.randomUUID().replace(/-/g, '')}`
}

/**
 * Calculate expiry date (14 days from now)
 */
export function calculateExpiryDate(): string {
	const date = new Date()
	date.setDate(date.getDate() + INVITATION_EXPIRY_DAYS)
	return date.toISOString()
}

/**
 * Determine invitation status based on timestamps
 */
export function getInvitationStatus(invitation: Invitation): InvitationStatus {
	if (invitation.revoked_at) return 'revoked'
	if (invitation.declined_at) return 'declined'
	if (invitation.accepted_at) return 'accepted'
	if (new Date(invitation.expires_at) < new Date()) return 'expired'
	return 'pending'
}

/**
 * Check if invitation is still valid (pending and not expired)
 */
export function isInvitationValid(invitation: Invitation): boolean {
	return getInvitationStatus(invitation) === 'pending'
}

/**
 * Add status to invitation
 */
export function addStatusToInvitation(invitation: Invitation): InvitationWithStatus {
	return {
		...invitation,
		status: getInvitationStatus(invitation),
	}
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

/**
 * Validate role is a valid invitation role
 * Note: owner role might be restricted in some cases
 */
export function isValidRole(role: string): role is Role {
	const validRoles: Role[] = ['owner', 'admin', 'member', 'buyer', 'viewer']
	return validRoles.includes(role as Role)
}

/**
 * Format invitation for API response
 */
export function formatInvitationResponse(invitation: Invitation): {
	id: string
	email: string
	role: Role
	sent_at: string
	status: InvitationStatus
	expires_at: string
} {
	return {
		id: invitation.id,
		email: invitation.email,
		role: invitation.role,
		sent_at: invitation.sent_at,
		status: getInvitationStatus(invitation),
		expires_at: invitation.expires_at,
	}
}

/**
 * Database operations for invitations
 */
export class InvitationService {
	constructor(private db: D1Database) {}

	/**
	 * Create a new invitation
	 */
	async createInvitation(params: CreateInvitationParams): Promise<InvitationResult> {
		const { accountId, email, role, invitedByUserId } = params
		const normalizedEmail = email.toLowerCase().trim()

		// Validate email
		if (!isValidEmail(normalizedEmail)) {
			return { success: false, error: 'Invalid email address' }
		}

		// Validate role
		if (!isValidRole(role)) {
			return { success: false, error: 'Invalid role' }
		}

		// Check if user already has access to this account
		const existingAccess = await this.db
			.prepare(
				`SELECT aa.id FROM account_access aa
				JOIN users u ON u.id = aa.user_id
				WHERE u.email = ? AND aa.account_id = ?`,
			)
			.bind(normalizedEmail, accountId)
			.first<{ id: string }>()

		if (existingAccess) {
			return { success: false, error: 'User already has access to this account' }
		}

		// Check for existing pending invitation
		const existingInvitation = await this.db
			.prepare(
				`SELECT * FROM account_invitations
				WHERE email = ? AND account_id = ?
				AND accepted_at IS NULL
				AND declined_at IS NULL
				AND revoked_at IS NULL
				AND expires_at > datetime('now')`,
			)
			.bind(normalizedEmail, accountId)
			.first<Invitation>()

		if (existingInvitation) {
			// Return the existing pending invitation
			return { success: true, invitation: existingInvitation }
		}

		// Create new invitation
		const invitationId = generateInvitationId()
		const expiresAt = calculateExpiryDate()

		await this.db
			.prepare(
				`INSERT INTO account_invitations (id, account_id, email, role, invited_by_user_id, sent_at, expires_at)
				VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
			)
			.bind(invitationId, accountId, normalizedEmail, role, invitedByUserId, expiresAt)
			.run()

		// Fetch the created invitation
		const invitation = await this.db
			.prepare('SELECT * FROM account_invitations WHERE id = ?')
			.bind(invitationId)
			.first<Invitation>()

		if (!invitation) {
			return { success: false, error: 'Failed to create invitation' }
		}

		return { success: true, invitation }
	}

	/**
	 * Get invitation by ID
	 */
	async getInvitationById(invitationId: string): Promise<Invitation | null> {
		return this.db.prepare('SELECT * FROM account_invitations WHERE id = ?').bind(invitationId).first<Invitation>()
	}

	/**
	 * Get all invitations for an account
	 */
	async getInvitationsForAccount(accountId: string): Promise<InvitationWithStatus[]> {
		const result = await this.db
			.prepare(
				`SELECT * FROM account_invitations
				WHERE account_id = ?
				ORDER BY sent_at DESC`,
			)
			.bind(accountId)
			.all<Invitation>()

		return (result.results || []).map(addStatusToInvitation)
	}

	/**
	 * Accept an invitation
	 */
	async acceptInvitation(
		invitationId: string,
		acceptingUserId: string,
	): Promise<AcceptInvitationResult> {
		// Get the invitation
		const invitation = await this.getInvitationById(invitationId)

		if (!invitation) {
			return { success: false, error: 'Invitation not found' }
		}

		// Check if invitation is still valid
		if (!isInvitationValid(invitation)) {
			const status = getInvitationStatus(invitation)
			if (status === 'expired') {
				return { success: false, error: 'This invitation has expired' }
			}
			if (status === 'accepted') {
				return { success: false, error: 'This invitation has already been accepted' }
			}
			if (status === 'declined') {
				return { success: false, error: 'This invitation has been declined' }
			}
			if (status === 'revoked') {
				return { success: false, error: 'This invitation has been revoked' }
			}
			return { success: false, error: 'This invitation is no longer valid' }
		}

		// Get account details
		const account = await this.db
			.prepare('SELECT id, name, short_name FROM accounts WHERE id = ?')
			.bind(invitation.account_id)
			.first<{ id: string; name: string; short_name: string }>()

		if (!account) {
			return { success: false, error: 'Account not found' }
		}

		// Check if user already has access (edge case: accepted through different path)
		const existingAccess = await this.db
			.prepare('SELECT id FROM account_access WHERE user_id = ? AND account_id = ?')
			.bind(acceptingUserId, invitation.account_id)
			.first<{ id: string }>()

		if (existingAccess) {
			// Mark invitation as accepted anyway
			await this.db
				.prepare("UPDATE account_invitations SET accepted_at = datetime('now') WHERE id = ?")
				.bind(invitationId)
				.run()

			return {
				success: true,
				account,
				role: invitation.role,
			}
		}

		// Create Account::Access record
		const accessId = `acc_${crypto.randomUUID().replace(/-/g, '')}`
		await this.db
			.prepare(
				`INSERT INTO account_access (id, account_id, user_id, role, created_at)
				VALUES (?, ?, ?, ?, datetime('now'))`,
			)
			.bind(accessId, invitation.account_id, acceptingUserId, invitation.role)
			.run()

		// Mark invitation as accepted
		await this.db
			.prepare("UPDATE account_invitations SET accepted_at = datetime('now') WHERE id = ?")
			.bind(invitationId)
			.run()

		return {
			success: true,
			account,
			role: invitation.role,
		}
	}

	/**
	 * Decline an invitation
	 */
	async declineInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
		const invitation = await this.getInvitationById(invitationId)

		if (!invitation) {
			return { success: false, error: 'Invitation not found' }
		}

		// Check if invitation is still pending
		if (!isInvitationValid(invitation)) {
			const status = getInvitationStatus(invitation)
			return { success: false, error: `Cannot decline invitation: status is ${status}` }
		}

		// Mark as declined
		await this.db
			.prepare("UPDATE account_invitations SET declined_at = datetime('now') WHERE id = ?")
			.bind(invitationId)
			.run()

		return { success: true }
	}

	/**
	 * Revoke an invitation (admin/owner only)
	 */
	async revokeInvitation(
		invitationId: string,
		accountId: string,
	): Promise<{ success: boolean; error?: string }> {
		const invitation = await this.getInvitationById(invitationId)

		if (!invitation) {
			return { success: false, error: 'Invitation not found' }
		}

		// Verify invitation belongs to the account
		if (invitation.account_id !== accountId) {
			return { success: false, error: 'Invitation not found' }
		}

		// Check if invitation is still pending
		if (!isInvitationValid(invitation)) {
			const status = getInvitationStatus(invitation)
			return { success: false, error: `Cannot revoke invitation: status is ${status}` }
		}

		// Mark as revoked
		await this.db
			.prepare("UPDATE account_invitations SET revoked_at = datetime('now') WHERE id = ?")
			.bind(invitationId)
			.run()

		return { success: true }
	}
}
