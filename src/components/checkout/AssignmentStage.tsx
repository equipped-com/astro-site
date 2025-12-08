'use client'

import { ArrowRight, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { AssignmentData, TeamMember } from '@/types'
import PersonSelector from './PersonSelector'
import RequestInfoEmail from './RequestInfoEmail'

interface AssignmentStageProps {
	teamMembers: TeamMember[]
	initialAssignment?: AssignmentData
	onContinue: (assignment: AssignmentData) => void
	onAddPerson?: () => void
	onSendEmailRequest?: (personId: string) => Promise<void>
}

type AssignmentMode = 'none' | 'assign' | 'unassigned'

export default function AssignmentStage({
	teamMembers,
	initialAssignment,
	onContinue,
	onAddPerson,
	onSendEmailRequest,
}: AssignmentStageProps) {
	const [mode, setMode] = useState<AssignmentMode>(
		initialAssignment?.isUnassigned ? 'unassigned' : initialAssignment?.assignedTo ? 'assign' : 'none',
	)
	const [selectedPerson, setSelectedPerson] = useState<TeamMember | null>(initialAssignment?.assignedTo || null)

	function handleModeChange(newMode: AssignmentMode) {
		setMode(newMode)
		if (newMode === 'unassigned') {
			setSelectedPerson(null)
		}
	}

	function handleContinue() {
		const assignment: AssignmentData = {
			assignedTo: mode === 'assign' ? selectedPerson : null,
			isUnassigned: mode === 'unassigned',
		}
		onContinue(assignment)
	}

	const canContinue = mode === 'unassigned' || (mode === 'assign' && selectedPerson !== null)

	return (
		<div className="w-full max-w-2xl mx-auto">
			{/* Stage Header */}
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
						1
					</div>
					<h2 className="text-lg font-semibold">Assignment</h2>
				</div>
				<div className="border-b border-border" />
			</div>

			{/* Question */}
			<h3 className="text-xl font-semibold mb-6">Who will use this equipment?</h3>

			{/* Assignment Options */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				{/* Assign to Someone */}
				<button
					onClick={() => handleModeChange('assign')}
					className={cn(
						'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
						'hover:border-primary hover:bg-accent',
						mode === 'assign' ? 'border-primary bg-accent' : 'border-border',
					)}
				>
					<UserPlus className="h-8 w-8 text-primary" />
					<span className="font-medium">Assign it to someone</span>
				</button>

				{/* Leave Unassigned */}
				<button
					onClick={() => handleModeChange('unassigned')}
					className={cn(
						'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
						'hover:border-primary hover:bg-accent',
						mode === 'unassigned' ? 'border-primary bg-accent' : 'border-border',
					)}
				>
					<Users className="h-8 w-8 text-muted-foreground" />
					<span className="font-medium">Leave it unassigned</span>
				</button>
			</div>

			{/* Person Selection */}
			{mode === 'assign' && (
				<div className="mb-6">
					<PersonSelector
						teamMembers={teamMembers}
						selectedPerson={selectedPerson}
						onSelectPerson={setSelectedPerson}
						onAddPerson={onAddPerson}
					/>

					{/* Request Info Email */}
					{selectedPerson && onSendEmailRequest && (
						<RequestInfoEmail person={selectedPerson} onSendEmail={onSendEmailRequest} />
					)}
				</div>
			)}

			{/* Unassigned Note */}
			{mode === 'unassigned' && (
				<div className="mb-6 rounded-lg border border-border bg-muted p-4">
					<p className="text-sm text-muted-foreground">
						You can assign this equipment to a team member later from your dashboard. This is useful for shared devices
						or when the recipient hasn't been decided yet.
					</p>
				</div>
			)}

			{/* Continue Button */}
			<div className="flex justify-end">
				<button
					onClick={handleContinue}
					disabled={!canContinue}
					className={cn(
						'inline-flex items-center gap-2 rounded-lg px-6 py-3',
						'text-sm font-medium transition-colors',
						'bg-primary text-primary-foreground hover:bg-primary/90',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
