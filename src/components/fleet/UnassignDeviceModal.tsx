'use client'

import { Package, Truck, UserX, X } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'
import CollectionScheduler from './CollectionScheduler'

interface Device {
	id: string
	name: string
	model: string
	type: string
	assigned_to?: string
}

interface UnassignDeviceModalProps {
	isOpen: boolean
	device: Device | null
	onClose: () => void
	onSuccess: () => void
}

type CollectionMethod = 'ship_label' | 'schedule_pickup' | 'in_person'

export default function UnassignDeviceModal({ isOpen, device, onClose, onSuccess }: UnassignDeviceModalProps) {
	const [step, setStep] = useState<'confirm' | 'collection'>('confirm')
	const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>('in_person')
	const [notes, setNotes] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	function handleClose() {
		setStep('confirm')
		setCollectionMethod('in_person')
		setNotes('')
		setError(null)
		onClose()
	}

	async function handleUnassign() {
		if (!device) {
			return
		}

		setSubmitting(true)
		setError(null)

		try {
			const response = await fetch('/api/device-assignments/unassign', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: device.id,
					collection_method: collectionMethod,
					notes: notes || undefined,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to unassign device')
			}

			onSuccess()
			handleClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to unassign device')
		} finally {
			setSubmitting(false)
		}
	}

	function handleConfirmUnassign() {
		if (collectionMethod === 'in_person') {
			handleUnassign()
		} else {
			setStep('collection')
		}
	}

	if (!isOpen || !device) {
		return null
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 z-40"
				onClick={handleClose}
				onKeyDown={e => e.key === 'Escape' && handleClose()}
				role="button"
				tabIndex={-1}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-bold">
								{step === 'confirm' ? 'Unassign Device' : 'Schedule Collection'}
							</h2>
							<p className="text-sm text-muted-foreground mt-1">
								{device.name} - {device.model}
							</p>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="p-1 rounded hover:bg-muted transition-colors"
							aria-label="Close"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Error message */}
					{error && (
						<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
							<p className="font-semibold">Error</p>
							<p>{error}</p>
						</div>
					)}

					{step === 'confirm' ? (
						<>
							{/* Collection method selection */}
							<div className="mb-6">
								<label className="block text-sm font-medium mb-3">Collection Method</label>
								<div className="space-y-2">
									<button
										type="button"
										onClick={() => setCollectionMethod('ship_label')}
										className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
											collectionMethod === 'ship_label'
												? 'border-primary bg-primary/5'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<Package className="h-5 w-5 mt-0.5 flex-shrink-0" />
										<div className="flex-1 text-left">
											<p className="font-medium">Ship return label to employee</p>
											<p className="text-sm text-muted-foreground">
												We'll send a prepaid shipping label via email
											</p>
										</div>
									</button>

									<button
										type="button"
										onClick={() => setCollectionMethod('schedule_pickup')}
										className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
											collectionMethod === 'schedule_pickup'
												? 'border-primary bg-primary/5'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<Truck className="h-5 w-5 mt-0.5 flex-shrink-0" />
										<div className="flex-1 text-left">
											<p className="font-medium">Schedule pickup at their address</p>
											<p className="text-sm text-muted-foreground">Courier will collect device from employee</p>
										</div>
									</button>

									<button
										type="button"
										onClick={() => setCollectionMethod('in_person')}
										className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
											collectionMethod === 'in_person'
												? 'border-primary bg-primary/5'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<UserX className="h-5 w-5 mt-0.5 flex-shrink-0" />
										<div className="flex-1 text-left">
											<p className="font-medium">Mark as returned in person</p>
											<p className="text-sm text-muted-foreground">Device already returned to IT</p>
										</div>
									</button>
								</div>
							</div>

							{/* Notes */}
							<div className="mb-6">
								<label className="block text-sm font-medium mb-2" htmlFor="unassign-notes">
									Notes (Optional)
								</label>
								<textarea
									id="unassign-notes"
									value={notes}
									onChange={e => setNotes(e.target.value)}
									placeholder="Reason for return, device condition, etc..."
									rows={3}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
								/>
							</div>

							{/* Actions */}
							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={handleClose}
									disabled={submitting}
									className="rounded-md px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleConfirmUnassign}
									disabled={submitting}
									className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{submitting && <Spinner size="sm" />}
									{submitting ? 'Processing...' : collectionMethod === 'in_person' ? 'Mark as Returned' : 'Continue'}
								</button>
							</div>
						</>
					) : (
						<CollectionScheduler
							device={device}
							collectionMethod={collectionMethod}
							onBack={() => setStep('confirm')}
							onComplete={handleUnassign}
							submitting={submitting}
						/>
					)}
				</div>
			</div>
		</>
	)
}
