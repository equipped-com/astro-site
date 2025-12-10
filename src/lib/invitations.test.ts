/**
 * Invitation Business Logic Tests
 *
 * Unit tests for invitation utilities and helpers.
 */

import { describe, expect, it } from 'vitest'
import {
	addStatusToInvitation,
	calculateExpiryDate,
	formatInvitationResponse,
	generateInvitationId,
	getInvitationStatus,
	isInvitationValid,
	isValidEmail,
	isValidRole,
	type Invitation,
} from './invitations'

describe('Invitation Utilities', () => {
	describe('generateInvitationId', () => {
		it('should generate an ID starting with "inv_"', () => {
			const id = generateInvitationId()
			expect(id).toMatch(/^inv_[a-f0-9]{32}$/)
		})

		it('should generate unique IDs', () => {
			const id1 = generateInvitationId()
			const id2 = generateInvitationId()
			expect(id1).not.toBe(id2)
		})
	})

	describe('calculateExpiryDate', () => {
		it('should return a date 14 days in the future', () => {
			const expiryDate = new Date(calculateExpiryDate())
			const now = new Date()
			const daysDiff = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
			expect(daysDiff).toBe(14)
		})

		it('should return a valid ISO date string', () => {
			const expiry = calculateExpiryDate()
			expect(() => new Date(expiry)).not.toThrow()
			expect(new Date(expiry).toISOString()).toBe(expiry)
		})
	})

	describe('getInvitationStatus', () => {
		const baseInvitation: Invitation = {
			id: 'inv-123',
			account_id: 'account-123',
			email: 'test@example.com',
			role: 'member',
			invited_by_user_id: 'user-123',
			sent_at: '2025-01-01T00:00:00Z',
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		}

		it('should return "pending" for valid invitation with no actions', () => {
			expect(getInvitationStatus(baseInvitation)).toBe('pending')
		})

		it('should return "accepted" when accepted_at is set', () => {
			const invitation: Invitation = {
				...baseInvitation,
				accepted_at: '2025-01-02T00:00:00Z',
			}
			expect(getInvitationStatus(invitation)).toBe('accepted')
		})

		it('should return "declined" when declined_at is set', () => {
			const invitation: Invitation = {
				...baseInvitation,
				declined_at: '2025-01-02T00:00:00Z',
			}
			expect(getInvitationStatus(invitation)).toBe('declined')
		})

		it('should return "revoked" when revoked_at is set', () => {
			const invitation: Invitation = {
				...baseInvitation,
				revoked_at: '2025-01-02T00:00:00Z',
			}
			expect(getInvitationStatus(invitation)).toBe('revoked')
		})

		it('should return "expired" when expires_at is in the past', () => {
			const invitation: Invitation = {
				...baseInvitation,
				expires_at: new Date(Date.now() - 1000).toISOString(),
			}
			expect(getInvitationStatus(invitation)).toBe('expired')
		})

		it('should prioritize revoked over other states', () => {
			const invitation: Invitation = {
				...baseInvitation,
				accepted_at: '2025-01-02T00:00:00Z',
				declined_at: '2025-01-02T00:00:00Z',
				revoked_at: '2025-01-02T00:00:00Z',
			}
			expect(getInvitationStatus(invitation)).toBe('revoked')
		})

		it('should prioritize declined over accepted', () => {
			const invitation: Invitation = {
				...baseInvitation,
				accepted_at: '2025-01-02T00:00:00Z',
				declined_at: '2025-01-02T00:00:00Z',
			}
			expect(getInvitationStatus(invitation)).toBe('declined')
		})
	})

	describe('isInvitationValid', () => {
		const baseInvitation: Invitation = {
			id: 'inv-123',
			account_id: 'account-123',
			email: 'test@example.com',
			role: 'member',
			invited_by_user_id: 'user-123',
			sent_at: '2025-01-01T00:00:00Z',
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		}

		it('should return true for pending invitation', () => {
			expect(isInvitationValid(baseInvitation)).toBe(true)
		})

		it('should return false for accepted invitation', () => {
			const invitation: Invitation = {
				...baseInvitation,
				accepted_at: '2025-01-02T00:00:00Z',
			}
			expect(isInvitationValid(invitation)).toBe(false)
		})

		it('should return false for declined invitation', () => {
			const invitation: Invitation = {
				...baseInvitation,
				declined_at: '2025-01-02T00:00:00Z',
			}
			expect(isInvitationValid(invitation)).toBe(false)
		})

		it('should return false for revoked invitation', () => {
			const invitation: Invitation = {
				...baseInvitation,
				revoked_at: '2025-01-02T00:00:00Z',
			}
			expect(isInvitationValid(invitation)).toBe(false)
		})

		it('should return false for expired invitation', () => {
			const invitation: Invitation = {
				...baseInvitation,
				expires_at: new Date(Date.now() - 1000).toISOString(),
			}
			expect(isInvitationValid(invitation)).toBe(false)
		})
	})

	describe('addStatusToInvitation', () => {
		it('should add status property to invitation', () => {
			const invitation: Invitation = {
				id: 'inv-123',
				account_id: 'account-123',
				email: 'test@example.com',
				role: 'member',
				invited_by_user_id: 'user-123',
				sent_at: '2025-01-01T00:00:00Z',
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			}

			const result = addStatusToInvitation(invitation)
			expect(result.status).toBe('pending')
			expect(result.id).toBe(invitation.id)
			expect(result.email).toBe(invitation.email)
		})
	})

	describe('isValidEmail', () => {
		it('should return true for valid emails', () => {
			expect(isValidEmail('test@example.com')).toBe(true)
			expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
			expect(isValidEmail('user+tag@example.com')).toBe(true)
		})

		it('should return false for invalid emails', () => {
			expect(isValidEmail('')).toBe(false)
			expect(isValidEmail('invalid')).toBe(false)
			expect(isValidEmail('missing@domain')).toBe(false)
			expect(isValidEmail('@nodomain.com')).toBe(false)
			expect(isValidEmail('spaces in@email.com')).toBe(false)
		})
	})

	describe('isValidRole', () => {
		it('should return true for valid roles', () => {
			expect(isValidRole('owner')).toBe(true)
			expect(isValidRole('admin')).toBe(true)
			expect(isValidRole('member')).toBe(true)
			expect(isValidRole('buyer')).toBe(true)
			expect(isValidRole('viewer')).toBe(true)
		})

		it('should return false for invalid roles', () => {
			expect(isValidRole('superadmin')).toBe(false)
			expect(isValidRole('noaccess')).toBe(false)
			expect(isValidRole('')).toBe(false)
			expect(isValidRole('ADMIN')).toBe(false)
		})
	})

	describe('formatInvitationResponse', () => {
		it('should format invitation for API response', () => {
			const invitation: Invitation = {
				id: 'inv-123',
				account_id: 'account-123',
				email: 'test@example.com',
				role: 'admin',
				invited_by_user_id: 'user-123',
				sent_at: '2025-01-01T00:00:00Z',
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			}

			const result = formatInvitationResponse(invitation)

			expect(result).toEqual({
				id: 'inv-123',
				email: 'test@example.com',
				role: 'admin',
				sent_at: '2025-01-01T00:00:00Z',
				status: 'pending',
				expires_at: invitation.expires_at,
			})
		})

		it('should include correct status for accepted invitation', () => {
			const invitation: Invitation = {
				id: 'inv-123',
				account_id: 'account-123',
				email: 'test@example.com',
				role: 'admin',
				invited_by_user_id: 'user-123',
				sent_at: '2025-01-01T00:00:00Z',
				accepted_at: '2025-01-02T00:00:00Z',
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			}

			const result = formatInvitationResponse(invitation)
			expect(result.status).toBe('accepted')
		})
	})
})
