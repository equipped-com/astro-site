'use client'

import { ArrowRight, Calendar, DollarSign, Leaf, Recycle, RefreshCw, ShoppingCart, Sparkles, Truck } from 'lucide-react'
import { useState } from 'react'
import { getConditionGradeInfo } from '@/lib/alchemy/mock-data'
import type { ConditionGrade, DeviceModel, ValuationResponse } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface ValuationResultProps {
	valuation: ValuationResponse
	device: DeviceModel
	onApplyToCart: (valuation: ValuationResponse) => void
	onStartTradeIn: (valuation: ValuationResponse) => void
	onScheduleRecycle?: () => void
	onStartOver: () => void
	className?: string
}

export function ValuationResult({
	valuation,
	device,
	onApplyToCart,
	onStartTradeIn,
	onScheduleRecycle,
	onStartOver,
	className,
}: ValuationResultProps) {
	const [isApplying, setIsApplying] = useState(false)
	const gradeInfo = getConditionGradeInfo(valuation.conditionGrade)
	const isZeroValue = valuation.estimatedValue === 0

	// Format expiration date
	const expiresAt = new Date(valuation.expiresAt)
	const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

	async function handleApplyToCart() {
		setIsApplying(true)
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 500))
		setIsApplying(false)
		onApplyToCart(valuation)
	}

	return (
		<div className={cn('space-y-6', className)}>
			{/* Main Valuation Card */}
			<div className="rounded-xl border border-border bg-card overflow-hidden animate-slide-up">
				{/* Header with gradient */}
				<div
					className={cn(
						'px-6 py-8 text-center',
						isZeroValue
							? 'bg-gradient-to-br from-green-50 to-emerald-50'
							: 'bg-gradient-to-br from-blue-50 to-indigo-50',
					)}
				>
					{isZeroValue ? (
						<>
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
								<Recycle className="h-8 w-8 text-green-600" />
							</div>
							<h2 className="text-2xl font-bold text-foreground">Recycle for Free</h2>
							<p className="mt-2 text-muted-foreground">
								Your device doesn't have trade-in value, but we'll recycle it responsibly.
							</p>
						</>
					) : (
						<>
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
								<DollarSign className="h-8 w-8 text-blue-600" />
							</div>
							<p className="text-sm font-medium text-muted-foreground mb-2">Estimated Trade-In Value</p>
							<div className="text-5xl font-bold text-foreground">${valuation.estimatedValue.toLocaleString()}</div>
							<div className="mt-3 inline-flex items-center gap-2">
								<span
									className={cn(
										'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border',
										gradeInfo.color,
									)}
								>
									{gradeInfo.label} Condition
								</span>
							</div>
						</>
					)}
				</div>

				{/* Details Section */}
				<div className="px-6 py-6 space-y-6">
					{/* Device Summary */}
					<div className="flex items-center justify-between pb-4 border-b border-border">
						<div>
							<p className="font-medium text-foreground">{device.model}</p>
							<p className="text-sm text-muted-foreground">
								{device.year} - {device.color}
								{device.storage ? ` - ${device.storage}` : ''}
							</p>
						</div>
						<div className="text-right">
							<p className="text-xs text-muted-foreground">Serial</p>
							<p className="font-mono text-sm">{valuation.serial}</p>
						</div>
					</div>

					{/* Value Breakdown (if not zero) */}
					{!isZeroValue && valuation.breakdown && (
						<div className="space-y-3">
							<h4 className="text-sm font-medium text-foreground">Value Breakdown</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Base Value</span>
									<span className="text-foreground">${valuation.breakdown.baseValue.toLocaleString()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Condition ({gradeInfo.percentage})</span>
									<span className="text-foreground">x{valuation.breakdown.conditionMultiplier.toFixed(2)}</span>
								</div>
								<div className="flex justify-between font-medium pt-2 border-t border-border">
									<span className="text-foreground">Trade-In Value</span>
									<span className="text-primary">${valuation.breakdown.finalValue.toLocaleString()}</span>
								</div>
							</div>
						</div>
					)}

					{/* Expiration Notice */}
					<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
						<Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
						<div className="text-sm">
							<p className="font-medium text-foreground">Quote valid for {daysUntilExpiry} days</p>
							<p className="text-muted-foreground">
								Expires{' '}
								{expiresAt.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</p>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="px-6 pb-6 space-y-3">
					{isZeroValue ? (
						<>
							{/* Eco-friendly recycling option */}
							<button
								type="button"
								onClick={onScheduleRecycle}
								className={cn(
									'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3',
									'bg-green-600 text-white font-medium hover:bg-green-700 transition-colors',
								)}
							>
								<Leaf className="h-5 w-5" />
								Schedule Free Pickup
							</button>
							<div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Truck className="h-3 w-3" />
									Free shipping
								</span>
								<span className="flex items-center gap-1">
									<Sparkles className="h-3 w-3" />
									Eco-certified
								</span>
							</div>
						</>
					) : (
						<>
							{/* Apply to cart */}
							<button
								type="button"
								onClick={handleApplyToCart}
								disabled={isApplying}
								className={cn(
									'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3',
									'bg-primary text-primary-foreground font-medium hover:bg-primary/90',
									'disabled:opacity-50 transition-colors',
								)}
							>
								<ShoppingCart className="h-5 w-5" />
								Get this value as credit
								<ArrowRight className="h-4 w-4" />
							</button>

							{/* Start trade-in */}
							<button
								type="button"
								onClick={() => onStartTradeIn(valuation)}
								className={cn(
									'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3',
									'border border-border bg-background text-foreground font-medium',
									'hover:bg-muted transition-colors',
								)}
							>
								Start Trade-In
								<ArrowRight className="h-4 w-4" />
							</button>
						</>
					)}
				</div>
			</div>

			{/* What's Next Info */}
			<div className="rounded-lg border border-border bg-card p-6">
				<h4 className="font-medium text-foreground mb-4">What happens next?</h4>
				<div className="space-y-4">
					<div className="flex gap-3">
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium shrink-0">
							1
						</div>
						<div>
							<p className="font-medium text-foreground">{isZeroValue ? 'Schedule pickup' : 'Accept the quote'}</p>
							<p className="text-sm text-muted-foreground">
								{isZeroValue
									? "We'll arrange a convenient pickup time for your device."
									: 'Apply your trade-in credit to your next purchase or start the process.'}
							</p>
						</div>
					</div>
					<div className="flex gap-3">
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium shrink-0">
							2
						</div>
						<div>
							<p className="font-medium text-foreground">Ship your device</p>
							<p className="text-sm text-muted-foreground">
								We'll send you a free prepaid shipping label to send us your device.
							</p>
						</div>
					</div>
					<div className="flex gap-3">
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium shrink-0">
							3
						</div>
						<div>
							<p className="font-medium text-foreground">{isZeroValue ? 'Responsible recycling' : 'Get your credit'}</p>
							<p className="text-sm text-muted-foreground">
								{isZeroValue
									? "Your device will be recycled responsibly and you'll receive a certificate."
									: "Once we verify your device, we'll process your credit within 5-7 business days."}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Start Over */}
			<div className="text-center">
				<button
					type="button"
					onClick={onStartOver}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<RefreshCw className="h-4 w-4" />
					Trade in another device
				</button>
			</div>
		</div>
	)
}
