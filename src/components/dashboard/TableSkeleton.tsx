import { Skeleton } from './Skeleton'

interface TableSkeletonProps {
	rows?: number
	columns?: number
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
	return (
		<div className="w-full overflow-hidden rounded-lg border border-border">
			<table className="w-full">
				<thead className="border-b border-border bg-muted/50">
					<tr>
						{Array.from({ length: columns }).map((_, i) => (
							<th key={i} className="px-6 py-4 text-left">
								<Skeleton className="h-4 w-24" />
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: rows }).map((_, rowIndex) => (
						<tr key={rowIndex} className="border-b border-border last:border-0 hover:bg-muted/50">
							{Array.from({ length: columns }).map((_, colIndex) => (
								<td key={colIndex} className="px-6 py-4">
									<Skeleton className="h-4 w-full" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
