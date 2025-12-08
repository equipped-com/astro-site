'use client'

import { Laptop, Mail, MapPin, Phone, Trash2, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
}

interface PersonCardProps {
	person: Person
	onUpdate: (person: Person) => void
	onDelete: (personId: string) => void
}

const statusColors = {
	active: 'bg-green-100 text-green-800 border-green-200',
	onboarding: 'bg-blue-100 text-blue-800 border-blue-200',
	offboarding: 'bg-orange-100 text-orange-800 border-orange-200',
	departed: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels = {
	active: 'Active',
	onboarding: 'Onboarding',
	offboarding: 'Offboarding',
	departed: 'Departed',
}

export default function PersonCard({ person, onUpdate, onDelete }: PersonCardProps) {
	const [isDeleting, setIsDeleting] = useState(false)

	async function handleDelete() {
		if (!confirm(`Are you sure you want to remove ${person.first_name} ${person.last_name}?`)) {
			return
		}

		try {
			setIsDeleting(true)
			const response = await fetch(`/api/people/${person.id}`, {
				method: 'DELETE',
				credentials: 'include',
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to delete person')
			}

			onDelete(person.id)
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to delete person')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="group relative rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-lg">
						{person.first_name} {person.last_name}
					</h3>
					{person.title && <p className="text-sm text-muted-foreground">{person.title}</p>}
				</div>

				{/* Platform access badge */}
				{person.has_platform_access === 1 && (
					<div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
						<UserCheck className="h-3 w-3" />
						<span>User</span>
					</div>
				)}
			</div>

			{/* Contact info */}
			<div className="mt-4 space-y-2">
				{person.email && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Mail className="h-4 w-4 flex-shrink-0" />
						<a href={`mailto:${person.email}`} className="hover:text-primary truncate">
							{person.email}
						</a>
					</div>
				)}

				{person.phone && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Phone className="h-4 w-4 flex-shrink-0" />
						<a href={`tel:${person.phone}`} className="hover:text-primary">
							{person.phone}
						</a>
					</div>
				)}

				{person.location && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<MapPin className="h-4 w-4 flex-shrink-0" />
						<span>{person.location}</span>
					</div>
				)}

				{person.device_count > 0 && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Laptop className="h-4 w-4 flex-shrink-0" />
						<span>
							{person.device_count} {person.device_count === 1 ? 'device' : 'devices'}
						</span>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="mt-4 flex items-center justify-between border-t border-border pt-4">
				{/* Status badge */}
				<span
					className={cn(
						'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
						statusColors[person.status],
					)}
				>
					{statusLabels[person.status]}
				</span>

				{/* Delete button (visible on hover) */}
				<button
					type="button"
					onClick={handleDelete}
					disabled={isDeleting}
					className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
					title="Remove person"
				>
					<Trash2 className="h-4 w-4" />
					{isDeleting ? 'Removing...' : 'Remove'}
				</button>
			</div>

			{person.department && (
				<div className="mt-2 text-xs text-muted-foreground">
					<span className="rounded bg-muted px-2 py-1">{person.department}</span>
				</div>
			)}
		</div>
	)
}
