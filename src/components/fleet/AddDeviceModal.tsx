'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'
import type { Device } from '@/lib/scoped-queries'

interface AddDeviceModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: (device: Device) => void
}

interface FormData {
	name: string
	type: string
	model: string
	serial_number: string
	status: Device['status']
	assigned_to: string
}

export default function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
	const [formData, setFormData] = useState<FormData>({
		name: '',
		type: '',
		model: '',
		serial_number: '',
		status: 'available',
		assigned_to: '',
	})
	const [submitting, setSubmitting] = useState(false)
	const [lookingUpSerial, setLookingUpSerial] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: '',
				type: '',
				model: '',
				serial_number: '',
				status: 'available',
				assigned_to: '',
			})
			setError(null)
		}
	}, [isOpen])

	async function handleSerialLookup() {
		const serial = formData.serial_number.trim()
		if (!serial) {
			return
		}

		setLookingUpSerial(true)
		setError(null)

		try {
			// In reality, this would call the Alchemy API
			// For now, we'll mock it with a delay and fake data
			await new Promise(resolve => setTimeout(resolve, 800))

			// Mock response based on serial pattern
			const isMacSerial = serial.startsWith('C0') || serial.startsWith('C1')
			const isIphoneSerial = serial.length === 12 || serial.length === 15

			if (isMacSerial) {
				setFormData(prev => ({
					...prev,
					name: 'MacBook Air M1',
					type: 'laptop',
					model: 'MacBook Air 13" M1 (2021)',
				}))
			} else if (isIphoneSerial) {
				setFormData(prev => ({
					...prev,
					name: 'iPhone 15 Pro',
					type: 'phone',
					model: 'iPhone 15 Pro (2023)',
				}))
			} else {
				throw new Error('Serial number not found in database')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to lookup serial number')
		} finally {
			setLookingUpSerial(false)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)

		try {
			const response = await fetch('/api/devices', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: formData.name,
					type: formData.type,
					model: formData.model,
					serial_number: formData.serial_number || undefined,
					status: formData.status,
					assigned_to: formData.assigned_to || undefined,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to create device')
			}

			const data = await response.json()
			onSuccess(data.device)
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create device')
		} finally {
			setSubmitting(false)
		}
	}

	if (!isOpen) {
		return null
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 z-40"
				onClick={onClose}
				onKeyDown={e => e.key === 'Escape' && onClose()}
				role="button"
				tabIndex={-1}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold">Add Device</h2>
						<button
							type="button"
							onClick={onClose}
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

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Serial number lookup */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="serial_number">
								Serial Number (Optional)
							</label>
							<div className="flex gap-2">
								<input
									id="serial_number"
									type="text"
									value={formData.serial_number}
									onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
									placeholder="C02XYZ123ABC"
									className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onClick={handleSerialLookup}
									disabled={!formData.serial_number.trim() || lookingUpSerial}
									className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{lookingUpSerial ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
									Lookup
								</button>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">Enter serial to auto-populate device details</p>
						</div>

						{/* Name */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="name">
								Name <span className="text-red-500">*</span>
							</label>
							<input
								id="name"
								type="text"
								value={formData.name}
								onChange={e => setFormData({ ...formData, name: e.target.value })}
								required
								placeholder="MacBook Pro 14"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Type */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="type">
								Type <span className="text-red-500">*</span>
							</label>
							<input
								id="type"
								type="text"
								value={formData.type}
								onChange={e => setFormData({ ...formData, type: e.target.value })}
								required
								placeholder="laptop, phone, tablet, etc."
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Model */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="model">
								Model <span className="text-red-500">*</span>
							</label>
							<input
								id="model"
								type="text"
								value={formData.model}
								onChange={e => setFormData({ ...formData, model: e.target.value })}
								required
								placeholder='MacBook Pro 14" M3 (2024)'
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						{/* Status */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="status">
								Status
							</label>
							<select
								id="status"
								value={formData.status}
								onChange={e => setFormData({ ...formData, status: e.target.value as Device['status'] })}
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<option value="available">Available</option>
								<option value="assigned">Assigned</option>
								<option value="in_use">In Use</option>
								<option value="maintenance">Maintenance</option>
								<option value="retired">Retired</option>
							</select>
						</div>

						{/* Assigned To */}
						<div>
							<label className="block text-sm font-medium mb-1" htmlFor="assigned_to">
								Assigned To (Optional)
							</label>
							<input
								id="assigned_to"
								type="text"
								value={formData.assigned_to}
								onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
								placeholder="person_123"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<p className="mt-1 text-xs text-muted-foreground">Person ID or email address</p>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 mt-6">
							<button
								type="button"
								onClick={onClose}
								disabled={submitting}
								className="rounded-md px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={submitting || !formData.name || !formData.type || !formData.model}
								className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submitting && <Spinner size="sm" />}
								{submitting ? 'Adding...' : 'Add Device'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}
