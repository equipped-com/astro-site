'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/types'
import OnboardingStep1 from './OnboardingStep1'
import OnboardingStep2 from './OnboardingStep2'
import OnboardingStep3 from './OnboardingStep3'
import OnboardingStep4 from './OnboardingStep4'

interface OnboardingWizardProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

type Step = 1 | 2 | 3 | 4

const STEPS = [
	{ step: 1, title: 'Employee Info' },
	{ step: 2, title: 'Select Equipment' },
	{ step: 3, title: 'Delivery Details' },
	{ step: 4, title: 'Review & Submit' },
]

export default function OnboardingWizard({ isOpen, onClose, onSuccess }: OnboardingWizardProps) {
	const [currentStep, setCurrentStep] = useState<Step>(1)
	const [onboardingData, setOnboardingData] = useState<OnboardingData>({
		employee: {
			firstName: '',
			lastName: '',
			email: '',
			startDate: new Date(),
			role: '',
			department: '',
		},
	})

	function handleStep1Continue(employee: OnboardingData['employee']) {
		setOnboardingData({ ...onboardingData, employee })
		setCurrentStep(2)
	}

	function handleStep2Continue(devicePackage: OnboardingData['devicePackage']) {
		setOnboardingData({ ...onboardingData, devicePackage })
		setCurrentStep(3)
	}

	function handleStep3Continue(delivery: OnboardingData['delivery']) {
		setOnboardingData({ ...onboardingData, delivery })
		setCurrentStep(4)
	}

	async function handleStep4Submit() {
		try {
			// Create person
			const personResponse = await fetch('/api/people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					first_name: onboardingData.employee.firstName,
					last_name: onboardingData.employee.lastName,
					email: onboardingData.employee.email,
					phone: onboardingData.employee.phone || null,
					title: onboardingData.employee.title || null,
					department: onboardingData.employee.department,
					start_date: onboardingData.employee.startDate.toISOString(),
					status: 'onboarding',
					has_platform_access: 0,
				}),
			})

			if (!personResponse.ok) {
				throw new Error('Failed to create person')
			}

			const person = await personResponse.json()

			// Create order with assignment (if device package selected)
			if (onboardingData.devicePackage) {
				const orderResponse = await fetch('/api/orders', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						person_id: person.id,
						device_package: onboardingData.devicePackage,
						delivery: onboardingData.delivery,
						order_type: 'onboarding',
					}),
				})

				if (!orderResponse.ok) {
					throw new Error('Failed to create order')
				}
			}

			// Send welcome email (this would be handled by backend)
			// For now, just close and refresh

			onSuccess()
			onClose()
		} catch (error) {
			console.error('Onboarding failed:', error)
			alert('Failed to complete onboarding. Please try again.')
		}
	}

	function handleBack() {
		if (currentStep > 1) {
			setCurrentStep((currentStep - 1) as Step)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<div>
						<h2 className="text-xl font-bold">Onboard New Hire</h2>
						<p className="text-sm text-muted-foreground">Setup new employee with equipment for day one</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Step Indicator */}
				<div className="border-b border-border px-6 py-4">
					<div className="flex items-center gap-2">
						{STEPS.map((step, idx) => (
							<div key={step.step} className="flex items-center flex-1">
								<div className="flex items-center gap-2 flex-1">
									<div
										className={cn(
											'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
											currentStep === step.step
												? 'bg-primary text-primary-foreground'
												: currentStep > step.step
													? 'bg-primary/20 text-primary'
													: 'bg-muted text-muted-foreground',
										)}
									>
										{step.step}
									</div>
									<span
										className={cn(
											'text-sm font-medium hidden sm:inline',
											currentStep === step.step ? 'text-foreground' : 'text-muted-foreground',
										)}
									>
										{step.title}
									</span>
								</div>
								{idx < STEPS.length - 1 && <div className="h-px bg-border flex-1 mx-2" />}
							</div>
						))}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{currentStep === 1 && (
						<OnboardingStep1 initialData={onboardingData.employee} onContinue={handleStep1Continue} />
					)}
					{currentStep === 2 && (
						<OnboardingStep2
							initialPackage={onboardingData.devicePackage}
							onContinue={handleStep2Continue}
							onBack={handleBack}
						/>
					)}
					{currentStep === 3 && (
						<OnboardingStep3
							startDate={onboardingData.employee.startDate}
							initialDelivery={onboardingData.delivery}
							onContinue={handleStep3Continue}
							onBack={handleBack}
						/>
					)}
					{currentStep === 4 && (
						<OnboardingStep4 data={onboardingData} onSubmit={handleStep4Submit} onBack={handleBack} />
					)}
				</div>
			</div>
		</div>
	)
}
