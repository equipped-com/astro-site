import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types/cart'

interface PaymentMethodToggleProps {
	value: PaymentMethod
	onChange: (method: PaymentMethod) => void
	className?: string
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
	{
		value: 'buy',
		label: 'Buy',
		description: 'Pay in full',
	},
	{
		value: '24-month',
		label: '24-month',
		description: 'Lease to own',
	},
	{
		value: '36-month',
		label: '36-month',
		description: 'Lease to own',
	},
]

export function PaymentMethodToggle({ value, onChange, className }: PaymentMethodToggleProps) {
	return (
		<div className={cn('space-y-2', className)}>
			<label className="text-sm font-medium">Payment Method</label>
			<div className="grid grid-cols-3 gap-2">
				{PAYMENT_METHODS.map(method => {
					const isSelected = value === method.value
					return (
						<button
							key={method.value}
							type="button"
							onClick={() => onChange(method.value)}
							className={cn(
								'flex flex-col items-center justify-center rounded-lg border-2 px-4 py-3 transition-all',
								isSelected
									? 'border-primary bg-primary/10 text-primary'
									: 'border-muted hover:border-muted-foreground/50',
							)}
						>
							<span className="font-semibold">{method.label}</span>
							<span className="text-xs text-muted-foreground">{method.description}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
