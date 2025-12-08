'use client'

import { ArrowLeftRight, Check, ClipboardCheck, Clock, DollarSign, Laptop, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type {
	ConditionAssessment as ConditionAssessmentType,
	DeviceModel,
	ValuationResponse,
} from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'
import { ConditionAssessment } from './ConditionAssessment'
import { DeviceLookup } from './DeviceLookup'
import { ValuationResult } from './ValuationResult'

type FlowStep = 'lookup' | 'assessment' | 'valuation'

interface TradeInFlowProps {
	onApplyToCart?: (valuation: ValuationResponse) => void
	className?: string
}

export function TradeInFlow({ onApplyToCart, className }: TradeInFlowProps) {
	const [currentStep, setCurrentStep] = useState<FlowStep>('lookup')
	const [serial, setSerial] = useState<string>('')
	const [device, setDevice] = useState<DeviceModel | null>(null)
	const [valuation, setValuation] = useState<ValuationResponse | null>(null)

	const steps = [
		{ id: 'lookup', label: 'Device', icon: Laptop },
		{ id: 'assessment', label: 'Condition', icon: ClipboardCheck },
		{ id: 'valuation', label: 'Value', icon: DollarSign },
	] as const

	function getCurrentStepIndex(): number {
		return steps.findIndex(s => s.id === currentStep)
	}

	function handleDeviceFound(foundSerial: string, foundDevice: DeviceModel) {
		setSerial(foundSerial)
		setDevice(foundDevice)
		setCurrentStep('assessment')
	}

	async function handleConditionComplete(assessment: ConditionAssessmentType) {
		if (!device || !serial) return

		// Get valuation
		const { getValuation } = await import('@/lib/alchemy/client')
		const result = await getValuation({
			serial,
			model: device.model,
			condition: assessment,
		})

		setValuation(result)
		setCurrentStep('valuation')
	}

	function handleApplyToCart(val: ValuationResponse) {
		onApplyToCart?.(val)
		// In real implementation, this would add to cart and navigate
		alert(`Trade-in value of $${val.estimatedValue} would be applied to cart!`)
	}

	function handleStartTradeIn(val: ValuationResponse) {
		// In real implementation, this would start the trade-in process
		alert(`Starting trade-in process for ${val.serial}`)
	}

	function handleScheduleRecycle() {
		// In real implementation, this would open recycling scheduling
		alert('Opening recycling scheduling flow...')
	}

	function handleStartOver() {
		setCurrentStep('lookup')
		setSerial('')
		setDevice(null)
		setValuation(null)
	}

	function goBackToLookup() {
		setCurrentStep('lookup')
	}

	return (
		<div className={cn('max-w-2xl mx-auto', className)}>
			{/* Header */}
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
					<ArrowLeftRight className="h-7 w-7 text-primary" />
				</div>
				<h1 className="text-2xl font-bold text-foreground">Trade In Your Device</h1>
				<p className="mt-2 text-muted-foreground">
					Get credit toward your next purchase by trading in your old device.
				</p>
			</div>

			{/* Step Indicator */}
			<div className="flex items-center justify-center gap-4 mb-8">
				{steps.map((step, index) => {
					const isActive = step.id === currentStep
					const isComplete = getCurrentStepIndex() > index
					const Icon = step.icon

					return (
						<div key={step.id} className="flex items-center gap-4">
							<div className="flex flex-col items-center">
								<div
									className={cn(
										'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: isComplete
												? 'bg-primary/20 text-primary'
												: 'bg-muted text-muted-foreground',
									)}
								>
									<Icon className="h-5 w-5" />
								</div>
								<span
									className={cn(
										'text-xs mt-2 font-medium',
										isActive ? 'text-foreground' : isComplete ? 'text-primary' : 'text-muted-foreground',
									)}
								>
									{step.label}
								</span>
							</div>
							{index < steps.length - 1 && (
								<div className={cn('h-0.5 w-12 mb-6', isComplete ? 'bg-primary' : 'bg-border')} />
							)}
						</div>
					)
				})}
			</div>

			{/* Step Content */}
			<div className="bg-card border border-border rounded-xl p-6">
				{currentStep === 'lookup' && <DeviceLookup onDeviceFound={handleDeviceFound} />}

				{currentStep === 'assessment' && device && (
					<ConditionAssessment
						device={device}
						serial={serial}
						onComplete={handleConditionComplete}
						onBack={goBackToLookup}
					/>
				)}

				{currentStep === 'valuation' && valuation && device && (
					<ValuationResult
						valuation={valuation}
						device={device}
						onApplyToCart={handleApplyToCart}
						onStartTradeIn={handleStartTradeIn}
						onScheduleRecycle={handleScheduleRecycle}
						onStartOver={handleStartOver}
					/>
				)}
			</div>

			{/* Trust Indicators */}
			<div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
				<div className="flex items-center gap-2">
					<ShieldCheck className="h-4 w-4" aria-hidden="true" />
					<span>Secure quotes</span>
				</div>
				<div className="flex items-center gap-2">
					<Clock className="h-4 w-4" aria-hidden="true" />
					<span>30-day price lock</span>
				</div>
				<div className="flex items-center gap-2">
					<Check className="h-4 w-4" aria-hidden="true" />
					<span>Free shipping</span>
				</div>
			</div>
		</div>
	)
}
