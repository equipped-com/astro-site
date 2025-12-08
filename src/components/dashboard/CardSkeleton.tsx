import { Skeleton } from './Skeleton'

interface CardSkeletonProps {
	count?: number
	variant?: 'default' | 'stat' | 'feature'
}

export function CardSkeleton({ count = 1, variant = 'default' }: CardSkeletonProps) {
	if (variant === 'stat') {
		return (
			<div className="space-y-4">
				{Array.from({ length: count }).map((_, i) => (
					<div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-3 w-20" />
					</div>
				))}
			</div>
		)
	}

	if (variant === 'feature') {
		return (
			<div className="space-y-4">
				{Array.from({ length: count }).map((_, i) => (
					<div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
						<Skeleton className="h-40 w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<div className="flex gap-2 pt-2">
							<Skeleton className="h-9 w-20" />
							<Skeleton className="h-9 w-20" />
						</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="rounded-lg border border-border bg-card p-6 space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-4/6" />
				</div>
			))}
		</div>
	)
}
