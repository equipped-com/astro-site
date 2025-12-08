'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DevicePackage } from '@/types'
import DevicePackageSelector from './DevicePackageSelector'

interface OnboardingStep2Props {
	initialPackage?: DevicePackage
	onContinue: (devicePackage: DevicePackage) => void
	onBack: () => void
}

// Pre-configured device packages
const DEVICE_PACKAGES: DevicePackage[] = [
	{
		id: 'eng-standard',
		name: 'Engineering Standard',
		description: 'Complete setup for software engineers and technical roles',
		devices: [
			{ name: 'MacBook Pro 14"', quantity: 1 },
			{ name: 'Magic Keyboard', quantity: 1 },
			{ name: 'Magic Mouse', quantity: 1 },
		],
		totalCost: 2499,
		monthlyCost: 99,
		isLeasing: true,
	},
	{
		id: 'sales-standard',
		name: 'Sales Standard',
		description: 'Mobile-first setup for sales and client-facing roles',
		devices: [
			{ name: 'MacBook Air', quantity: 1 },
			{ name: 'iPad Pro', quantity: 1 },
		],
		totalCost: 1899,
		monthlyCost: 79,
		isLeasing: true,
	},
	{
		id: 'executive',
		name: 'Executive',
		description: 'Premium setup for leadership and executive roles',
		devices: [
			{ name: 'MacBook Pro 16"', quantity: 1 },
			{ name: 'Studio Display', quantity: 1 },
		],
		totalCost: 3999,
		monthlyCost: 149,
		isLeasing: true,
	},
	{
		id: 'design-standard',
		name: 'Design Standard',
		description: 'High-performance setup for designers and creative roles',
		devices: [
			{ name: 'MacBook Pro 16"', quantity: 1 },
			{ name: 'iPad Pro with Apple Pencil', quantity: 1 },
		],
		totalCost: 3299,
		monthlyCost: 129,
		isLeasing: true,
	},
]

export default function OnboardingStep2({ initialPackage, onContinue, onBack }: OnboardingStep2Props) {
	const [selectedPackage, setSelectedPackage] = useState<DevicePackage | null>(initialPackage || null)

	function handleContinue() {
		if (selectedPackage) {
			onContinue(selectedPackage)
		}
	}

	return (
		<div className="w-full max-w-3xl mx-auto">
			<h3 className="text-xl font-semibold mb-2">Select Equipment Package</h3>
			<p className="text-sm text-muted-foreground mb-6">Choose a pre-configured package based on the employee's role</p>

			{/* Package Selector */}
			<DevicePackageSelector
				packages={DEVICE_PACKAGES}
				selectedPackage={selectedPackage}
				onSelect={setSelectedPackage}
			/>

			{/* Cost Summary */}
			{selectedPackage && (
				<div className="mt-6 rounded-lg border border-border bg-accent/50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium text-sm">Total Cost</div>
							<div className="text-xs text-muted-foreground mt-0.5">
								{selectedPackage.isLeasing
									? `Purchase outright or lease for ${selectedPackage.monthlyCost}/mo`
									: 'One-time purchase'}
							</div>
						</div>
						<div className="text-xl font-bold">${selectedPackage.totalCost.toLocaleString()}</div>
					</div>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between mt-6">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium border border-border hover:bg-accent transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

				<button
					type="button"
					onClick={handleContinue}
					disabled={!selectedPackage}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium',
						'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
