import type { HTMLAttributes } from 'astro/types'

export interface Feature {
	icon: astroHTML.JSX.Element
	title: string
	description: string
}

export interface Testimonial {
	quote: string
	author: string
	role: string
	initials: string
}

export interface Stat {
	value: string
	label: string
}

export interface Step {
	number: number
	title: string
	description: string
}

export interface Logo {
	name: string
	src: string
	width: number
	height: number
}

// Checkout types
export interface TeamMember {
	id: string
	name: string
	email: string
	hasAddress?: boolean
	hasPhone?: boolean
}

export interface AssignmentData {
	assignedTo: TeamMember | null
	isUnassigned: boolean
}

export interface ShippingData {
	useAssigneeAddress: boolean
	address?: {
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
}

export interface DeliveryData {
	speed: 'standard' | 'express' | 'custom'
	estimatedDate: Date
	cost: number
	customDate?: Date
}

export interface OrderContext {
	assignment: AssignmentData
	shipping?: ShippingData
	delivery?: DeliveryData
	// Future: payment, etc.
}

// Onboarding types
export interface EmployeeInfo {
	firstName: string
	lastName: string
	email: string
	startDate: Date
	role: string
	department: string
	title?: string
	phone?: string
}

export interface DevicePackage {
	id: string
	name: string
	description: string
	devices: Array<{
		name: string
		quantity: number
	}>
	totalCost: number
	monthlyCost?: number
	isLeasing?: boolean
}

export interface OnboardingDelivery {
	startDate: Date
	deliveryDate: Date
	shippingAddress: {
		addressLine1: string
		addressLine2?: string
		city: string
		state: string
		zipCode: string
		country: string
		phone: string
	}
}

export interface OnboardingData {
	employee: EmployeeInfo
	devicePackage?: DevicePackage
	delivery?: OnboardingDelivery
}
