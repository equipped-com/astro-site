'use client'

import { Check } from 'lucide-react'
import type { DeliveryOption as DeliveryOptionType } from '@/lib/delivery-dates'
import { cn } from '@/lib/utils'

interface DeliveryOptionProps {
	option: DeliveryOptionType
	isSelected: boolean
	onSelect: () => void
	showCalendar?: boolean
	customDateLabel?: string
}

export default function DeliveryOption({
	option,
	isSelected,
	onSelect,
	showCalendar = false,
	customDateLabel,
}: DeliveryOptionProps) {
	const displayDescription = customDateLabel || option.description
	const displayCost = option.cost === 0 ? 'Free' : `$${option.cost.toFixed(2)}`

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				'w-full rounded-lg border-2 p-4 transition-all text-left',
				'hover:border-primary hover:bg-accent',
				isSelected ? 'border-primary bg-accent' : 'border-border',
				'relative',
			)}
		>
			{/* Radio Circle */}
			<div className="flex items-start gap-4">
				<div
					className={cn(
						'mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
						isSelected ? 'border-primary bg-primary' : 'border-muted-foreground',
					)}
				>
					{isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
				</div>

				{/* Content */}
				<div className="flex-1">
					<div className="font-medium text-sm mb-1">{displayDescription}</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">{option.label}</span>
						<span className={cn('text-sm font-medium', option.cost === 0 ? 'text-muted-foreground' : 'text-primary')}>
							{displayCost}
						</span>
					</div>
				</div>
			</div>

			{/* Calendar placeholder indicator */}
			{showCalendar && isSelected && (
				<div className="mt-3 pt-3 border-t border-border">
					<div className="text-xs text-muted-foreground">Calendar opens below</div>
				</div>
			)}
		</button>
	)
}
