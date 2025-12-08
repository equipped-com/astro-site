import type React from 'react'
import { cn } from '@/lib/utils'

interface Action {
	label: string
	onClick: () => void
	variant?: 'primary' | 'secondary'
	disabled?: boolean
}

interface EmptyStateProps {
	icon?: React.ReactNode
	title: string
	description: string
	action?: Action
	className?: string
	children?: React.ReactNode
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
	children,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 px-4 text-center',
				className
			)}
		>
			{icon && (
				<div className="mb-4 flex items-center justify-center text-muted-foreground">
					{icon}
				</div>
			)}

			<h3 className="mb-2 text-lg font-semibold text-foreground">
				{title}
			</h3>

			<p className="mb-6 max-w-sm text-sm text-muted-foreground">
				{description}
			</p>

			{action && (
				<button
					onClick={action.onClick}
					disabled={action.disabled || false}
					className={cn(
						'rounded-md px-4 py-2 font-medium transition-colors',
						action.variant === 'secondary'
							? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50'
							: 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
					)}
				>
					{action.label}
				</button>
			)}

			{children && <div className="mt-6">{children}</div>}
		</div>
	)
}
