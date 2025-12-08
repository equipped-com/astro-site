'use client'

import { ArrowRight, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	calculateShippingCost,
	calculateTaxes,
	type DeliveryOption as DeliveryOptionType,
	type DeliverySpeed,
	formatCalendarDate,
	getAllDeliveryOptions,
	getCustomDelivery,
} from '@/lib/delivery-dates'
import { cn } from '@/lib/utils'
import type { DeliveryData } from '@/types'
import DeliveryCalendar from './DeliveryCalendar'
import DeliveryOption from './DeliveryOption'

interface DeliveryStageProps {
	initialDelivery?: DeliveryData
	onContinue: (delivery: DeliveryData) => void
	onCartUpdate?: (shipping: number, taxes: number) => void
	cartSubtotal?: number
}

export default function DeliveryStage({
	initialDelivery,
	onContinue,
	onCartUpdate,
	cartSubtotal = 0,
}: DeliveryStageProps) {
	const baseDate = new Date()
	const availableOptions = getAllDeliveryOptions(baseDate)

	const [selectedSpeed, setSelectedSpeed] = useState<DeliverySpeed | null>(initialDelivery?.speed || null)
	const [customDate, setCustomDate] = useState<Date | undefined>(initialDelivery?.customDate)
	const [showCalendar, setShowCalendar] = useState(false)

	// Update cart totals when delivery selection changes
	useEffect(() => {
		if (selectedSpeed && onCartUpdate) {
			const shipping = calculateShippingCost(selectedSpeed)
			const taxes = calculateTaxes(cartSubtotal, shipping)
			onCartUpdate(shipping, taxes)
		}
	}, [selectedSpeed, cartSubtotal, onCartUpdate])

	function handleOptionSelect(speed: DeliverySpeed) {
		setSelectedSpeed(speed)

		// Show calendar if custom date is selected
		if (speed === 'custom') {
			setShowCalendar(true)
		} else {
			setShowCalendar(false)
			setCustomDate(undefined)
		}
	}

	function handleCustomDateSelect(date: Date) {
		setCustomDate(date)
		setShowCalendar(true)
	}

	function handleContinue() {
		if (!selectedSpeed) return

		let deliveryOption: DeliveryOptionType

		if (selectedSpeed === 'custom' && customDate) {
			deliveryOption = getCustomDelivery(customDate)
		} else {
			const foundOption = availableOptions.find(opt => opt.speed === selectedSpeed)
			if (!foundOption) return
			deliveryOption = foundOption
		}

		const delivery: DeliveryData = {
			speed: selectedSpeed,
			estimatedDate: deliveryOption.estimatedDate,
			cost: deliveryOption.cost,
			customDate: selectedSpeed === 'custom' ? customDate : undefined,
		}

		onContinue(delivery)
	}

	const canContinue = selectedSpeed === 'custom' ? customDate !== undefined : selectedSpeed !== null

	return (
		<div className="w-full max-w-2xl mx-auto">
			{/* Stage Header */}
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
						3
					</div>
					<h2 className="text-lg font-semibold">Delivery</h2>
				</div>
				<div className="border-b border-border" />
			</div>

			{/* Question */}
			<h3 className="text-xl font-semibold mb-6">When would you like to get your order?</h3>

			{/* Delivery Options */}
			<div className="space-y-3 mb-6">
				{/* Standard Delivery */}
				<DeliveryOption
					option={availableOptions[0]}
					isSelected={selectedSpeed === 'standard'}
					onSelect={() => handleOptionSelect('standard')}
				/>

				{/* Express Delivery */}
				<DeliveryOption
					option={availableOptions[1]}
					isSelected={selectedSpeed === 'express'}
					onSelect={() => handleOptionSelect('express')}
				/>

				{/* Custom Date Picker */}
				<DeliveryOption
					option={getCustomDelivery(customDate || new Date())}
					isSelected={selectedSpeed === 'custom'}
					onSelect={() => handleOptionSelect('custom')}
					showCalendar={showCalendar}
					customDateLabel={customDate ? `Select a date: ${formatCalendarDate(customDate)}` : 'Select a date'}
				/>

				{/* Calendar (shown when custom date is selected) */}
				{selectedSpeed === 'custom' && showCalendar && (
					<div className="pl-9">
						<DeliveryCalendar selectedDate={customDate} onDateSelect={handleCustomDateSelect} baseDate={baseDate} />
					</div>
				)}
			</div>

			{/* Delivery Summary */}
			{selectedSpeed && (
				<div className="mb-6 rounded-lg border border-border bg-accent/50 p-4">
					<div className="flex items-start gap-3">
						<Package className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
						<div className="flex-1">
							<div className="font-medium text-sm mb-1">
								{selectedSpeed === 'custom' && customDate
									? `Delivery by ${formatCalendarDate(customDate)}`
									: selectedSpeed === 'express'
										? 'Express delivery selected'
										: 'Standard delivery selected'}
							</div>
							<div className="text-xs text-muted-foreground">
								Shipping cost:{' '}
								{calculateShippingCost(selectedSpeed) === 0
									? 'Free'
									: `$${calculateShippingCost(selectedSpeed).toFixed(2)}`}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Continue Button */}
			<div className="flex justify-end">
				<button
					type="button"
					onClick={handleContinue}
					disabled={!canContinue}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3',
						'text-sm font-medium transition-colors',
						'bg-primary text-primary-foreground hover:bg-primary/90',
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
