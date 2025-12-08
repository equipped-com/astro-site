/**
 * Global Order View Component
 *
 * Displays all orders across all customers for sys admins.
 */
import { Download, Package, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../dashboard/EmptyState'
import { Spinner } from '../dashboard/Spinner'
import { TableSkeleton } from '../dashboard/TableSkeleton'

interface Order {
	id: string
	order_number: string
	account_name: string
	account_short_name: string
	total_amount: number
	status: string
	created_at: string
	device_count: number
}

export default function GlobalOrderView() {
	const [orders, setOrders] = useState<Order[]>([])
	const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('')

	useEffect(() => {
		async function fetchOrders() {
			try {
				const response = await fetch('/api/admin/orders')
				if (!response.ok) {
					throw new Error('Failed to fetch orders')
				}
				const data = await response.json()
				setOrders(data)
				setFilteredOrders(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchOrders()
	}, [])

	useEffect(() => {
		let filtered = orders

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(order) =>
					order.order_number.toLowerCase().includes(query) ||
					order.account_name.toLowerCase().includes(query),
			)
		}

		if (statusFilter) {
			filtered = filtered.filter((order) => order.status === statusFilter)
		}

		setFilteredOrders(filtered)
	}, [searchQuery, statusFilter, orders])

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
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

	function handleExport() {
		const headers = [
			'Order Number',
			'Customer',
			'Amount',
			'Status',
			'Device Count',
			'Created Date',
		]
		const rows = filteredOrders.map((order) => [
			order.order_number,
			order.account_name,
			order.total_amount.toString(),
			order.status,
			order.device_count.toString(),
			order.created_at,
		])

		const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
		const blob = new Blob([csv], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

	if (loading) {
		return <TableSkeleton />
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4 text-red-900">
				<p className="font-medium">Error loading orders</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by order number or customer..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Statuses</option>
					{statuses.map((status) => (
						<option key={status} value={status}>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</option>
					))}
				</select>
				<button
					type="button"
					onClick={handleExport}
					className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					<Download className="h-4 w-4" />
					Export CSV
				</button>
			</div>

			{/* Order count */}
			<div className="text-sm text-muted-foreground">
				Showing {filteredOrders.length} of {orders.length} orders
			</div>

			{/* Order table */}
			{filteredOrders.length === 0 ? (
				<EmptyState
					icon={ShoppingCart}
					title="No orders found"
					description={
						searchQuery || statusFilter ? 'Try adjusting your filters' : 'No orders exist yet'
					}
				/>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Order Number
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Customer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Amount
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Devices
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Created Date
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{filteredOrders.map((order) => (
								<tr key={order.id} className="hover:bg-muted/50">
									<td className="px-6 py-4 text-sm font-medium">
										<div className="flex items-center gap-2">
											<Package className="h-4 w-4 text-muted-foreground" />
											{order.order_number}
										</div>
									</td>
									<td className="px-6 py-4 text-sm">
										<a
											href={`https://${order.account_short_name}.tryequipped.com`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											{order.account_name}
										</a>
									</td>
									<td className="px-6 py-4 text-sm font-medium">
										{formatCurrency(order.total_amount)}
									</td>
									<td className="px-6 py-4 text-sm">{order.device_count}</td>
									<td className="px-6 py-4 text-sm">
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
												order.status === 'delivered'
													? 'bg-green-100 text-green-700'
													: order.status === 'shipped'
														? 'bg-blue-100 text-blue-700'
														: order.status === 'cancelled'
															? 'bg-red-100 text-red-700'
															: 'bg-yellow-100 text-yellow-700'
											}`}
										>
											{order.status}
										</span>
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">
										{formatDate(order.created_at)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
