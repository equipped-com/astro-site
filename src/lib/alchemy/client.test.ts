/**
 * Alchemy Client Tests
 *
 * Test suite for Alchemy API client library.
 * Tests mock mode behavior (default for development).
 *
 * Note: Real API mode tests are handled via integration tests
 * since import.meta.env is evaluated at import time.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { checkFindMyStatus, getValuation, lookupDevice } from './client'
import type { ConditionAssessment } from './types'

describe('Alchemy Client (Mock Mode)', () => {
	beforeEach(() => {
		// Client uses mock mode when ALCHEMY_API_KEY is not set
	})

	describe('lookupDevice', () => {
		/**
		 * @REQ ALY-001 Model lookup returns device info
		 */
		it('should return device info for known serial (mock)', async () => {
			const result = await lookupDevice('C02XYZ123ABC')

			expect(result.success).toBe(true)
			expect(result.serial).toBe('C02XYZ123ABC')
			expect(result.device).toBeDefined()
			expect(result.device?.model).toBe('MacBook Air M1')
			expect(result.device?.year).toBe(2021)
		})

		it('should normalize serial numbers to uppercase', async () => {
			const result = await lookupDevice('c02xyz123abc')

			expect(result.success).toBe(true)
			expect(result.serial).toBe('C02XYZ123ABC')
		})

		it('should return MacBook pattern for C02 prefix', async () => {
			const result = await lookupDevice('C02UNKNOWN999')

			expect(result.success).toBe(true)
			expect(result.device?.model).toContain('MacBook')
		})

		it('should return MacBook pattern for F prefix', async () => {
			const result = await lookupDevice('F9GNUNKNOWN999')

			expect(result.success).toBe(true)
			expect(result.device?.model).toContain('MacBook')
		})

		/**
		 * @REQ ALY-004 Error handling for invalid serials
		 */
		it('should return error for unknown serial', async () => {
			const result = await lookupDevice('INVALID999XXX')

			expect(result.success).toBe(false)
			expect(result.error).toContain('Device not found')
		})
	})

	describe('getValuation', () => {
		/**
		 * @REQ ALY-002 Can get trade-in value by serial
		 */
		it('should return valuation for excellent condition (mock)', async () => {
			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: true,
				cosmeticDamage: false,
				keyboardTrackpad: true,
				batteryHealth: true,
				portsWorking: true,
			}

			const result = await getValuation({
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})

			expect(result.success).toBe(true)
			expect(result.conditionGrade).toBe('excellent')
			expect(result.estimatedValue).toBe(600) // Base value for M1 Air
			expect(result.breakdown?.conditionMultiplier).toBe(1.0)
		})

		it('should reduce valuation for poor condition (mock)', async () => {
			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: false,
				cosmeticDamage: true,
				keyboardTrackpad: false,
				batteryHealth: false,
				portsWorking: false,
			}

			const result = await getValuation({
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})

			expect(result.success).toBe(true)
			expect(result.conditionGrade).toBe('poor')
			expect(result.estimatedValue).toBe(150) // 25% of base value
			expect(result.breakdown?.conditionMultiplier).toBe(0.25)
		})

		it('should return poor grade for non-functional device', async () => {
			const condition: ConditionAssessment = {
				powerOn: false, // Critical failure
				screenCondition: true,
				cosmeticDamage: false,
				keyboardTrackpad: true,
			}

			const result = await getValuation({
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})

			expect(result.conditionGrade).toBe('poor')
		})

		it('should include valuation ID and expiration', async () => {
			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: true,
				cosmeticDamage: false,
				keyboardTrackpad: true,
			}

			const result = await getValuation({
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})

			expect(result.valuationId).toMatch(/^VAL-/)
			expect(result.expiresAt).toBeTruthy()
			expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
		})
	})

	describe('checkFindMyStatus', () => {
		/**
		 * @REQ ALY-003 FindMy status checked before trade-in
		 */
		it('should return unlocked for normal serials (mock)', async () => {
			const result = await checkFindMyStatus('C02XYZ123ABC')

			expect(result.success).toBe(true)
			expect(result.findMyEnabled).toBe(false)
			expect(result.activationLocked).toBe(false)
		})

		it('should return locked for serials ending in X (mock demo)', async () => {
			const result = await checkFindMyStatus('C02ABC456DEFX')

			expect(result.success).toBe(true)
			expect(result.findMyEnabled).toBe(true)
			expect(result.activationLocked).toBe(true)
		})
	})
})
