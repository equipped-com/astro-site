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

export type TradeInStatus = 'quote' | 'label_sent' | 'in_transit' | 'received' | 'inspecting' | 'credited' | 'disputed'

export interface ShippingLabel {
	labelId: string
	trackingNumber: string
	carrier: string
	labelUrl: string
	createdAt: string
	expiresAt: string
}

export interface ShipmentTracking {
	trackingNumber: string
	carrier: string
	status: 'label_created' | 'in_transit' | 'delivered' | 'exception'
	currentLocation?: string
	estimatedDelivery?: string
	events: TrackingEvent[]
}

export interface TrackingEvent {
	timestamp: string
	status: string
	location: string
	description: string
}

export interface InspectionResult {
	inspectionId: string
	inspectedAt: string
	actualCondition: ConditionGrade
	estimatedValue: number
	finalValue: number
	adjustmentReason?: string
	requiresApproval: boolean
	inspector?: string
}

export interface ValueAdjustment {
	adjustmentId: string
	originalValue: number
	newValue: number
	reason: string
	createdAt: string
	status: 'pending_approval' | 'approved' | 'disputed' | 'device_returned'
}

export interface TradeInItem {
	id: string
	serial: string
	model: string
	year: number
	color: string
	conditionGrade: ConditionGrade
	estimatedValue: number
	finalValue?: number
	valuationId: string
	expiresAt: string
	status: TradeInStatus
	shippingLabel?: ShippingLabel
	tracking?: ShipmentTracking
	inspection?: InspectionResult
	adjustment?: ValueAdjustment
	creditedAt?: string
	creditAmount?: number
}
