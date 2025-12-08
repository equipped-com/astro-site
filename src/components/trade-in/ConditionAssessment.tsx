'use client'

import { CheckCircle2, ChevronRight, HelpCircle, Loader2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { conditionQuestions } from '@/lib/alchemy/mock-data'
import type { ConditionAssessment as ConditionAssessmentType, DeviceModel } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface ConditionAssessmentProps {
	device: DeviceModel
	serial: string
	onComplete: (assessment: ConditionAssessmentType) => void
	onBack?: () => void
	className?: string
}

type QuestionAnswer = boolean | null

export function ConditionAssessment({ device, serial, onComplete, onBack, className }: ConditionAssessmentProps) {
	const [currentStep, setCurrentStep] = useState(0)
	const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const questions = conditionQuestions
	const currentQuestion = questions[currentStep]
	const isLastQuestion = currentStep === questions.length - 1
	const progress = ((currentStep + 1) / questions.length) * 100

	function handleAnswer(value: boolean) {
		setAnswers(prev => ({
			...prev,
			[currentQuestion.id]: value,
		}))

		if (!isLastQuestion) {
			// Small delay for visual feedback
			setTimeout(() => {
				setCurrentStep(prev => prev + 1)
			}, 200)
		}
	}

	async function handleSubmit() {
		if (Object.keys(answers).length < questions.length) {
			return
		}

		setIsSubmitting(true)

		// Convert answers to ConditionAssessment type
		const assessment: ConditionAssessmentType = {
			powerOn: answers.powerOn ?? false,
			screenCondition: answers.screenCondition ?? false,
			cosmeticDamage: !(answers.cosmeticDamage ?? true), // Question is inverted
			keyboardTrackpad: answers.keyboardTrackpad ?? false,
			batteryHealth: answers.batteryHealth ?? undefined,
			portsWorking: answers.portsWorking ?? undefined,
		}

		// Small delay for UX
		await new Promise(resolve => setTimeout(resolve, 300))
		setIsSubmitting(false)
		onComplete(assessment)
	}

	function goToPrevious() {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1)
		} else {
			onBack?.()
		}
	}

	return (
		<div className={cn('space-y-6', className)}>
			{/* Device Info Header */}
			<div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
				<div>
					<p className="text-sm text-muted-foreground">Assessing device</p>
					<p className="font-medium text-foreground">{device.model}</p>
				</div>
				<div className="text-right">
					<p className="text-sm text-muted-foreground">Serial</p>
					<p className="font-mono text-sm text-foreground">{serial}</p>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						Question {currentStep + 1} of {questions.length}
					</span>
					<span className="text-muted-foreground">{Math.round(progress)}% complete</span>
				</div>
				<div className="h-2 rounded-full bg-muted overflow-hidden">
					<div
						className="h-full rounded-full bg-primary transition-all duration-300"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Question Card */}
			<div className="rounded-lg border border-border bg-card p-6">
				<div className="space-y-6">
					{/* Question */}
					<div className="text-center">
						<span
							className={cn(
								'inline-block rounded-full px-3 py-1 text-xs font-medium mb-4',
								currentQuestion.impactLevel === 'high'
									? 'bg-red-50 text-red-600 border border-red-200'
									: currentQuestion.impactLevel === 'medium'
										? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
										: 'bg-blue-50 text-blue-600 border border-blue-200',
							)}
						>
							{currentQuestion.impactLevel === 'high'
								? 'High Impact'
								: currentQuestion.impactLevel === 'medium'
									? 'Medium Impact'
									: 'Low Impact'}
						</span>
						<h3 className="text-xl font-semibold text-foreground">{currentQuestion.question}</h3>
						<p className="mt-2 text-sm text-muted-foreground">Answer honestly for an accurate valuation</p>
					</div>

					{/* Answer Buttons */}
					<div className="flex gap-4 justify-center">
						<button
							type="button"
							onClick={() => handleAnswer(true)}
							className={cn(
								'flex items-center gap-3 rounded-lg border-2 px-6 py-4 transition-all',
								'hover:border-green-500 hover:bg-green-50',
								answers[currentQuestion.id] === true ? 'border-green-500 bg-green-50' : 'border-border',
							)}
						>
							<CheckCircle2
								className={cn(
									'h-6 w-6',
									answers[currentQuestion.id] === true ? 'text-green-500' : 'text-muted-foreground',
								)}
							/>
							<span className="font-medium">Yes</span>
						</button>
						<button
							type="button"
							onClick={() => handleAnswer(false)}
							className={cn(
								'flex items-center gap-3 rounded-lg border-2 px-6 py-4 transition-all',
								'hover:border-red-500 hover:bg-red-50',
								answers[currentQuestion.id] === false ? 'border-red-500 bg-red-50' : 'border-border',
							)}
						>
							<XCircle
								className={cn(
									'h-6 w-6',
									answers[currentQuestion.id] === false ? 'text-red-500' : 'text-muted-foreground',
								)}
							/>
							<span className="font-medium">No</span>
						</button>
					</div>

					{/* Help Text */}
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<HelpCircle className="h-4 w-4" />
						<span>
							This affects your trade-in value by approximately{' '}
							{currentQuestion.impactLevel === 'high'
								? '30-50%'
								: currentQuestion.impactLevel === 'medium'
									? '10-20%'
									: '5-10%'}
						</span>
					</div>
				</div>
			</div>

			{/* Progress Dots */}
			<div className="flex justify-center gap-2">
				{questions.map((q, index) => (
					<button
						type="button"
						key={q.id}
						onClick={() => index < currentStep && setCurrentStep(index)}
						className={cn(
							'h-2 w-2 rounded-full transition-all',
							index === currentStep
								? 'bg-primary w-6'
								: index < currentStep
									? 'bg-primary/60 hover:bg-primary/80 cursor-pointer'
									: 'bg-muted',
						)}
						disabled={index > currentStep}
						aria-label={`Go to question ${index + 1}`}
					/>
				))}
			</div>

			{/* Navigation */}
			<div className="flex justify-between">
				<button
					type="button"
					onClick={goToPrevious}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ChevronRight className="h-4 w-4 rotate-180" />
					{currentStep === 0 ? 'Back to lookup' : 'Previous question'}
				</button>

				{isLastQuestion && answers[currentQuestion.id] !== undefined && (
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className={cn(
							'inline-flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium',
							'bg-primary text-primary-foreground hover:bg-primary/90',
							'disabled:opacity-50 transition-colors',
						)}
					>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								Get Valuation
								<ChevronRight className="h-4 w-4" />
							</>
						)}
					</button>
				)}
			</div>
		</div>
	)
}
