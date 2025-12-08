'use client'

import { ArrowLeft, Calendar, Check, Loader2, Mail, MapPin, Package, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/types'

interface OnboardingStep4Props {
	data: OnboardingData
	onSubmit: () => Promise<void>
	onBack: () => void
}

export default function OnboardingStep4({ data, onSubmit, onBack }: OnboardingStep4Props) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit() {
		setIsSubmitting(true)
		try {
			await onSubmit()
		} catch (error) {
			console.error('Submission error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
			<p className="text-sm text-muted-foreground mb-6">Review the details before completing onboarding</p>

			<div className="space-y-6">
				{/* Employee Info */}
				<div className="rounded-lg border border-border p-4">
					<div className="flex items-start gap-3 mb-3">
						<User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<h4 className="font-semibold text-sm mb-3">Employee Information</h4>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Name:</dt>
									<dd className="font-medium">
										{data.employee.firstName} {data.employee.lastName}
									</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Email:</dt>
									<dd className="font-medium">{data.employee.email}</dd>
								</div>
								{data.employee.phone && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Phone:</dt>
										<dd className="font-medium">{data.employee.phone}</dd>
									</div>
								)}
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Role:</dt>
									<dd className="font-medium">{data.employee.role}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Department:</dt>
									<dd className="font-medium">{data.employee.department}</dd>
								</div>
								{data.employee.title && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Title:</dt>
										<dd className="font-medium">{data.employee.title}</dd>
									</div>
								)}
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Start Date:</dt>
									<dd className="font-medium">
										{data.employee.startDate.toLocaleDateString('en-US', {
											weekday: 'short',
											year: 'numeric',
											month: 'short',
											day: 'numeric',
										})}
									</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>

				{/* Device Package */}
				{data.devicePackage && (
					<div className="rounded-lg border border-border p-4">
						<div className="flex items-start gap-3 mb-3">
							<Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<h4 className="font-semibold text-sm mb-3">Equipment Package</h4>
								<div className="mb-3">
									<div className="font-medium text-sm">{data.devicePackage.name}</div>
									<div className="text-xs text-muted-foreground mt-0.5">{data.devicePackage.description}</div>
								</div>
								<div className="space-y-1.5 mb-3">
									{data.devicePackage.devices.map(device => (
										<div key={device.name} className="flex items-center gap-2 text-sm">
											<Check className="h-3 w-3 text-primary flex-shrink-0" />
											<span>
												{device.quantity > 1 ? `${device.quantity}x ` : ''}
												{device.name}
											</span>
										</div>
									))}
								</div>
								<div className="pt-3 border-t border-border flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Total Cost:</span>
									<span className="font-bold text-lg">${data.devicePackage.totalCost.toLocaleString()}</span>
								</div>
								{data.devicePackage.isLeasing && data.devicePackage.monthlyCost && (
									<div className="text-xs text-muted-foreground mt-1 text-right">
										or ${data.devicePackage.monthlyCost}/mo with leasing
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Delivery Details */}
				{data.delivery && (
					<div className="rounded-lg border border-border p-4">
						<div className="flex items-start gap-3 mb-3">
							<Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<h4 className="font-semibold text-sm mb-3">Delivery Details</h4>
								<dl className="space-y-2 text-sm mb-4">
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Delivery Date:</dt>
										<dd className="font-medium">
											{data.delivery.deliveryDate.toLocaleDateString('en-US', {
												weekday: 'short',
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										</dd>
									</div>
								</dl>

								<div className="flex items-start gap-2">
									<MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
									<div className="text-sm">
										<div>{data.delivery.shippingAddress.addressLine1}</div>
										{data.delivery.shippingAddress.addressLine2 && (
											<div>{data.delivery.shippingAddress.addressLine2}</div>
										)}
										<div>
											{data.delivery.shippingAddress.city}, {data.delivery.shippingAddress.state}{' '}
											{data.delivery.shippingAddress.zipCode}
										</div>
										<div>{data.delivery.shippingAddress.country}</div>
										<div className="text-muted-foreground mt-1">{data.delivery.shippingAddress.phone}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* What happens next */}
				<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
					<div className="flex items-start gap-3">
						<Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<h4 className="font-semibold text-sm mb-2">What happens next?</h4>
							<ul className="space-y-1.5 text-sm text-muted-foreground">
								<li className="flex items-start gap-2">
									<Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
									<span>Employee will be added to your directory</span>
								</li>
								{data.devicePackage && (
									<>
										<li className="flex items-start gap-2">
											<Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
											<span>Order will be created and assigned to the employee</span>
										</li>
										<li className="flex items-start gap-2">
											<Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
											<span>Welcome email will be sent with tracking information</span>
										</li>
									</>
								)}
								<li className="flex items-start gap-2">
									<Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
									<span>You'll receive a confirmation notification</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between mt-6">
				<button
					type="button"
					onClick={onBack}
					disabled={isSubmitting}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium',
						'border border-border hover:bg-accent transition-colors',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium',
						'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Submitting...
						</>
					) : (
						<>
							<Check className="h-4 w-4" />
							Complete Onboarding
						</>
					)}
				</button>
			</div>
		</div>
	)
}
