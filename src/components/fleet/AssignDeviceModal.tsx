'use client'

import { Search, UserCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'

interface Person {
	id: string
	first_name: string
	last_name: string
	email: string | null
	status: 'active' | 'onboarding' | 'offboarding' | 'departed'
	device_count: number
}

interface Device {
	id: string
	name: string
	model: string
	type: string
}

interface AssignDeviceModalProps {
	isOpen: boolean
	device: Device | null
	onClose: () => void
	onSuccess: () => void
}

export default function AssignDeviceModal({ isOpen, device, onClose, onSuccess }: AssignDeviceModalProps) {
	const [people, setPeople] = useState<Person[]>([])
	const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
	const [loadingPeople, setLoadingPeople] = useState(false)
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [notes, setNotes] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Fetch people when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchPeople()
			setSelectedPerson(null)
			setSearchQuery('')
			setNotes('')
			setError(null)
		}
	}, [isOpen])

	// Filter people based on search
	useEffect(() => {
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			const filtered = people.filter(
				p =>
					p.first_name.toLowerCase().includes(query) ||
					p.last_name.toLowerCase().includes(query) ||
					p.email?.toLowerCase().includes(query),
			)
			setFilteredPeople(filtered)
		} else {
			setFilteredPeople(people.filter(p => p.status === 'active' || p.status === 'onboarding'))
		}
	}, [searchQuery, people])

	async function fetchPeople() {
		setLoadingPeople(true)
		try {
			const response = await fetch('/api/people', {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error('Failed to fetch people')
			}

			const data = await response.json()
			setPeople(data.people || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load people')
		} finally {
			setLoadingPeople(false)
		}
	}

	async function handleAssign() {
		if (!device || !selectedPerson) {
			return
		}

		setSubmitting(true)
		setError(null)

		try {
			const response = await fetch('/api/device-assignments/assign', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					device_id: device.id,
					person_id: selectedPerson.id,
					notes: notes || undefined,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to assign device')
			}

			onSuccess()
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to assign device')
		} finally {
			setSubmitting(false)
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
						<div>
							<h2 className="text-xl font-bold">Assign Device</h2>
							<p className="text-sm text-muted-foreground mt-1">
								{device.name} - {device.model}
							</p>
						</div>
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

					{/* Search */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2" htmlFor="search-person">
							Search People
						</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								id="search-person"
								type="text"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder="Search by name or email..."
								className="w-full rounded-md border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>
					</div>

					{/* People list */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">
							Select Person <span className="text-red-500">*</span>
						</label>
						<div className="max-h-64 overflow-y-auto border border-border rounded-md">
							{loadingPeople ? (
								<div className="flex items-center justify-center py-8">
									<Spinner size="md" />
								</div>
							) : filteredPeople.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<p>No people found</p>
									{searchQuery && <p className="text-sm mt-1">Try adjusting your search</p>}
								</div>
							) : (
								<div className="divide-y divide-border">
									{filteredPeople.map(person => (
										<button
											key={person.id}
											type="button"
											onClick={() => setSelectedPerson(person)}
											className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${selectedPerson?.id === person.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">
														{person.first_name} {person.last_name}
													</p>
													{person.email && <p className="text-sm text-muted-foreground">{person.email}</p>}
												</div>
												<div className="flex items-center gap-2">
													{person.device_count > 0 && (
														<span className="text-xs bg-muted px-2 py-1 rounded">{person.device_count} devices</span>
													)}
													{selectedPerson?.id === person.id && <UserCheck className="h-4 w-4 text-primary" />}
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-sm font-medium mb-2" htmlFor="assignment-notes">
							Notes (Optional)
						</label>
						<textarea
							id="assignment-notes"
							value={notes}
							onChange={e => setNotes(e.target.value)}
							placeholder="Add any relevant notes about this assignment..."
							rows={3}
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="rounded-md px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleAssign}
							disabled={submitting || !selectedPerson}
							className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting && <Spinner size="sm" />}
							{submitting ? 'Assigning...' : 'Confirm Assignment'}
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
