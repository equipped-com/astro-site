'use client'

import { Plus, Search, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/types'

interface PersonSelectorProps {
	teamMembers: TeamMember[]
	selectedPerson: TeamMember | null
	onSelectPerson: (person: TeamMember) => void
	onAddPerson?: () => void
}

export default function PersonSelector({
	teamMembers,
	selectedPerson,
	onSelectPerson,
	onAddPerson,
}: PersonSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)

	// Filter team members based on search query
	const filteredMembers = useMemo(() => {
		if (!searchQuery.trim()) return teamMembers

		const query = searchQuery.toLowerCase()
		return teamMembers.filter(
			member => member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
		)
	}, [teamMembers, searchQuery])

	function handleSelectPerson(person: TeamMember) {
		onSelectPerson(person)
		setIsOpen(false)
		setSearchQuery('')
	}

	return (
		<div className="relative w-full">
			{/* Search Input */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search team members..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					onFocus={() => setIsOpen(true)}
					className={cn(
						'w-full rounded-lg border border-input bg-background',
						'px-10 py-3 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
						'placeholder:text-muted-foreground',
					)}
				/>
			</div>

			{/* Dropdown List */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

					{/* Results */}
					<div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
						<div className="max-h-[300px] overflow-y-auto">
							{filteredMembers.length > 0 ? (
								filteredMembers.map(member => (
									<button
										key={member.id}
										onClick={() => handleSelectPerson(member)}
										className={cn(
											'w-full px-4 py-3 text-left transition-colors',
											'hover:bg-accent hover:text-accent-foreground',
											'border-b border-border last:border-b-0',
											'flex items-start gap-3',
											selectedPerson?.id === member.id && 'bg-accent',
										)}
									>
										<User className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm">{member.name}</div>
											<div className="text-xs text-muted-foreground">{member.email}</div>
										</div>
									</button>
								))
							) : (
								<div className="px-4 py-8 text-center text-sm text-muted-foreground">No team members found</div>
							)}
						</div>

						{/* Add Person Button */}
						{onAddPerson && (
							<button
								onClick={() => {
									onAddPerson()
									setIsOpen(false)
								}}
								className={cn(
									'w-full px-4 py-3 text-left transition-colors',
									'border-t border-border',
									'hover:bg-accent hover:text-accent-foreground',
									'flex items-center gap-3 text-sm font-medium text-primary',
								)}
							>
								<Plus className="h-4 w-4" />
								Add person
							</button>
						)}
					</div>
				</>
			)}

			{/* Selected Person Display */}
			{selectedPerson && !isOpen && (
				<div className="mt-4 rounded-lg border border-border bg-accent/50 p-4">
					<div className="flex items-start gap-3">
						<User className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<div className="font-medium text-sm">{selectedPerson.name}</div>
							<div className="text-xs text-muted-foreground">{selectedPerson.email}</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
