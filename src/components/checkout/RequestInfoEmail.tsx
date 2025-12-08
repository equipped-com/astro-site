'use client'

import { CheckCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/types'

interface RequestInfoEmailProps {
	person: TeamMember
	onSendEmail: (personId: string) => Promise<void>
}

export default function RequestInfoEmail({ person, onSendEmail }: RequestInfoEmailProps) {
	const [isSending, setIsSending] = useState(false)
	const [isSent, setIsSent] = useState(false)

	async function handleSendEmail() {
		try {
			setIsSending(true)
			await onSendEmail(person.id)
			setIsSent(true)
		} catch (error) {
			console.error('Failed to send email:', error)
		} finally {
			setIsSending(false)
		}
	}

	const missingInfo = []
	if (!person.hasAddress) missingInfo.push('address')
	if (!person.hasPhone) missingInfo.push('phone number')

	if (missingInfo.length === 0) return null

	return (
		<div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
			<p className="text-sm text-orange-900 dark:text-orange-200">
				Don't have {person.name.split(' ')[0]}'s {missingInfo.join(' or ')}?
			</p>

			{!isSent ? (
				<button
					onClick={handleSendEmail}
					disabled={isSending}
					className={cn(
						'mt-2 inline-flex items-center gap-2 rounded-md px-3 py-1.5',
						'text-sm font-medium transition-colors',
						'bg-orange-600 text-white hover:bg-orange-700',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				>
					<Mail className="h-4 w-4" />
					{isSending ? 'Sending...' : `Ask ${person.name.split(' ')[0]} to add info`}
				</button>
			) : (
				<div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
					<CheckCircle className="h-4 w-4" />
					Email sent to {person.email}
				</div>
			)}
		</div>
	)
}
