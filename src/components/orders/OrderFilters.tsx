import { useState } from 'react'
import type { Order } from '@/lib/scoped-queries'

interface OrderFiltersProps {
	onFilterChange: (filters: OrderFilterState) => void
}

export interface OrderFilterState {
	status: Order['status'] | 'all'
	searchQuery: string
	dateFrom?: string
	dateTo?: string
}

export function OrderFilters({ onFilterChange }: OrderFiltersProps) {
	const [filters, setFilters] = useState<OrderFilterState>({
		status: 'all',
		searchQuery: '',
	})

	function handleStatusChange(status: Order['status'] | 'all') {
		const newFilters = { ...filters, status }
		setFilters(newFilters)
		onFilterChange(newFilters)
	}

	function handleSearchChange(searchQuery: string) {
		const newFilters = { ...filters, searchQuery }
		setFilters(newFilters)
		onFilterChange(newFilters)
	}

	function handleDateChange(field: 'dateFrom' | 'dateTo', value: string) {
		const newFilters = { ...filters, [field]: value || undefined }
		setFilters(newFilters)
		onFilterChange(newFilters)
	}

	return (
		<div className="bg-card rounded-lg border border-border p-4 space-y-4">
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Search */}
				<div className="flex-1">
					<label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">
						Search
					</label>
					<input
						type="text"
						id="search"
						placeholder="Search by order # or product name..."
						value={filters.searchQuery}
						onChange={e => handleSearchChange(e.target.value)}
						className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				{/* Status Filter */}
				<div className="w-full sm:w-48">
					<label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
						Status
					</label>
					<select
						id="status"
						value={filters.status}
						onChange={e => handleStatusChange(e.target.value as Order['status'] | 'all')}
						className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="all">All Orders</option>
						<option value="pending">Pending</option>
						<option value="pending_leasing_approval">Pending leasing approval</option>
						<option value="processing">Processing</option>
						<option value="shipped">Shipped</option>
						<option value="delivered">Delivered</option>
						<option value="cancelled">Cancelled</option>
						<option value="returned">Returned</option>
					</select>
				</div>
			</div>

			{/* Date Range */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<label htmlFor="dateFrom" className="block text-sm font-medium text-foreground mb-1">
						From Date
					</label>
					<input
						type="date"
						id="dateFrom"
						value={filters.dateFrom || ''}
						onChange={e => handleDateChange('dateFrom', e.target.value)}
						className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<div className="flex-1">
					<label htmlFor="dateTo" className="block text-sm font-medium text-foreground mb-1">
						To Date
					</label>
					<input
						type="date"
						id="dateTo"
						value={filters.dateTo || ''}
						onChange={e => handleDateChange('dateTo', e.target.value)}
						className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>
		</div>
	)
}
