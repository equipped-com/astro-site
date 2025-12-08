/**
 * Alchemy API Types
 *
 * Alchemy is Apple's official trade-in partner for device valuation.
 * These types represent the expected API structure based on their
 * trade-in flow requirements.
 */

export interface DeviceModel {
	model: string
	year: number
	color: string
	storage?: string
	specs?: Record<string, string>
	imageUrl?: string
}

export interface DeviceLookupResponse {
	success: boolean
	serial: string
	device?: DeviceModel
	error?: string
}

export interface ConditionQuestion {
	id: string
	question: string
	category: 'functional' | 'cosmetic' | 'accessories'
	impactLevel: 'high' | 'medium' | 'low'
}

export type ConditionGrade = 'excellent' | 'good' | 'fair' | 'poor'

export interface ConditionAssessment {
	powerOn: boolean
	screenCondition: boolean
	cosmeticDamage: boolean
	keyboardTrackpad: boolean
	batteryHealth?: boolean
	portsWorking?: boolean
	findMyDisabled?: boolean
}

export interface ValuationRequest {
	serial: string
	model: string
	condition: ConditionAssessment
}

export interface ValuationResponse {
	success: boolean
	serial: string
	model: string
	conditionGrade: ConditionGrade
	estimatedValue: number
	originalValue?: number
	breakdown?: {
		baseValue: number
		conditionMultiplier: number
		finalValue: number
	}
	expiresAt: string
	valuationId: string
	error?: string
}

export interface FindMyStatusResponse {
	success: boolean
	serial: string
	findMyEnabled: boolean
	activationLocked: boolean
	error?: string
}

export interface TradeInItem {
	id: string
	serial: string
	model: string
	year: number
	color: string
	conditionGrade: ConditionGrade
	estimatedValue: number
	valuationId: string
	expiresAt: string
	status: 'pending' | 'accepted' | 'shipped' | 'received' | 'processed'
}
