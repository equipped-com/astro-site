import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PromoCodeInputProps {
	currentPromoCode?: string
	onApply: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>
	onRemove: () => void
	className?: string
}

export function PromoCodeInput({ currentPromoCode, onApply, onRemove, className }: PromoCodeInputProps) {
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string>()

	async function handleApply() {
		if (!code.trim()) return

		setIsLoading(true)
		setError(undefined)

		try {
			const result = await onApply(code.trim().toUpperCase())
			if (result.success) {
				setCode('')
			} else {
				setError(result.error || 'Invalid promo code')
			}
		} catch (err) {
			setError('Failed to apply promo code')
		} finally {
			setIsLoading(false)
		}
	}

	function handleKeyPress(e: React.KeyboardEvent) {
		if (e.key === 'Enter') {
			handleApply()
		}
	}

	if (currentPromoCode) {
		return (
			<div className={cn('space-y-2', className)}>
				<label className="text-sm font-medium">Promo Code</label>
				<div className="flex items-center gap-2 rounded-lg border bg-green-50 px-4 py-2">
					<Check className="h-4 w-4 text-green-600" />
					<span className="flex-1 font-medium text-green-600">{currentPromoCode}</span>
					<button
						type="button"
						onClick={onRemove}
						className="text-muted-foreground hover:text-foreground"
						aria-label="Remove promo code"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className={cn('space-y-2', className)}>
			<label htmlFor="promo-code" className="text-sm font-medium">
				Promo Code
			</label>
			<div className="flex gap-2">
				<input
					id="promo-code"
					type="text"
					value={code}
					onChange={e => setCode(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder="Enter code"
					disabled={isLoading}
					className={cn(
						'flex-1 rounded-lg border px-4 py-2 text-sm outline-none',
						'focus:border-primary focus:ring-2 focus:ring-primary/20',
						'disabled:cursor-not-allowed disabled:opacity-50',
					)}
				/>
				<button
					type="button"
					onClick={handleApply}
					disabled={!code.trim() || isLoading}
					className={cn(
						'rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground',
						'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
					)}
				>
					{isLoading ? 'Applying...' : 'Apply'}
				</button>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	)
}
