/**
 * Mock Data for Alchemy API Development
 *
 * Provides realistic device data for development and testing.
 */

import type { ConditionAssessment, ConditionGrade, DeviceModel } from './types'

/**
 * Mock device database keyed by serial number
 */
export const mockDeviceDatabase: Record<string, DeviceModel> = {
	C02XYZ123ABC: {
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
	C02ABC456DEF: {
		model: 'MacBook Pro 14 M2',
		year: 2023,
		color: 'Silver',
		storage: '512GB',
		specs: {
			chip: 'Apple M2 Pro',
			memory: '16GB',
			display: '14.2-inch Liquid Retina XDR',
		},
		imageUrl: '/images/devices/macbook-pro-14-m2.jpg',
	},
	F9GNX8L4PQRS: {
		model: 'MacBook Pro 16 M1',
		year: 2021,
		color: 'Space Gray',
		storage: '1TB',
		specs: {
			chip: 'Apple M1 Pro',
			memory: '32GB',
			display: '16.2-inch Liquid Retina XDR',
		},
		imageUrl: '/images/devices/macbook-pro-16-m1.jpg',
	},
	DMPYH2ABC123: {
		model: 'iPad Pro 12.9',
		year: 2022,
		color: 'Space Gray',
		storage: '256GB',
		specs: {
			chip: 'Apple M2',
			connectivity: 'Wi-Fi + Cellular',
			display: '12.9-inch Liquid Retina XDR',
		},
		imageUrl: '/images/devices/ipad-pro-12.jpg',
	},
	FF2ABC123456: {
		model: 'iPhone 14 Pro',
		year: 2022,
		color: 'Deep Purple',
		storage: '256GB',
		specs: {
			chip: 'A16 Bionic',
			display: '6.1-inch Super Retina XDR',
		},
		imageUrl: '/images/devices/iphone-14-pro.jpg',
	},
}

/**
 * Standard condition assessment questions
 */
export const conditionQuestions = [
	{
		id: 'powerOn',
		question: 'Does the device power on?',
		category: 'functional' as const,
		impactLevel: 'high' as const,
	},
	{
		id: 'screenCondition',
		question: 'Is the screen in good condition (no cracks, dead pixels, or discoloration)?',
		category: 'cosmetic' as const,
		impactLevel: 'high' as const,
	},
	{
		id: 'cosmeticDamage',
		question: 'Is the device free of major cosmetic damage (dents, scratches, or scuffs)?',
		category: 'cosmetic' as const,
		impactLevel: 'medium' as const,
	},
	{
		id: 'keyboardTrackpad',
		question: 'Is the keyboard and trackpad fully functional?',
		category: 'functional' as const,
		impactLevel: 'high' as const,
	},
	{
		id: 'batteryHealth',
		question: 'Is the battery health above 80%?',
		category: 'functional' as const,
		impactLevel: 'medium' as const,
	},
	{
		id: 'portsWorking',
		question: 'Are all ports working properly?',
		category: 'functional' as const,
		impactLevel: 'low' as const,
	},
]

/**
 * Calculate condition grade based on assessment answers
 */
export function calculateConditionGrade(assessment: ConditionAssessment): ConditionGrade {
	// Critical checks - device must power on
	if (!assessment.powerOn) {
		return 'poor'
	}

	// Count positive responses
	const checks = [
		assessment.screenCondition,
		!assessment.cosmeticDamage, // Note: question asks about damage, so false = good
		assessment.keyboardTrackpad,
		assessment.batteryHealth ?? true,
		assessment.portsWorking ?? true,
	]

	const positiveCount = checks.filter(Boolean).length
	const totalChecks = checks.length

	const ratio = positiveCount / totalChecks

	if (ratio >= 0.9) return 'excellent'
	if (ratio >= 0.7) return 'good'
	if (ratio >= 0.5) return 'fair'
	return 'poor'
}

/**
 * Get condition grade display info
 */
export function getConditionGradeInfo(grade: ConditionGrade) {
	const gradeInfo = {
		excellent: {
			label: 'Excellent',
			description: 'Minimal wear, fully functional',
			color: 'text-green-600 bg-green-50 border-green-200',
			percentage: '100%',
		},
		good: {
			label: 'Good',
			description: 'Light wear, fully functional',
			color: 'text-blue-600 bg-blue-50 border-blue-200',
			percentage: '75-85%',
		},
		fair: {
			label: 'Fair',
			description: 'Moderate wear, fully functional',
			color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
			percentage: '50-70%',
		},
		poor: {
			label: 'Poor',
			description: 'Significant wear or functional issues',
			color: 'text-red-600 bg-red-50 border-red-200',
			percentage: '25-50%',
		},
	}

	return gradeInfo[grade]
}
