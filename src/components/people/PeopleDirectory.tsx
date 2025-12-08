'use client'

import { Filter, Plus, Search, UserCheck, Users as UsersIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Spinner } from '@/components/dashboard/Spinner'
import AddPersonModal from './AddPersonModal'
import PersonCard from './PersonCard'

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
	created_at: string
	updated_at: string
}

type StatusFilter = 'all' | 'active' | 'onboarding' | 'offboarding' | 'departed'

export default function PeopleDirectory() {
	const [people, setPeople] = useState<Person[]>([])
	const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [departmentFilter, setDepartmentFilter] = useState<string>('all')
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)

	// Get unique departments from people
	const departments = Array.from(new Set(people.map(p => p.department).filter(Boolean))) as string[]

	// Fetch people from API
	const fetchPeople = useCallback(async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/people', {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error(`Failed to fetch people: ${response.statusText}`)
			}

			const data = await response.json()
			setPeople(data.people || [])
			setFilteredPeople(data.people || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load people')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchPeople()
	}, [fetchPeople])

	// Apply filters and search
	useEffect(() => {
		let filtered = [...people]

		// Status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(p => p.status === statusFilter)
		}

		// Department filter
		if (departmentFilter !== 'all') {
			filtered = filtered.filter(p => p.department === departmentFilter)
		}

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				p =>
					p.first_name.toLowerCase().includes(query) ||
					p.last_name.toLowerCase().includes(query) ||
					p.email?.toLowerCase().includes(query),
			)
		}

		setFilteredPeople(filtered)
	}, [people, searchQuery, statusFilter, departmentFilter])

	function handlePersonAdded(newPerson: Person) {
		setPeople([...people, newPerson])
		setIsAddModalOpen(false)
	}

	function handlePersonUpdated(updatedPerson: Person) {
		setPeople(people.map(p => (p.id === updatedPerson.id ? updatedPerson : p)))
	}

	function handlePersonDeleted(personId: string) {
		setPeople(people.filter(p => p.id !== personId))
	}

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner size="lg" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
				<p className="font-semibold">Error loading people</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header with Add button */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">People Directory</h1>
					<p className="mt-1 text-sm text-muted-foreground">Manage your team members and their information</p>
				</div>
				<button
					type="button"
					onClick={() => setIsAddModalOpen(true)}
					className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
				>
					<Plus className="h-4 w-4" />
					Add Person
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				{/* Search */}
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>

				{/* Status filter */}
				<div className="relative">
					<Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<select
						value={statusFilter}
						onChange={e => setStatusFilter(e.target.value as StatusFilter)}
						className="appearance-none rounded-md border border-border bg-background px-10 py-2 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					>
						<option value="all">All Statuses</option>
						<option value="active">Active</option>
						<option value="onboarding">Onboarding</option>
						<option value="offboarding">Offboarding</option>
						<option value="departed">Departed</option>
					</select>
				</div>

				{/* Department filter */}
				{departments.length > 0 && (
					<div className="relative">
						<UsersIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<select
							value={departmentFilter}
							onChange={e => setDepartmentFilter(e.target.value)}
							className="appearance-none rounded-md border border-border bg-background px-10 py-2 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							<option value="all">All Departments</option>
							{departments.map(dept => (
								<option key={dept} value={dept}>
									{dept}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* Results count */}
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<UserCheck className="h-4 w-4" />
				<span>
					Showing {filteredPeople.length} of {people.length} people
				</span>
			</div>

			{/* People grid */}
			{filteredPeople.length === 0 ? (
				<EmptyState
					icon={<UsersIcon className="h-12 w-12" />}
					title={
						searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' ? 'No results found' : 'No people yet'
					}
					description={
						searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
							? 'Try adjusting your filters or search query'
							: 'Get started by adding your first team member'
					}
					action={
						searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
							? {
									label: 'Clear Filters',
									onClick: () => {
										setSearchQuery('')
										setStatusFilter('all')
										setDepartmentFilter('all')
									},
								}
							: {
									label: 'Add Person',
									onClick: () => setIsAddModalOpen(true),
								}
					}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredPeople.map(person => (
						<PersonCard key={person.id} person={person} onUpdate={handlePersonUpdated} onDelete={handlePersonDeleted} />
					))}
				</div>
			)}

			{/* Add Person Modal */}
			<AddPersonModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handlePersonAdded} />
		</div>
	)
}
