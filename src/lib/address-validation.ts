/**
 * Address validation utilities for checkout shipping stage
 */

export interface AddressData {
	firstName: string
	lastName: string
	addressLine1: string
	addressLine2?: string
	city: string
	state: string
	zipCode: string
	country: string
	email: string
	phone: string
	isBusinessAddress?: boolean
}

export interface ValidationError {
	field: keyof AddressData
	message: string
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

/**
 * Validates US phone number (supports various formats)
 */
export function validatePhone(phone: string): boolean {
	// Strip all non-digit characters
	const digitsOnly = phone.replace(/\D/g, '')

	// Accept 10-digit US numbers or 11-digit numbers starting with 1
	return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1')
}

/**
 * Validates US zip code (5 digits or 5+4 format)
 */
export function validateZipCode(zipCode: string): boolean {
	const zipRegex = /^\d{5}(-\d{4})?$/
	return zipRegex.test(zipCode)
}

/**
 * Formats phone number to (XXX) XXX-XXXX format
 */
export function formatPhoneNumber(phone: string): string {
	const digitsOnly = phone.replace(/\D/g, '')

	// Handle 11-digit numbers (strip leading 1)
	const normalized = digitsOnly.length === 11 && digitsOnly[0] === '1' ? digitsOnly.slice(1) : digitsOnly

	if (normalized.length !== 10) return phone

	return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`
}

/**
 * Validates complete address data
 */
export function validateAddress(address: Partial<AddressData>): ValidationError[] {
	const errors: ValidationError[] = []

	// Required fields
	if (!address.firstName?.trim()) {
		errors.push({ field: 'firstName', message: 'First name is required' })
	}

	if (!address.lastName?.trim()) {
		errors.push({ field: 'lastName', message: 'Last name is required' })
	}

	if (!address.addressLine1?.trim()) {
		errors.push({ field: 'addressLine1', message: 'Address is required' })
	}

	if (!address.city?.trim()) {
		errors.push({ field: 'city', message: 'City is required' })
	}

	if (!address.state?.trim()) {
		errors.push({ field: 'state', message: 'State is required' })
	}

	if (!address.zipCode?.trim()) {
		errors.push({ field: 'zipCode', message: 'Zip code is required' })
	} else if (!validateZipCode(address.zipCode)) {
		errors.push({ field: 'zipCode', message: 'Invalid zip code format' })
	}

	if (!address.country?.trim()) {
		errors.push({ field: 'country', message: 'Country is required' })
	}

	if (!address.email?.trim()) {
		errors.push({ field: 'email', message: 'Email is required' })
	} else if (!validateEmail(address.email)) {
		errors.push({ field: 'email', message: 'Invalid email format' })
	}

	if (!address.phone?.trim()) {
		errors.push({ field: 'phone', message: 'Phone number is required' })
	} else if (!validatePhone(address.phone)) {
		errors.push({ field: 'phone', message: 'Invalid phone number format' })
	}

	return errors
}

/**
 * Checks if address data is complete (all required fields filled)
 */
export function isAddressComplete(address: Partial<AddressData>): boolean {
	return validateAddress(address).length === 0
}
