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

export interface OrderContext {
	assignment: AssignmentData
	// Future: shipping, delivery, payment, etc.
}
