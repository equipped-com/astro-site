/**
 * Delivery date calculation utilities for checkout stage 3
 * Handles standard, express, and custom delivery date logic
 */

export type DeliverySpeed = 'standard' | 'express' | 'custom'

export interface DeliveryOption {
	speed: DeliverySpeed
	label: string
	estimatedDate: Date
	cost: number
	description: string
}

/**
 * Calculate business days from today
 * Skips weekends (Saturday, Sunday)
 */
export function addBusinessDays(date: Date, days: number): Date {
	const result = new Date(date)
	let addedDays = 0

	while (addedDays < days) {
		result.setDate(result.getDate() + 1)
		const dayOfWeek = result.getDay()

		// Skip weekends (0 = Sunday, 6 = Saturday)
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			addedDays++
		}
	}

	return result
}

/**
 * Format date for display: "By Thursday, May 18"
 */
export function formatDeliveryDate(date: Date): string {
	const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
	const monthName = date.toLocaleDateString('en-US', { month: 'long' })
	const dayNumber = date.getDate()

	return `By ${dayName}, ${monthName} ${dayNumber}`
}

/**
 * Format date for calendar display: "May 30"
 */
export function formatCalendarDate(date: Date): string {
	const monthName = date.toLocaleDateString('en-US', { month: 'long' })
	const dayNumber = date.getDate()

	return `${monthName} ${dayNumber}`
}

/**
 * Get standard delivery option (5 business days, free)
 */
export function getStandardDelivery(baseDate: Date = new Date()): DeliveryOption {
	const estimatedDate = addBusinessDays(baseDate, 5)

	return {
		speed: 'standard',
		label: 'Standard Delivery',
		estimatedDate,
		cost: 0,
		description: formatDeliveryDate(estimatedDate),
	}
}

/**
 * Get express delivery option (3 business days, $9)
 */
export function getExpressDelivery(baseDate: Date = new Date()): DeliveryOption {
	const estimatedDate = addBusinessDays(baseDate, 3)

	return {
		speed: 'express',
		label: 'Express Delivery',
		estimatedDate,
		cost: 9.0,
		description: formatDeliveryDate(estimatedDate),
	}
}

/**
 * Get custom delivery option with specific date
 */
export function getCustomDelivery(selectedDate: Date): DeliveryOption {
	return {
		speed: 'custom',
		label: 'Select a date',
		estimatedDate: selectedDate,
		cost: 0,
		description: `Select a date: ${formatCalendarDate(selectedDate)}`,
	}
}

/**
 * Get all available delivery options
 */
export function getAllDeliveryOptions(baseDate: Date = new Date()): DeliveryOption[] {
	return [getStandardDelivery(baseDate), getExpressDelivery(baseDate)]
}

/**
 * Check if a date is available for delivery
 * Past dates and dates before standard delivery are disabled
 */
export function isDateAvailable(date: Date, baseDate: Date = new Date()): boolean {
	const today = new Date(baseDate)
	today.setHours(0, 0, 0, 0)

	const checkDate = new Date(date)
	checkDate.setHours(0, 0, 0, 0)

	// Cannot select past dates
	if (checkDate < today) {
		return false
	}

	// Cannot select dates before standard delivery
	const standardDelivery = getStandardDelivery(baseDate)
	const standardDate = new Date(standardDelivery.estimatedDate)
	standardDate.setHours(0, 0, 0, 0)

	if (checkDate < standardDate) {
		return false
	}

	return true
}

/**
 * Get month name for calendar header
 */
export function getMonthName(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Get days in month for calendar grid
 */
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate()
}

/**
 * Get first day of week (0-6) for month start
 */
export function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay()
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	)
}

/**
 * Calculate shipping cost based on delivery speed
 */
export function calculateShippingCost(speed: DeliverySpeed): number {
	switch (speed) {
		case 'standard':
			return 0
		case 'express':
			return 9.0
		case 'custom':
			return 0
		default:
			return 0
	}
}

/**
 * Calculate taxes based on subtotal and shipping
 * Using 8% tax rate (example)
 */
export function calculateTaxes(subtotal: number, shipping: number): number {
	const TAX_RATE = 0.08
	return (subtotal + shipping) * TAX_RATE
}
