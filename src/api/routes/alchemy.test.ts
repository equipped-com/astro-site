/**
 * Alchemy API Routes Tests
 *
 * Test suite for device valuation, lookup, and FindMy status endpoints.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import alchemyRoutes from './alchemy'
import * as alchemyClient from '@/lib/alchemy'
import type { ConditionAssessment, DeviceLookupResponse, FindMyStatusResponse, ValuationResponse } from '@/lib/alchemy'

// Create test app
function createTestApp() {
	const app = new Hono<{ Bindings: Env }>()
	app.route('/api/alchemy', alchemyRoutes)
	return app
}

// Helper to make test requests
async function makeRequest(app: Hono, method: string, path: string, body?: unknown) {
	const request = new Request(`http://localhost/api/alchemy${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : {},
		body: body ? JSON.stringify(body) : undefined,
	})

	return app.fetch(request, {} as Env)
}

describe('Alchemy API Routes', () => {
	let app: Hono

	beforeEach(() => {
		app = createTestApp()
		vi.clearAllMocks()
	})

	/**
	 * @REQ ALY-001 Model lookup returns device info
	 *
	 * Feature: Device Lookup
	 *   Scenario: Look up valid device serial
	 *     Given a valid device serial number
	 *     When the lookup endpoint is called
	 *     Then device information is returned
	 */
	describe('GET /api/alchemy/lookup/:serial', () => {
		it('should return device info for valid serial', async () => {
			// Arrange
			const mockResponse: DeviceLookupResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				device: {
					model: 'MacBook Air M1',
					year: 2021,
					color: 'Space Gray',
					storage: '256GB',
					specs: {
						chip: 'Apple M1',
						memory: '8GB',
						display: '13.3-inch Retina',
					},
				},
			}

			vi.spyOn(alchemyClient, 'lookupDevice').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'GET', '/lookup/C02XYZ123ABC')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.device).toBeDefined()
			expect(data.device.model).toBe('MacBook Air M1')
			expect(data.device.year).toBe(2021)
			expect(alchemyClient.lookupDevice).toHaveBeenCalledWith('C02XYZ123ABC')
		})

		/**
		 * @REQ ALY-004 Error handling for invalid serials
		 *
		 * Feature: Device Lookup
		 *   Scenario: Look up invalid device serial
		 *     Given an invalid device serial number
		 *     When the lookup endpoint is called
		 *     Then an error is returned
		 */
		it('should return 404 for invalid serial', async () => {
			// Arrange
			const mockResponse: DeviceLookupResponse = {
				success: false,
				serial: 'INVALID123',
				error: 'Device not found',
			}

			vi.spyOn(alchemyClient, 'lookupDevice').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'GET', '/lookup/INVALID123')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(404)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Device not found')
		})

		it('should return 404 for empty serial (Hono route not matched)', async () => {
			// Act
			const response = await makeRequest(app, 'GET', '/lookup/')

			// Assert
			// Hono returns 404 HTML page when path param is missing, not JSON
			expect(response.status).toBe(404)
		})

		it('should return 400 for whitespace-only serial', async () => {
			// Act
			const response = await makeRequest(app, 'GET', '/lookup/%20%20%20') // URL-encoded spaces

			// Assert - Check response is JSON first
			expect(response.status).toBe(400)
			const data = await response.json()
			expect(data.error).toContain('Serial number is required')
		})

		it('should handle lookup service errors gracefully', async () => {
			// Arrange
			vi.spyOn(alchemyClient, 'lookupDevice').mockRejectedValue(new Error('Service unavailable'))

			// Act
			const response = await makeRequest(app, 'GET', '/lookup/C02XYZ123ABC')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(500)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Lookup failed')
		})
	})

	/**
	 * @REQ ALY-002 Can get trade-in value by serial
	 *
	 * Feature: Device Valuation
	 *   Scenario: Get valuation for device in excellent condition
	 *     Given a device with excellent condition assessment
	 *     When the valuation endpoint is called
	 *     Then estimated trade-in value is returned
	 */
	describe('POST /api/alchemy/valuation', () => {
		it('should return valuation for excellent condition device', async () => {
			// Arrange
			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: true,
				cosmeticDamage: false,
				keyboardTrackpad: true,
				batteryHealth: true,
				portsWorking: true,
			}

			const mockResponse: ValuationResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				conditionGrade: 'excellent',
				estimatedValue: 600,
				originalValue: 600,
				breakdown: {
					baseValue: 600,
					conditionMultiplier: 1.0,
					finalValue: 600,
				},
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				valuationId: 'VAL-123',
			}

			vi.spyOn(alchemyClient, 'getValuation').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.conditionGrade).toBe('excellent')
			expect(data.estimatedValue).toBe(600)
			expect(data.breakdown).toBeDefined()
			expect(alchemyClient.getValuation).toHaveBeenCalledWith({
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})
		})

		it('should return reduced valuation for poor condition device', async () => {
			// Arrange
			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: false,
				cosmeticDamage: true,
				keyboardTrackpad: false,
				batteryHealth: false,
				portsWorking: false,
			}

			const mockResponse: ValuationResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				conditionGrade: 'poor',
				estimatedValue: 150,
				originalValue: 600,
				breakdown: {
					baseValue: 600,
					conditionMultiplier: 0.25,
					finalValue: 150,
				},
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				valuationId: 'VAL-456',
			}

			vi.spyOn(alchemyClient, 'getValuation').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.conditionGrade).toBe('poor')
			expect(data.estimatedValue).toBe(150)
			expect(data.estimatedValue).toBeLessThan(data.originalValue ?? 0)
		})

		it('should return 400 for missing serial', async () => {
			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				model: 'MacBook Air M1',
				condition: { powerOn: true, screenCondition: true, cosmeticDamage: false, keyboardTrackpad: true },
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Missing required fields')
		})

		it('should return 400 for missing model', async () => {
			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				condition: { powerOn: true, screenCondition: true, cosmeticDamage: false, keyboardTrackpad: true },
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Missing required fields')
		})

		it('should return 400 for missing condition', async () => {
			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Missing required fields')
		})

		it('should return 400 for invalid condition assessment', async () => {
			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition: {
					powerOn: 'yes', // Should be boolean
					screenCondition: true,
					cosmeticDamage: false,
					keyboardTrackpad: true,
				},
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(400)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Invalid condition assessment')
		})

		it('should handle valuation service errors gracefully', async () => {
			// Arrange
			vi.spyOn(alchemyClient, 'getValuation').mockRejectedValue(new Error('Service unavailable'))

			const condition: ConditionAssessment = {
				powerOn: true,
				screenCondition: true,
				cosmeticDamage: false,
				keyboardTrackpad: true,
			}

			// Act
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition,
			})
			const data = await response.json()

			// Assert
			expect(response.status).toBe(500)
			expect(data.success).toBe(false)
			expect(data.error).toContain('Valuation failed')
		})
	})

	/**
	 * @REQ ALY-003 FindMy status checked before trade-in
	 *
	 * Feature: FindMy Status Check
	 *   Scenario: Check device with FindMy disabled
	 *     Given a device with FindMy/Activation Lock disabled
	 *     When the FindMy status endpoint is called
	 *     Then device is eligible for trade-in
	 */
	describe('GET /api/alchemy/findmy/:serial', () => {
		it('should return unlocked status for eligible device', async () => {
			// Arrange
			const mockResponse: FindMyStatusResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				findMyEnabled: false,
				activationLocked: false,
			}

			vi.spyOn(alchemyClient, 'checkFindMyStatus').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'GET', '/findmy/C02XYZ123ABC')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.findMyEnabled).toBe(false)
			expect(data.activationLocked).toBe(false)
			expect(alchemyClient.checkFindMyStatus).toHaveBeenCalledWith('C02XYZ123ABC')
		})

		/**
		 * Feature: FindMy Status Check
		 *   Scenario: Check device with FindMy enabled (activation locked)
		 *     Given a device with FindMy/Activation Lock enabled
		 *     When the FindMy status endpoint is called
		 *     Then device is NOT eligible for trade-in
		 */
		it('should return locked status for ineligible device', async () => {
			// Arrange
			const mockResponse: FindMyStatusResponse = {
				success: true,
				serial: 'C02ABC456DEFX',
				findMyEnabled: true,
				activationLocked: true,
			}

			vi.spyOn(alchemyClient, 'checkFindMyStatus').mockResolvedValue(mockResponse)

			// Act
			const response = await makeRequest(app, 'GET', '/findmy/C02ABC456DEFX')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.findMyEnabled).toBe(true)
			expect(data.activationLocked).toBe(true)
		})

		it('should return 404 for empty serial (Hono route not matched)', async () => {
			// Act
			const response = await makeRequest(app, 'GET', '/findmy/')

			// Assert
			// Hono returns 404 HTML page when path param is missing, not JSON
			expect(response.status).toBe(404)
		})

		it('should return 400 for whitespace-only serial', async () => {
			// Act
			const response = await makeRequest(app, 'GET', '/findmy/%20%20%20') // URL-encoded spaces

			// Assert - Check response is JSON first
			expect(response.status).toBe(400)
			const data = await response.json()
			expect(data.error).toContain('Serial number is required')
		})

		it('should handle FindMy service errors gracefully (default to locked)', async () => {
			// Arrange
			vi.spyOn(alchemyClient, 'checkFindMyStatus').mockRejectedValue(new Error('Service unavailable'))

			// Act
			const response = await makeRequest(app, 'GET', '/findmy/C02XYZ123ABC')
			const data = await response.json()

			// Assert
			expect(response.status).toBe(500)
			expect(data.success).toBe(false)
			expect(data.activationLocked).toBe(true) // Defaults to locked for safety
			expect(data.error).toContain('FindMy check failed')
		})
	})

	/**
	 * REGRESSION TEST
	 * Description: Ensure condition assessment validation rejects invalid types
	 */
	describe('Condition Assessment Validation [REGRESSION]', () => {
		it('should reject condition with non-boolean powerOn', async () => {
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition: {
					powerOn: 'true', // String instead of boolean
					screenCondition: true,
					cosmeticDamage: false,
					keyboardTrackpad: true,
				},
			})
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Invalid condition assessment')
		})

		it('should reject condition with missing required fields', async () => {
			const response = await makeRequest(app, 'POST', '/valuation', {
				serial: 'C02XYZ123ABC',
				model: 'MacBook Air M1',
				condition: {
					powerOn: true,
					screenCondition: true,
					// Missing cosmeticDamage and keyboardTrackpad
				},
			})
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Invalid condition assessment')
		})
	})

	/**
	 * Integration test: Full valuation workflow
	 */
	describe('Integration: Full Valuation Workflow', () => {
		it('should complete full valuation flow: lookup → FindMy check → valuation', async () => {
			// Step 1: Lookup device
			const lookupMock: DeviceLookupResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				device: {
					model: 'MacBook Air M1',
					year: 2021,
					color: 'Space Gray',
					storage: '256GB',
				},
			}
			vi.spyOn(alchemyClient, 'lookupDevice').mockResolvedValue(lookupMock)

			const lookupResponse = await makeRequest(app, 'GET', '/lookup/C02XYZ123ABC')
			const lookupData = await lookupResponse.json()

			expect(lookupData.success).toBe(true)
			expect(lookupData.device.model).toBe('MacBook Air M1')

			// Step 2: Check FindMy status
			const findMyMock: FindMyStatusResponse = {
				success: true,
				serial: 'C02XYZ123ABC',
				findMyEnabled: false,
				activationLocked: false,
			}
			vi.spyOn(alchemyClient, 'checkFindMyStatus').mockResolvedValue(findMyMock)

			const findMyResponse = await makeRequest(app, 'GET', '/findmy/C02XYZ123ABC')
			const findMyData = await findMyResponse.json()

			expect(findMyData.success).toBe(true)
			expect(findMyData.activationLocked).toBe(false)

			// Step 3: Get valuation (only if FindMy is disabled)
			if (!findMyData.activationLocked) {
				const valuationMock: ValuationResponse = {
					success: true,
					serial: 'C02XYZ123ABC',
					model: 'MacBook Air M1',
					conditionGrade: 'excellent',
					estimatedValue: 600,
					expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					valuationId: 'VAL-789',
				}
				vi.spyOn(alchemyClient, 'getValuation').mockResolvedValue(valuationMock)

				const valuationResponse = await makeRequest(app, 'POST', '/valuation', {
					serial: 'C02XYZ123ABC',
					model: lookupData.device.model,
					condition: {
						powerOn: true,
						screenCondition: true,
						cosmeticDamage: false,
						keyboardTrackpad: true,
						batteryHealth: true,
					},
				})
				const valuationData = await valuationResponse.json()

				expect(valuationData.success).toBe(true)
				expect(valuationData.estimatedValue).toBe(600)
			}
		})
	})
})
