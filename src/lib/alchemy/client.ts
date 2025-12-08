/**
 * Alchemy API Client
 *
 * Handles communication with Alchemy APIs for device valuation.
 * In production, this would use real API endpoints with proper authentication.
 * For development, uses mock data to simulate the API behavior.
 */

import { calculateConditionGrade, mockDeviceDatabase } from './mock-data'
import type {
	ConditionAssessment,
	ConditionGrade,
	DeviceLookupResponse,
	FindMyStatusResponse,
	ValuationRequest,
	ValuationResponse,
} from './types'

const ALCHEMY_API_URL = import.meta.env.ALCHEMY_API_URL || ''
const ALCHEMY_API_KEY = import.meta.env.ALCHEMY_API_KEY || ''
const USE_MOCK = !ALCHEMY_API_KEY || import.meta.env.DEV

/**
 * Look up device details by serial number
 */
export async function lookupDevice(serial: string): Promise<DeviceLookupResponse> {
	if (USE_MOCK) {
		return mockLookupDevice(serial)
	}

	const response = await fetch(`${ALCHEMY_API_URL}/lookup/${serial}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${ALCHEMY_API_KEY}`,
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		return {
			success: false,
			serial,
			error: `Failed to lookup device: ${response.statusText}`,
		}
	}

	return response.json()
}

/**
 * Get trade-in valuation for a device
 */
export async function getValuation(request: ValuationRequest): Promise<ValuationResponse> {
	if (USE_MOCK) {
		return mockGetValuation(request)
	}

	const response = await fetch(`${ALCHEMY_API_URL}/valuation`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${ALCHEMY_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(request),
	})

	if (!response.ok) {
		return {
			success: false,
			serial: request.serial,
			model: request.model,
			conditionGrade: 'poor',
			estimatedValue: 0,
			expiresAt: '',
			valuationId: '',
			error: `Failed to get valuation: ${response.statusText}`,
		}
	}

	return response.json()
}

/**
 * Check FindMy/Activation Lock status
 */
export async function checkFindMyStatus(serial: string): Promise<FindMyStatusResponse> {
	if (USE_MOCK) {
		return mockCheckFindMyStatus(serial)
	}

	const response = await fetch(`${ALCHEMY_API_URL}/findmy/${serial}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${ALCHEMY_API_KEY}`,
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		return {
			success: false,
			serial,
			findMyEnabled: true,
			activationLocked: true,
			error: `Failed to check FindMy status: ${response.statusText}`,
		}
	}

	return response.json()
}

// Mock implementations for development
function mockLookupDevice(serial: string): DeviceLookupResponse {
	// Simulate API latency
	const normalizedSerial = serial.toUpperCase().trim()

	// Check mock database
	const device = mockDeviceDatabase[normalizedSerial]

	if (device) {
		return {
			success: true,
			serial: normalizedSerial,
			device,
		}
	}

	// Pattern-based lookup for demo serials
	if (normalizedSerial.startsWith('C02') || normalizedSerial.startsWith('F')) {
		// MacBook pattern
		return {
			success: true,
			serial: normalizedSerial,
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
				imageUrl: '/images/devices/macbook-air-m1.jpg',
			},
		}
	}

	return {
		success: false,
		serial: normalizedSerial,
		error: 'Device not found. Please check the serial number and try again.',
	}
}

function mockGetValuation(request: ValuationRequest): ValuationResponse {
	const { serial, model, condition } = request
	const conditionGrade = calculateConditionGrade(condition)

	// Base values by device type (approximate)
	const baseValues: Record<string, number> = {
		'MacBook Air M1': 600,
		'MacBook Air M2': 800,
		'MacBook Pro 14 M1': 1000,
		'MacBook Pro 14 M2': 1200,
		'MacBook Pro 16 M1': 1200,
		'MacBook Pro 16 M2': 1500,
		'iPad Pro 11': 400,
		'iPad Pro 12.9': 550,
		'iPad Air': 300,
		iPhone: 200,
	}

	// Condition multipliers
	const conditionMultipliers: Record<ConditionGrade, number> = {
		excellent: 1.0,
		good: 0.75,
		fair: 0.5,
		poor: 0.25,
	}

	const baseValue = baseValues[model] || 300
	const multiplier = conditionMultipliers[conditionGrade]
	const finalValue = Math.round(baseValue * multiplier)

	// Generate expiration date (30 days from now)
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

	// Generate unique valuation ID
	const valuationId = `VAL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

	return {
		success: true,
		serial,
		model,
		conditionGrade,
		estimatedValue: finalValue,
		originalValue: baseValue,
		breakdown: {
			baseValue,
			conditionMultiplier: multiplier,
			finalValue,
		},
		expiresAt,
		valuationId,
	}
}

function mockCheckFindMyStatus(serial: string): FindMyStatusResponse {
	// For demo purposes, most devices are cleared
	// Serials ending in 'X' are locked for demo
	const isLocked = serial.endsWith('X')

	return {
		success: true,
		serial,
		findMyEnabled: isLocked,
		activationLocked: isLocked,
	}
}
