import { describe, expect, it } from 'vitest'
import {
	addBusinessDays,
	calculateShippingCost,
	calculateTaxes,
	formatCalendarDate,
	formatDeliveryDate,
	getCustomDelivery,
	getExpressDelivery,
	getStandardDelivery,
	isDateAvailable,
	isSameDay,
} from './delivery-dates'

describe('delivery-dates utilities', () => {
	describe('addBusinessDays', () => {
		it('should add business days excluding weekends', () => {
			// Monday, May 13, 2024
			const monday = new Date('2024-05-13')

			// Add 5 business days: Tue 14, Wed 15, Thu 16, Fri 17, Mon 20
			const result = addBusinessDays(monday, 5)

			expect(result.getDate()).toBe(20)
			expect(result.getDay()).toBe(1) // Monday
		})

		it('should skip weekends correctly', () => {
			// Friday, May 17, 2024
			const friday = new Date('2024-05-17')

			// Add 1 business day: Mon 20 (skip Sat 18, Sun 19)
			const result = addBusinessDays(friday, 1)

			expect(result.getDate()).toBe(20)
			expect(result.getDay()).toBe(1) // Monday
		})

		it('should handle 0 business days', () => {
			const date = new Date('2024-05-13')
			const result = addBusinessDays(date, 0)

			expect(result.getDate()).toBe(13)
		})
	})

	describe('formatDeliveryDate', () => {
		it('should format date as "By Weekday, Month Day"', () => {
			const date = new Date('2024-05-18') // Saturday
			const formatted = formatDeliveryDate(date)

			expect(formatted).toBe('By Saturday, May 18')
		})

		it('should handle different months', () => {
			const date = new Date('2024-06-15')
			const formatted = formatDeliveryDate(date)

			expect(formatted).toBe('By Saturday, June 15')
		})
	})

	describe('formatCalendarDate', () => {
		it('should format date as "Month Day"', () => {
			const date = new Date('2024-05-30')
			const formatted = formatCalendarDate(date)

			expect(formatted).toBe('May 30')
		})

		it('should handle different months', () => {
			const date = new Date('2024-12-25')
			const formatted = formatCalendarDate(date)

			expect(formatted).toBe('December 25')
		})
	})

	describe('getStandardDelivery', () => {
		it('should return standard delivery option (5 business days, free)', () => {
			const baseDate = new Date('2024-05-13') // Monday
			const option = getStandardDelivery(baseDate)

			expect(option.speed).toBe('standard')
			expect(option.label).toBe('Standard Delivery')
			expect(option.cost).toBe(0)
			expect(option.estimatedDate.getDate()).toBe(20) // Monday + 5 business days
		})
	})

	describe('getExpressDelivery', () => {
		it('should return express delivery option (3 business days, $9)', () => {
			const baseDate = new Date('2024-05-13') // Monday
			const option = getExpressDelivery(baseDate)

			expect(option.speed).toBe('express')
			expect(option.label).toBe('Express Delivery')
			expect(option.cost).toBe(9.0)
			expect(option.estimatedDate.getDate()).toBe(16) // Monday + 3 business days = Thursday
		})
	})

	describe('getCustomDelivery', () => {
		it('should return custom delivery option with selected date', () => {
			const selectedDate = new Date('2024-05-30')
			const option = getCustomDelivery(selectedDate)

			expect(option.speed).toBe('custom')
			expect(option.label).toBe('Select a date')
			expect(option.cost).toBe(0)
			expect(option.estimatedDate).toEqual(selectedDate)
			expect(option.description).toBe('Select a date: May 30')
		})
	})

	describe('isDateAvailable', () => {
		it('should return false for past dates', () => {
			const baseDate = new Date('2024-05-13')
			const pastDate = new Date('2024-05-10')

			expect(isDateAvailable(pastDate, baseDate)).toBe(false)
		})

		it('should return false for dates before standard delivery', () => {
			const baseDate = new Date('2024-05-13') // Monday
			const tooEarlyDate = new Date('2024-05-17') // Friday (before standard delivery on Monday 20th)

			expect(isDateAvailable(tooEarlyDate, baseDate)).toBe(false)
		})

		it('should return true for dates on or after standard delivery', () => {
			const baseDate = new Date('2024-05-13') // Monday
			const validDate = new Date('2024-05-20') // Monday (standard delivery date)

			expect(isDateAvailable(validDate, baseDate)).toBe(true)
		})

		it('should return true for future dates after standard delivery', () => {
			const baseDate = new Date('2024-05-13')
			const futureDate = new Date('2024-05-30')

			expect(isDateAvailable(futureDate, baseDate)).toBe(true)
		})
	})

	describe('isSameDay', () => {
		it('should return true for same date', () => {
			const date1 = new Date('2024-05-13T10:00:00')
			const date2 = new Date('2024-05-13T15:30:00')

			expect(isSameDay(date1, date2)).toBe(true)
		})

		it('should return false for different dates', () => {
			const date1 = new Date('2024-05-13')
			const date2 = new Date('2024-05-14')

			expect(isSameDay(date1, date2)).toBe(false)
		})

		it('should return false for different months', () => {
			const date1 = new Date('2024-05-13')
			const date2 = new Date('2024-06-13')

			expect(isSameDay(date1, date2)).toBe(false)
		})

		it('should return false for different years', () => {
			const date1 = new Date('2024-05-13')
			const date2 = new Date('2025-05-13')

			expect(isSameDay(date1, date2)).toBe(false)
		})
	})

	describe('calculateShippingCost', () => {
		it('should return 0 for standard delivery', () => {
			expect(calculateShippingCost('standard')).toBe(0)
		})

		it('should return 9.00 for express delivery', () => {
			expect(calculateShippingCost('express')).toBe(9.0)
		})

		it('should return 0 for custom delivery', () => {
			expect(calculateShippingCost('custom')).toBe(0)
		})
	})

	describe('calculateTaxes', () => {
		it('should calculate 8% tax on subtotal + shipping', () => {
			const subtotal = 1199
			const shipping = 0
			const taxes = calculateTaxes(subtotal, shipping)

			expect(taxes).toBeCloseTo(95.92, 2)
		})

		it('should include shipping in tax calculation', () => {
			const subtotal = 1199
			const shipping = 9
			const taxes = calculateTaxes(subtotal, shipping)

			// (1199 + 9) * 0.08 = 96.64
			expect(taxes).toBeCloseTo(96.64, 2)
		})

		it('should handle zero subtotal', () => {
			const taxes = calculateTaxes(0, 0)
			expect(taxes).toBe(0)
		})
	})
})
