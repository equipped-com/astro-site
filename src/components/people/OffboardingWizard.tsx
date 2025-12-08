'use client'

import { AlertTriangle, Calendar, CheckCircle2, Laptop, Shield, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/dashboard/Spinner'
import DataWipeRequest from './DataWipeRequest'
import DeviceCollectionScheduler from './DeviceCollectionScheduler'

interface Person {
	id: string
	first_name: string
	last_name: string
	email: string | null
	phone: string | null
	title: string | null
	department: string | null
	location: string | null
	status: 'active' | 'onboarding' | 'offboarding' | 'departed'
	has_platform_access: number
	device_count: number
	start_date: string | null
	end_date: string | null
}

interface Device {
	id: string
	name: string
	serial_number: string | null
	status: 'deployed' | 'available' | 'in_repair' | 'retired'
	device_type: string | null
}

interface OffboardingWizardProps {
	person: Person
	isOpen: boolean
	onClose: () => void
	onComplete: (updatedPerson: Person) => void
}

type Step = 'overview' | 'devices' | 'collection' | 'wipe' | 'confirmation'

export default function OffboardingWizard({ person, isOpen, onClose, onComplete }: OffboardingWizardProps) {
	const [currentStep, setCurrentStep] = useState<Step>('overview')
	const [devices, setDevices] = useState<Device[]>([])
	const [loadingDevices, setLoadingDevices] = useState(false)
	const [lastDay, setLastDay] = useState('')
	const [collectionMethod, setCollectionMethod] = useState<string | null>(null)
	const [wipeOption, setWipeOption] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch devices when wizard opens
	async function fetchDevices() {
		if (devices.length > 0) return // Already loaded

		try {
			setLoadingDevices(true)
			setError(null)
			const response = await fetch(`/api/people/${person.id}/devices`, {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error('Failed to fetch devices')
			}

			const data = await response.json()
			setDevices(data.devices || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load devices')
		} finally {
			setLoadingDevices(false)
		}
	}

	function handleNext() {
		if (currentStep === 'overview') {
			fetchDevices()
			setCurrentStep('devices')
		} else if (currentStep === 'devices') {
			setCurrentStep('collection')
		} else if (currentStep === 'collection') {
			setCurrentStep('wipe')
		} else if (currentStep === 'wipe') {
			setCurrentStep('confirmation')
		}
	}

	function handleBack() {
		if (currentStep === 'devices') setCurrentStep('overview')
		else if (currentStep === 'collection') setCurrentStep('devices')
		else if (currentStep === 'wipe') setCurrentStep('collection')
		else if (currentStep === 'confirmation') setCurrentStep('wipe')
	}

	async function handleComplete() {
		if (!lastDay) {
			setError('Please specify the last day of employment')
			return
		}

		try {
			setIsSubmitting(true)
			setError(null)

			const response = await fetch(`/api/people/${person.id}/offboard`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					end_date: lastDay,
					collection_method: collectionMethod,
					wipe_option: wipeOption,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to complete offboarding')
			}

			const data = await response.json()
			onComplete(data.person)
			handleCloseWizard()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to complete offboarding')
		} finally {
			setIsSubmitting(false)
		}
	}

	function handleCloseWizard() {
		if (!isSubmitting) {
			setCurrentStep('overview')
			setDevices([])
			setLastDay('')
			setCollectionMethod(null)
			setWipeOption(null)
			setError(null)
			onClose()
		}
	}

	function canProceed() {
		if (currentStep === 'overview') return lastDay !== ''
		if (currentStep === 'devices') return true
		if (currentStep === 'collection') return collectionMethod !== null
		if (currentStep === 'wipe') return wipeOption !== null
		return false
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-3xl rounded-lg bg-background shadow-xl max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-6 py-4">
					<div>
						<h2 className="text-xl font-semibold">Offboard Employee</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							{person.first_name} {person.last_name}
						</p>
					</div>
					<button
						type="button"
						onClick={handleCloseWizard}
						disabled={isSubmitting}
						className="rounded-md p-1 hover:bg-muted disabled:opacity-50"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Progress Steps */}
				<div className="border-b border-border px-6 py-4">
					<div className="flex items-center justify-between">
						{[
							{ key: 'overview', label: 'Overview' },
							{ key: 'devices', label: 'Devices' },
							{ key: 'collection', label: 'Collection' },
							{ key: 'wipe', label: 'Data Wipe' },
							{ key: 'confirmation', label: 'Confirm' },
						].map((step, index) => (
							<div key={step.key} className="flex items-center">
								<div
									className={cn(
										'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
										currentStep === step.key
											? 'bg-primary text-white'
											: 'bg-muted text-muted-foreground',
									)}
								>
									{index + 1}
								</div>
								<span
									className={cn(
										'ml-2 text-sm font-medium',
										currentStep === step.key ? 'text-foreground' : 'text-muted-foreground',
									)}
								>
									{step.label}
								</span>
								{index < 4 && <div className="mx-4 h-px w-8 bg-border" />}
							</div>
						))}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{error && (
						<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
							{error}
						</div>
					)}

					{/* Overview Step */}
					{currentStep === 'overview' && (
						<div className="space-y-6">
							<div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
								<div className="flex items-start gap-3">
									<AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-semibold text-orange-900">Starting Offboarding Process</p>
										<p className="mt-1 text-sm text-orange-800">
											This will initiate the offboarding workflow for {person.first_name} {person.last_name}.
											You'll be able to manage device returns, schedule data wipes, and revoke access.
										</p>
									</div>
								</div>
							</div>

							<div>
								<label htmlFor="lastDay" className="block text-sm font-medium mb-2">
									Last Day of Employment <span className="text-red-500">*</span>
								</label>
								<input
									type="date"
									id="lastDay"
									value={lastDay}
									onChange={e => setLastDay(e.target.value)}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<p className="mt-1 text-xs text-muted-foreground">
									Platform access will be automatically revoked on this date
								</p>
							</div>

							<div className="rounded-md border border-border p-4 space-y-3">
								<h3 className="font-semibold text-sm">What happens during offboarding:</h3>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
										<span>Employee status updated to "offboarding"</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
										<span>Devices tracked for return and collection</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
										<span>Secure data wipe scheduled for returned devices</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
										<span>Platform access revoked on last day</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
										<span>Status changed to "departed" after completion</span>
									</li>
								</ul>
							</div>
						</div>
					)}

					{/* Devices Step */}
					{currentStep === 'devices' && (
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Laptop className="h-5 w-5 text-muted-foreground" />
								<h3 className="font-semibold">Assigned Devices</h3>
							</div>

							{loadingDevices ? (
								<div className="flex justify-center py-8">
									<Spinner size="md" />
								</div>
							) : devices.length === 0 ? (
								<div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
									<Laptop className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
									<p className="font-medium text-muted-foreground">No devices assigned</p>
									<p className="text-sm text-muted-foreground mt-1">
										This employee has no devices to return
									</p>
								</div>
							) : (
								<>
									<div className="rounded-md border border-border overflow-hidden">
										<table className="w-full">
											<thead className="bg-muted/50 border-b border-border">
												<tr>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
														Device
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
														Serial Number
													</th>
													<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
														Status
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border">
												{devices.map(device => (
													<tr key={device.id} className="hover:bg-muted/30">
														<td className="px-4 py-3 text-sm font-medium">
															{device.name}
															{device.device_type && (
																<span className="ml-2 text-xs text-muted-foreground">
																	({device.device_type})
																</span>
															)}
														</td>
														<td className="px-4 py-3 text-sm text-muted-foreground">
															{device.serial_number || 'N/A'}
														</td>
														<td className="px-4 py-3">
															<span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
																{device.status.charAt(0).toUpperCase() + device.status.slice(1)}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									<div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
										<p className="font-medium">Total devices: {devices.length}</p>
										<p className="text-xs mt-1">
											These devices will be unassigned when marked as returned
										</p>
									</div>
								</>
							)}
						</div>
					)}

					{/* Collection Step */}
					{currentStep === 'collection' && (
						<DeviceCollectionScheduler
							person={person}
							deviceCount={devices.length}
							onMethodSelected={setCollectionMethod}
							selectedMethod={collectionMethod}
						/>
					)}

					{/* Wipe Step */}
					{currentStep === 'wipe' && (
						<DataWipeRequest
							deviceCount={devices.length}
							onWipeOptionSelected={setWipeOption}
							selectedOption={wipeOption}
						/>
					)}

					{/* Confirmation Step */}
					{currentStep === 'confirmation' && (
						<div className="space-y-6">
							<div className="rounded-lg border border-green-200 bg-green-50 p-4">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-semibold text-green-900">Ready to Complete Offboarding</p>
										<p className="mt-1 text-sm text-green-800">
											Review the summary below and confirm to complete the offboarding process.
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-md border border-border p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Employee
										</p>
										<p className="mt-1 font-medium">
											{person.first_name} {person.last_name}
										</p>
										{person.email && <p className="text-sm text-muted-foreground">{person.email}</p>}
									</div>

									<div className="rounded-md border border-border p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Last Day
										</p>
										<p className="mt-1 font-medium flex items-center gap-2">
											<Calendar className="h-4 w-4" />
											{new Date(lastDay).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
										</p>
									</div>

									<div className="rounded-md border border-border p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Devices
										</p>
										<p className="mt-1 font-medium flex items-center gap-2">
											<Laptop className="h-4 w-4" />
											{devices.length} {devices.length === 1 ? 'device' : 'devices'}
										</p>
									</div>

									<div className="rounded-md border border-border p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Collection Method
										</p>
										<p className="mt-1 font-medium">{collectionMethod || 'Not specified'}</p>
									</div>

									<div className="rounded-md border border-border p-4 col-span-2">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Data Wipe
										</p>
										<p className="mt-1 font-medium flex items-center gap-2">
											<Shield className="h-4 w-4" />
											{wipeOption || 'Not specified'}
										</p>
									</div>
								</div>

								<div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
									<p className="font-medium">Actions on {new Date(lastDay).toLocaleDateString()}:</p>
									<ul className="mt-2 space-y-1 text-xs">
										<li>• Platform access will be revoked</li>
										<li>• Employee status will change to "departed"</li>
										<li>• Devices will be unassigned when returned</li>
									</ul>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className="border-t border-border px-6 py-4 flex justify-between">
					<button
						type="button"
						onClick={currentStep === 'overview' ? handleCloseWizard : handleBack}
						disabled={isSubmitting}
						className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
					>
						{currentStep === 'overview' ? 'Cancel' : 'Back'}
					</button>

					{currentStep === 'confirmation' ? (
						<button
							type="button"
							onClick={handleComplete}
							disabled={isSubmitting}
							className={cn(
								'rounded-md bg-orange-600 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-700',
								'disabled:opacity-50 disabled:cursor-not-allowed',
							)}
						>
							{isSubmitting ? 'Completing...' : 'Complete Offboarding'}
						</button>
					) : (
						<button
							type="button"
							onClick={handleNext}
							disabled={!canProceed()}
							className={cn(
								'rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90',
								'disabled:opacity-50 disabled:cursor-not-allowed',
							)}
						>
							Continue
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
