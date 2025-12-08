/**
 * Tests for Proposal Token Generation
 *
 * @REQ-PROP-002: Verify unique share token generation and URL formatting
 */

import { describe, expect, it } from 'vitest'
import {
	generateProposalId,
	generateProposalItemId,
	generateProposalShareUrl,
	generateProposalToken,
	isValidProposalToken,
} from './proposal-tokens'

describe('Proposal Tokens', () => {
	describe('generateProposalToken', () => {
		it('should generate a 32-character URL-safe token', () => {
			const token = generateProposalToken()
			expect(token).toHaveLength(32)
			expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
		})

		it('should generate unique tokens', () => {
			const tokens = new Set()
			for (let i = 0; i < 100; i++) {
				tokens.add(generateProposalToken())
			}
			expect(tokens.size).toBe(100)
		})

		it('should not contain URL-unsafe characters', () => {
			const token = generateProposalToken()
			// Should not contain +, /, or =
			expect(token).not.toMatch(/[+/=]/)
		})
	})

	describe('generateProposalShareUrl', () => {
		it('should generate correct URL format with default domain', () => {
			const token = 'abc123XYZ_test_1234567890123456'
			const url = generateProposalShareUrl(token)
			expect(url).toBe('https://proposals.tryequipped.com/abc123XYZ_test_1234567890123456')
		})

		it('should generate correct URL format with custom domain', () => {
			const token = 'abc123XYZ_test_1234567890123456'
			const url = generateProposalShareUrl(token, 'example.com')
			expect(url).toBe('https://proposals.example.com/abc123XYZ_test_1234567890123456')
		})

		it('should preserve token in URL', () => {
			const token = generateProposalToken()
			const url = generateProposalShareUrl(token)
			expect(url).toContain(token)
		})
	})

	describe('generateProposalId', () => {
		it('should generate ID with prop_ prefix', () => {
			const id = generateProposalId()
			expect(id).toMatch(/^prop_\d+_[a-z0-9]{7}$/)
		})

		it('should generate unique IDs', () => {
			const ids = new Set()
			for (let i = 0; i < 100; i++) {
				ids.add(generateProposalId())
			}
			expect(ids.size).toBe(100)
		})
	})

	describe('generateProposalItemId', () => {
		it('should generate ID with pitem_ prefix', () => {
			const id = generateProposalItemId()
			expect(id).toMatch(/^pitem_\d+_[a-z0-9]{7}$/)
		})

		it('should generate unique IDs', () => {
			const ids = new Set()
			for (let i = 0; i < 100; i++) {
				ids.add(generateProposalItemId())
			}
			expect(ids.size).toBe(100)
		})
	})

	describe('isValidProposalToken', () => {
		it('should validate correct token format', () => {
			const token = generateProposalToken()
			expect(isValidProposalToken(token)).toBe(true)
		})

		it('should reject tokens that are too short', () => {
			expect(isValidProposalToken('abc123')).toBe(false)
		})

		it('should reject tokens that are too long', () => {
			expect(isValidProposalToken('a'.repeat(33))).toBe(false)
		})

		it('should reject tokens with invalid characters', () => {
			expect(isValidProposalToken('abc123+/=xyz_1234567890123456')).toBe(false)
		})

		it('should reject empty string', () => {
			expect(isValidProposalToken('')).toBe(false)
		})

		it('should accept valid URL-safe base64 characters', () => {
			// Exactly 32 characters with valid characters
		expect(isValidProposalToken('abcABC123-_xyz789QWERTY098765432')).toBe(true)
		})
	})
})
