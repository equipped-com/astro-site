'use client'

import { Clock, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'

interface Assignment {
	id: string
	device_id: string
	person_id: string
	assigned_at: string
	returned_at: string | null
	notes: string | null
	first_name: string
	last_name: string
	email: string
	assigned_by_first_name?: string
	assigned_by_last_name?: string
}

interface AssignmentHistoryProps {
	deviceId: string
}

export default function AssignmentHistory({ deviceId }: AssignmentHistoryProps) {
	const [assignments, setAssignments] = useState<Assignment[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchAssignmentHistory()
	}, [deviceId])

	async function fetchAssignmentHistory() {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/device-assignments/device/${deviceId}`, {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error('Failed to fetch assignment history')
			}

			const data = await response.json()
			setAssignments(data.assignments || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load assignment history')
		} finally {
			setLoading(false)
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Spinner size="md" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
				<p className="font-semibold">Error loading assignment history</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	if (assignments.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
				<p>No assignment history</p>
				<p className="text-sm mt-1">This device has never been assigned</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold flex items-center gap-2">
				<Clock className="h-5 w-5" />
				Assignment History
			</h3>

			<div className="space-y-3">
				{assignments.map((assignment, index) => (
					<div
						key={assignment.id}
						className={`rounded-lg border p-4 ${assignment.returned_at ? 'border-border bg-muted/30' : 'border-primary bg-primary/5'}`}
					>
						<div className="flex items-start justify-between mb-2">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<p className="font-medium">
									{assignment.first_name} {assignment.last_name}
								</p>
								{!assignment.returned_at && (
									<span className="text-xs bg-primary text-white px-2 py-0.5 rounded">Current</span>
								)}
							</div>
							{index === 0 && assignments.length > 1 && <span className="text-xs text-muted-foreground">Latest</span>}
						</div>

						{assignment.email && <p className="text-sm text-muted-foreground mb-3">{assignment.email}</p>}

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground">Assigned</p>
								<p className="font-medium">{formatDate(assignment.assigned_at)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Returned</p>
								<p className="font-medium">{assignment.returned_at ? formatDate(assignment.returned_at) : '-'}</p>
							</div>
						</div>

						{assignment.assigned_by_first_name && (
							<div className="mt-3 text-xs text-muted-foreground">
								Assigned by: {assignment.assigned_by_first_name} {assignment.assigned_by_last_name}
							</div>
						)}

						{assignment.notes && (
							<div className="mt-3 p-3 bg-background rounded border border-border">
								<p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
								<p className="text-sm whitespace-pre-wrap">{assignment.notes}</p>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
