/**
 * OrdersApp - Client-side routed orders component
 *
 * This component handles dynamic routing entirely on the client side,
 * eliminating the need for Astro's getStaticPaths() which requires
 * knowing all IDs at build time.
 *
 * URL Pattern: /dashboard/orders?id=xxx
 * - No id param = list view
 * - With id param = detail view
 *
 * Direct link support: Works because the single orders.astro page
 * always exists and this component reads the URL on mount.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { OrderWithItems } from '@/lib/scoped-queries'
import { OrderDetails } from './OrderDetails'
import { type OrderFilterState, OrderFilters } from './OrderFilters'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrdersAppProps {
	orders: OrderWithItems[]
}

type SortField = 'created_at' | 'total' | 'status'
type SortDirection = 'asc' | 'desc'

// Reusable back arrow icon
function BackArrowIcon() {
	return (
		<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
		</svg>
	)
}

export function OrdersApp({ orders }: OrdersAppProps) {
	// Read initial order ID from URL on mount
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
		if (typeof window === 'undefined') return null
		const params = new URLSearchParams(window.location.search)
		return params.get('id')
	})

	// List view state
	const [filters, setFilters] = useState<OrderFilterState>({
		status: 'all',
		searchQuery: '',
	})
	const [sortField, setSortField] = useState<SortField>('created_at')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

	// Sync URL with selected order
	useEffect(() => {
		if (typeof window === 'undefined') return

		const url = new URL(window.location.href)
		if (selectedOrderId) {
			url.searchParams.set('id', selectedOrderId)
		} else {
			url.searchParams.delete('id')
		}

		// Update URL without triggering navigation
		window.history.replaceState({}, '', url.toString())
	}, [selectedOrderId])

	// Handle browser back/forward
	useEffect(() => {
		if (typeof window === 'undefined') return

		function handlePopState() {
			const params = new URLSearchParams(window.location.search)
			setSelectedOrderId(params.get('id'))
		}

		window.addEventListener('popstate', handlePopState)
		return () => window.removeEventListener('popstate', handlePopState)
	}, [])

	// Navigate to order detail
	const navigateToOrder = useCallback((orderId: string) => {
		// Push state so back button works
		const url = new URL(window.location.href)
		url.searchParams.set('id', orderId)
		window.history.pushState({}, '', url.toString())
		setSelectedOrderId(orderId)
	}, [])

	// Navigate back to list
	const navigateToList = useCallback(() => {
		// Push state so forward button works
		const url = new URL(window.location.href)
		url.searchParams.delete('id')
		window.history.pushState({}, '', url.toString())
		setSelectedOrderId(null)
	}, [])

	// Find selected order
	const selectedOrder = useMemo(() => {
		if (!selectedOrderId) return null
		// Match by full ID or ID prefix (for shortened URLs)
		return orders.find(o => o.id === selectedOrderId || o.id.startsWith(selectedOrderId)) || null
	}, [orders, selectedOrderId])

	// If order ID in URL but not found, show not found state
	if (selectedOrderId && !selectedOrder) {
		return (
			<div className="space-y-6">
				<button
					type="button"
					onClick={navigateToList}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<BackArrowIcon />
					Back to Orders
				</button>
				<div className="bg-card rounded-lg border border-border p-12 text-center">
					<h2 className="text-xl font-semibold text-foreground mb-2">Order Not Found</h2>
					<p className="text-muted-foreground">The order with ID "{selectedOrderId}" could not be found.</p>
				</div>
			</div>
		)
	}

	// Detail view
	if (selectedOrder) {
		return (
			<div className="space-y-6">
				<button
					type="button"
					onClick={navigateToList}
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<BackArrowIcon />
					Back to Orders
				</button>
				<OrderDetails
					order={selectedOrder}
					onCancel={handleOrderCancel}
					onReturn={handleOrderReturn}
					onReorder={handleOrderReorder}
					onDownloadInvoice={handleDownloadInvoice}
				/>
			</div>
		)
	}

	// List view
	return (
		<OrderListView
			orders={orders}
			filters={filters}
			onFilterChange={setFilters}
			sortField={sortField}
			sortDirection={sortDirection}
			onSort={handleSort}
			onSelectOrder={navigateToOrder}
		/>
	)

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc')
		}
	}
}

// Action handlers - in production these would call the API
async function handleOrderCancel(orderId: string) {
	console.log('Cancel order:', orderId)
	alert('Order cancellation functionality will be implemented in the API')
}

async function handleOrderReturn(orderId: string) {
	console.log('Return order:', orderId)
	alert('Order return functionality will be implemented in the API')
}

async function handleOrderReorder(orderId: string) {
	console.log('Reorder:', orderId)
	alert('Reorder functionality will be implemented in the API')
}

async function handleDownloadInvoice(orderId: string) {
	console.log('Download invoice:', orderId)
	alert('Invoice download functionality will be implemented')
}

// List view component (extracted for clarity)
interface OrderListViewProps {
	orders: OrderWithItems[]
	filters: OrderFilterState
	onFilterChange: (filters: OrderFilterState) => void
	sortField: SortField
	sortDirection: SortDirection
	onSort: (field: SortField) => void
	onSelectOrder: (orderId: string) => void
}

function OrderListView({
	orders,
	filters,
	onFilterChange,
	sortField,
	sortDirection,
	onSort,
	onSelectOrder,
}: OrderListViewProps) {
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
				if (order.id.toLowerCase().includes(query)) return true
				if (order.items?.some(item => item.product_name.toLowerCase().includes(query))) return true
				return false
			})
		}

		// Date range filter
		const dateFrom = filters.dateFrom
		if (dateFrom) {
			filtered = filtered.filter(order => order.created_at >= dateFrom)
		}
		const dateTo = filters.dateTo
		if (dateTo) {
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
			<OrderFilters onFilterChange={onFilterChange} />

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
											onClick={() => onSort('created_at')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Order #
											<SortIcon field="created_at" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => onSort('created_at')}
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
											onClick={() => onSort('total')}
											className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
										>
											Total
											<SortIcon field="total" />
										</button>
									</th>
									<th className="px-6 py-3 text-left">
										<button
											type="button"
											onClick={() => onSort('status')}
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
								{filteredAndSortedOrders.map(order => (
									<tr
										key={order.id}
										className="hover:bg-muted/30 transition-colors cursor-pointer"
										onClick={() => onSelectOrder(order.id)}
									>
										<td className="px-6 py-4">
											<button
												type="button"
												onClick={e => {
													e.stopPropagation()
													onSelectOrder(order.id)
												}}
												className="text-sm font-mono text-foreground hover:text-primary"
											>
												{order.id.slice(0, 8)}
											</button>
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
													onClick={e => e.stopPropagation()}
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
								))}
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
