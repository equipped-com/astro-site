import { useMemo, useState } from 'react'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { type OrderFilterState, OrderFilters } from './OrderFilters'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderListProps {
	orders: OrderWithItems[]
}

type SortField = 'created_at' | 'total' | 'status'
type SortDirection = 'asc' | 'desc'

export function OrderList({ orders }: OrderListProps) {
	const [filters, setFilters] = useState<OrderFilterState>({
		status: 'all',
		searchQuery: '',
	})
	const [sortField, setSortField] = useState<SortField>('created_at')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc')
		}
	}

	const filteredAndSortedOrders = useMemo(() => {
		let filtered = orders

		// Status filter
		if (filters.status !== 'all') {
			filtered = filtered.filter(order => order.status === filters.status)
		}

		// Search filter
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase()
			filtered = filtered.filter(order => {
				// Search by order ID
				if (order.id.toLowerCase().includes(query)) return true

				// Search by product names in items
				if (order.items?.some(item => item.product_name.toLowerCase().includes(query))) return true

				return false
			})
		}

		// Date range filter
		if (filters.dateFrom) {
			const dateFrom = filters.dateFrom
			filtered = filtered.filter(order => order.created_at >= dateFrom)
		}
		if (filters.dateTo) {
			const dateTo = filters.dateTo
			filtered = filtered.filter(order => order.created_at <= dateTo)
		}

		// Sort
		const sorted = [...filtered].sort((a, b) => {
			let aValue: string | number
			let bValue: string | number

			switch (sortField) {
				case 'created_at':
					aValue = a.created_at
					bValue = b.created_at
					break
				case 'total':
					aValue = a.total
					bValue = b.total
					break
				case 'status':
					aValue = a.status
					bValue = b.status
					break
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
			}

			return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
		})

		return sorted
	}, [orders, filters, sortField, sortDirection])

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount)
	}

	function getOrderItems(order: OrderWithItems): string {
		if (!order.items || order.items.length === 0) return 'No items'

		const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
		const uniqueProducts = order.items.length

		if (uniqueProducts === 1) {
			return `${itemCount} x ${order.items[0].product_name}`
		}

		return `${itemCount} items (${uniqueProducts} products)`
	}

	function SortIcon({ field }: { field: SortField }) {
		if (sortField !== field) {
			return (
				<svg
					className="w-4 h-4 ml-1 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-label="Sort"
				>
					<title>Sort</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
					/>
				</svg>
			)
		}

		return sortDirection === 'asc' ? (
			<svg
				className="w-4 h-4 ml-1 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-label="Sort ascending"
			>
				<title>Sort ascending</title>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
			</svg>
		) : (
			<svg
				className="w-4 h-4 ml-1 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-label="Sort descending"
			>
				<title>Sort descending</title>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
			</svg>
		)
	}

	return (
		<div className="space-y-6">
			<OrderFilters onFilterChange={setFilters} />

			{filteredAndSortedOrders.length === 0 ? (
				<div className="bg-card rounded-lg border border-border p-12 text-center">
					<p className="text-muted-foreground">No orders found matching your filters.</p>
				</div>
			) : (
				<div className="bg-card rounded-lg border border-border overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-muted/50 border-b border-border">
								<tr>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => handleSort('created_at')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Order #
											<SortIcon field="created_at" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => handleSort('created_at')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Date
											<SortIcon field="created_at" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<span className="text-sm font-medium text-foreground">Items</span>
									</th>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => handleSort('total')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Total
											<SortIcon field="total" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => handleSort('status')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Status
											<SortIcon field="status" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<span className="text-sm font-medium text-foreground">Tracking</span>
									</th>
									<th className="px-6 py-3 text-left">
										<span className="text-sm font-medium text-foreground">Created By</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{filteredAndSortedOrders.map(order => {
									const orderPath = `/dashboard/orders/${order.id.slice(0, 8)}`
									return (
										<tr
											key={order.id}
											className="hover:bg-muted/30 transition-colors cursor-pointer"
											onClick={() => {
												window.location.href = orderPath
											}}
										>
											<td className="px-6 py-4">
												<a href={orderPath} className="text-sm font-mono text-foreground hover:text-primary">
													{order.id.slice(0, 8)}
												</a>
											</td>
											<td className="px-6 py-4">
												<span className="text-sm text-foreground">{formatDate(order.created_at)}</span>
											</td>
											<td className="px-6 py-4">
												<span className="text-sm text-foreground">{getOrderItems(order)}</span>
											</td>
											<td className="px-6 py-4">
												<span className="text-sm font-medium text-foreground">{formatCurrency(order.total)}</span>
											</td>
											<td className="px-6 py-4">
												<OrderStatusBadge status={order.status} />
											</td>
											<td className="px-6 py-4">
												{order.tracking_number ? (
													<a
														href={`https://www.google.com/search?q=${order.carrier}+${order.tracking_number}`}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-primary hover:underline"
													>
														{order.tracking_number}
													</a>
												) : (
													<span className="text-sm text-muted-foreground">--</span>
												)}
											</td>
											<td className="px-6 py-4">
												<span className="text-sm text-foreground">{order.creator_name || 'Unknown'}</span>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Results count */}
			<div className="text-sm text-muted-foreground text-center">
				Showing {filteredAndSortedOrders.length} of {orders.length} orders
			</div>
		</div>
	)
}
