import { describe, expect, it } from 'vitest'
import {
	formatPhoneNumber,
	isAddressComplete,
	validateAddress,
	validateEmail,
	validatePhone,
	validateZipCode,
	type AddressData,
} from './address-validation'

describe('address-validation', () => {
	describe('validateEmail', () => {
		it('should accept valid email addresses', () => {
			expect(validateEmail('user@example.com')).toBe(true)
			expect(validateEmail('nicole.haley@company.io')).toBe(true)
			expect(validateEmail('test+tag@domain.co.uk')).toBe(true)
		})

		it('should reject invalid email addresses', () => {
			expect(validateEmail('invalid')).toBe(false)
			expect(validateEmail('invalid@')).toBe(false)
			expect(validateEmail('@domain.com')).toBe(false)
			expect(validateEmail('user@')).toBe(false)
			expect(validateEmail('')).toBe(false)
		})
	})

	describe('validatePhone', () => {
		it('should accept 10-digit US phone numbers', () => {
			expect(validatePhone('5551234567')).toBe(true)
			expect(validatePhone('555-123-4567')).toBe(true)
			expect(validatePhone('(555) 123-4567')).toBe(true)
			expect(validatePhone('555.123.4567')).toBe(true)
		})

		it('should accept 11-digit numbers starting with 1', () => {
			expect(validatePhone('15551234567')).toBe(true)
			expect(validatePhone('1-555-123-4567')).toBe(true)
			expect(validatePhone('+1 (555) 123-4567')).toBe(true)
		})

		it('should reject invalid phone numbers', () => {
			expect(validatePhone('123')).toBe(false)
			expect(validatePhone('55512345')).toBe(false) // Too short
			expect(validatePhone('555123456789')).toBe(false) // Too long
			expect(validatePhone('25551234567')).toBe(false) // 11 digits but doesn't start with 1
			expect(validatePhone('')).toBe(false)
		})
	})

	describe('validateZipCode', () => {
		it('should accept 5-digit zip codes', () => {
			expect(validateZipCode('95014')).toBe(true)
			expect(validateZipCode('10001')).toBe(true)
		})

		it('should accept 5+4 format zip codes', () => {
			expect(validateZipCode('95014-1234')).toBe(true)
			expect(validateZipCode('10001-5678')).toBe(true)
		})

		it('should reject invalid zip codes', () => {
			expect(validateZipCode('1234')).toBe(false) // Too short
			expect(validateZipCode('123456')).toBe(false) // Too long
			expect(validateZipCode('12345-12')).toBe(false) // Invalid +4
			expect(validateZipCode('ABCDE')).toBe(false) // Not digits
			expect(validateZipCode('')).toBe(false)
		})
	})

	describe('formatPhoneNumber', () => {
		it('should format 10-digit numbers to (XXX) XXX-XXXX', () => {
			expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
		})

		it('should strip leading 1 from 11-digit numbers', () => {
			expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567')
			expect(formatPhoneNumber('1-555-123-4567')).toBe('(555) 123-4567')
		})

		it('should return original value if not 10 or 11 digits', () => {
			expect(formatPhoneNumber('123')).toBe('123')
			expect(formatPhoneNumber('55512345')).toBe('55512345')
		})
	})

	describe('validateAddress', () => {
		const validAddress: AddressData = {
			firstName: 'Nicole',
			lastName: 'Haley',
			addressLine1: '1 Infinite Loop',
			city: 'Cupertino',
			state: 'CA',
			zipCode: '95014',
			country: 'US',
			email: 'nicole@example.com',
			phone: '5551234567',
		}

		it('should return no errors for complete valid address', () => {
			const errors = validateAddress(validAddress)
			expect(errors).toHaveLength(0)
		})

		it('should require firstName', () => {
			const errors = validateAddress({ ...validAddress, firstName: '' })
			expect(errors).toContainEqual({
				field: 'firstName',
				message: 'First name is required',
			})
		})

		it('should require lastName', () => {
			const errors = validateAddress({ ...validAddress, lastName: '' })
			expect(errors).toContainEqual({
				field: 'lastName',
				message: 'Last name is required',
			})
		})

		it('should require addressLine1', () => {
			const errors = validateAddress({ ...validAddress, addressLine1: '' })
			expect(errors).toContainEqual({
				field: 'addressLine1',
				message: 'Address is required',
			})
		})

		it('should not require addressLine2', () => {
			const errors = validateAddress({ ...validAddress, addressLine2: undefined })
			expect(errors).toHaveLength(0)
		})

		it('should require city', () => {
			const errors = validateAddress({ ...validAddress, city: '' })
			expect(errors).toContainEqual({
				field: 'city',
				message: 'City is required',
			})
		})

		it('should require state', () => {
			const errors = validateAddress({ ...validAddress, state: '' })
			expect(errors).toContainEqual({
				field: 'state',
				message: 'State is required',
			})
		})

		it('should require zipCode and validate format', () => {
			const errors1 = validateAddress({ ...validAddress, zipCode: '' })
			expect(errors1).toContainEqual({
				field: 'zipCode',
				message: 'Zip code is required',
			})

			const errors2 = validateAddress({ ...validAddress, zipCode: 'INVALID' })
			expect(errors2).toContainEqual({
				field: 'zipCode',
				message: 'Invalid zip code format',
			})
		})

		it('should require country', () => {
			const errors = validateAddress({ ...validAddress, country: '' })
			expect(errors).toContainEqual({
				field: 'country',
				message: 'Country is required',
			})
		})

		it('should require email and validate format', () => {
			const errors1 = validateAddress({ ...validAddress, email: '' })
			expect(errors1).toContainEqual({
				field: 'email',
				message: 'Email is required',
			})

			const errors2 = validateAddress({ ...validAddress, email: 'invalid-email' })
			expect(errors2).toContainEqual({
				field: 'email',
				message: 'Invalid email format',
			})
		})

		it('should require phone and validate format', () => {
			const errors1 = validateAddress({ ...validAddress, phone: '' })
			expect(errors1).toContainEqual({
				field: 'phone',
				message: 'Phone number is required',
			})

			const errors2 = validateAddress({ ...validAddress, phone: '123' })
			expect(errors2).toContainEqual({
				field: 'phone',
				message: 'Invalid phone number format',
			})
		})

		it('should return multiple errors for incomplete address', () => {
			const errors = validateAddress({
				firstName: '',
				lastName: '',
				addressLine1: '',
				city: '',
				state: '',
				zipCode: '',
				country: '',
				email: '',
				phone: '',
			})

			expect(errors.length).toBeGreaterThanOrEqual(8) // All required fields
		})
	})

	describe('isAddressComplete', () => {
		const validAddress: AddressData = {
			firstName: 'Nicole',
			lastName: 'Haley',
			addressLine1: '1 Infinite Loop',
			city: 'Cupertino',
			state: 'CA',
			zipCode: '95014',
			country: 'US',
			email: 'nicole@example.com',
			phone: '5551234567',
		}

		it('should return true for complete valid address', () => {
			expect(isAddressComplete(validAddress)).toBe(true)
		})

		it('should return false for incomplete address', () => {
			expect(isAddressComplete({ ...validAddress, firstName: '' })).toBe(false)
			expect(isAddressComplete({ ...validAddress, email: 'invalid' })).toBe(false)
			expect(isAddressComplete({})).toBe(false)
		})

		it('should allow optional addressLine2', () => {
			expect(isAddressComplete({ ...validAddress, addressLine2: undefined })).toBe(true)
			expect(isAddressComplete({ ...validAddress, addressLine2: 'Apt 123' })).toBe(true)
		})

		it('should allow optional isBusinessAddress', () => {
			expect(isAddressComplete({ ...validAddress, isBusinessAddress: undefined })).toBe(true)
			expect(isAddressComplete({ ...validAddress, isBusinessAddress: true })).toBe(true)
			expect(isAddressComplete({ ...validAddress, isBusinessAddress: false })).toBe(true)
		})
	})
})
