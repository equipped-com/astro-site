import type { HTMLAttributes } from "astro/types"

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
