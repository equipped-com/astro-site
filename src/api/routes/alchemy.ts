/**
 * Alchemy API Routes
 *
 * Exposes Alchemy device valuation and lookup endpoints.
 * These endpoints integrate with Alchemy's trade-in and device verification services.
 */
import { Hono } from 'hono'
import { checkFindMyStatus, getValuation, lookupDevice } from '@/lib/alchemy'

const alchemy = new Hono<{ Bindings: Env }>()

/**
 * GET /api/alchemy/lookup/:serial
 *
 * Look up device information by serial number.
 * Returns device model, year, specs, etc.
 *
 * @REQ ALY-001 Model lookup returns device info
 *
 * Path params:
 *   - serial: Device serial number (normalized to uppercase)
 *
 * Response: DeviceLookupResponse
 *   { success: true, serial: string, device: DeviceModel }
 *   OR
 *   { success: false, serial: string, error: string }
 */
alchemy.get('/lookup/:serial', async c => {
	const serial = c.req.param('serial')

	if (!serial || serial.trim().length === 0) {
		return c.json({ success: false, error: 'Serial number is required' }, 400)
	}

	try {
		const result = await lookupDevice(serial)
		return c.json(result, result.success ? 200 : 404)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json(
			{
				success: false,
				serial,
				error: `Lookup failed: ${message}`,
			},
			500,
		)
	}
})

/**
 * POST /api/alchemy/valuation
 *
 * Get trade-in valuation for a device based on serial, model, and condition.
 * Returns estimated value and breakdown.
 *
 * @REQ ALY-002 Can get trade-in value by serial
 *
 * Request body:
 *   - serial: string (required)
 *   - model: string (required)
 *   - condition: ConditionAssessment (required)
 *     {
 *       powerOn: boolean
 *       screenCondition: boolean
 *       cosmeticDamage: boolean
 *       keyboardTrackpad: boolean
 *       batteryHealth?: boolean
 *       portsWorking?: boolean
 *       findMyDisabled?: boolean
 *     }
 *
 * Response: ValuationResponse
 *   {
 *     success: true,
 *     serial: string,
 *     model: string,
 *     conditionGrade: 'excellent' | 'good' | 'fair' | 'poor',
 *     estimatedValue: number,
 *     originalValue?: number,
 *     breakdown?: {
 *       baseValue: number,
 *       conditionMultiplier: number,
 *       finalValue: number
 *     },
 *     expiresAt: string (ISO timestamp),
 *     valuationId: string
 *   }
 */
alchemy.post('/valuation', async c => {
	try {
		const body = await c.req.json()

		// Validate required fields
		if (!body.serial || !body.model || !body.condition) {
			return c.json(
				{
					success: false,
					error: 'Missing required fields: serial, model, condition',
				},
				400,
			)
		}

		// Validate condition assessment structure
		const condition = body.condition
		if (
			typeof condition.powerOn !== 'boolean' ||
			typeof condition.screenCondition !== 'boolean' ||
			typeof condition.cosmeticDamage !== 'boolean' ||
			typeof condition.keyboardTrackpad !== 'boolean'
		) {
			return c.json(
				{
					success: false,
					error:
						'Invalid condition assessment: powerOn, screenCondition, cosmeticDamage, and keyboardTrackpad must be boolean',
				},
				400,
			)
		}

		const result = await getValuation({
			serial: body.serial,
			model: body.model,
			condition,
		})

		return c.json(result, result.success ? 200 : 400)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json(
			{
				success: false,
				error: `Valuation failed: ${message}`,
			},
			500,
		)
	}
})

/**
 * GET /api/alchemy/findmy/:serial
 *
 * Check FindMy/Activation Lock status for a device.
 * Critical for trade-in eligibility - locked devices cannot be resold.
 *
 * @REQ ALY-003 FindMy status checked before trade-in
 *
 * Path params:
 *   - serial: Device serial number (normalized to uppercase)
 *
 * Response: FindMyStatusResponse
 *   {
 *     success: true,
 *     serial: string,
 *     findMyEnabled: boolean,
 *     activationLocked: boolean
 *   }
 *
 * Note: If activationLocked is true, device is NOT eligible for trade-in
 */
alchemy.get('/findmy/:serial', async c => {
	const serial = c.req.param('serial')

	if (!serial || serial.trim().length === 0) {
		return c.json({ success: false, error: 'Serial number is required' }, 400)
	}

	try {
		const result = await checkFindMyStatus(serial)
		return c.json(result, result.success ? 200 : 400)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return c.json(
			{
				success: false,
				serial,
				findMyEnabled: true, // Default to locked for safety
				activationLocked: true,
				error: `FindMy check failed: ${message}`,
			},
			500,
		)
	}
})

export default alchemy
