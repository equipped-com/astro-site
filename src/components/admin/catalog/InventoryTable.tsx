/**
 * Inventory Table Component
 *
 * Displays all inventory items with inline status editing for sys admins.
 *
 * @REQ-UI-006 Manage inventory
 * @REQ-UI-007 Quick edit inventory status
 */
import { Check, Package, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { TableSkeleton } from '@/components/dashboard/TableSkeleton'

interface Product {
	id: string
	name: string
}

interface InventoryItem {
	id: string
	productId: string
	productName: string
	brandName: string
	serialNumber?: string | null
	condition: string
	status: string
	purchaseCost?: number | null
	salePrice?: number | null
	notes?: string | null
	warehouseLocation?: string | null
	createdAt: string
	updatedAt: string
}

const STATUSES = ['available', 'reserved', 'sold', 'allocated']
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'refurbished']

export default function InventoryTable() {
	const [items, setItems] = useState<InventoryItem[]>([])
	const [products, setProducts] = useState<Product[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Filters
	const [searchQuery, setSearchQuery] = useState('')
	const [productFilter, setProductFilter] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [conditionFilter, setConditionFilter] = useState<string>('')

	// Inline editing
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingStatus, setEditingStatus] = useState<string>('')
	const [updating, setUpdating] = useState(false)

	useEffect(() => {
		fetchProducts()
	}, [])

	useEffect(() => {
		fetchInventory()
	}, [productFilter, statusFilter, conditionFilter])

	async function fetchProducts() {
		try {
			const response = await fetch('/api/catalog/products?limit=1000')
			if (!response.ok) {
				throw new Error('Failed to fetch products')
			}
			const data = await response.json()
			setProducts(data.products)
		} catch (err) {
			console.error('Error fetching products:', err)
		}
	}

	async function fetchInventory() {
		setLoading(true)
		try {
			const params = new URLSearchParams()

			if (productFilter) params.append('product_id', productFilter)
			if (statusFilter) params.append('status', statusFilter)
			if (conditionFilter) params.append('condition', conditionFilter)

			const response = await fetch(`/api/catalog/inventory?${params}`)
			if (!response.ok) {
				throw new Error('Failed to fetch inventory')
			}
			const data = await response.json()
			setItems(data.items)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	function handleStartEdit(item: InventoryItem) {
		setEditingId(item.id)
		setEditingStatus(item.status)
	}

	function handleCancelEdit() {
		setEditingId(null)
		setEditingStatus('')
	}

	async function handleSaveEdit(itemId: string) {
		setUpdating(true)
		setError(null)

		try {
			const response = await fetch(`/api/catalog/inventory/${itemId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: editingStatus }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to update inventory item')
			}

			// Refresh inventory list
			await fetchInventory()
			setEditingId(null)
			setEditingStatus('')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update inventory item')
		} finally {
			setUpdating(false)
		}
	}

	function formatPrice(price?: number | null): string {
		if (!price) return 'N/A'
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(price)
	}

	function formatDate(dateString?: string): string {
		if (!dateString) return 'Unknown'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'available':
				return 'bg-green-100 text-green-800'
			case 'reserved':
				return 'bg-yellow-100 text-yellow-800'
			case 'sold':
				return 'bg-gray-100 text-gray-800'
			case 'allocated':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	function getConditionColor(condition: string): string {
		switch (condition) {
			case 'new':
				return 'bg-green-100 text-green-800'
			case 'like_new':
				return 'bg-blue-100 text-blue-800'
			case 'good':
				return 'bg-yellow-100 text-yellow-800'
			case 'fair':
				return 'bg-orange-100 text-orange-800'
			case 'refurbished':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const filteredItems = searchQuery
		? items.filter(
				item =>
					item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: items

	if (loading && items.length === 0) {
		return <TableSkeleton />
	}

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<div className="space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by product name, serial number, or brand..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				{/* Filter row */}
				<div className="flex items-center gap-4">
					{/* Product filter */}
					<select
						value={productFilter}
						onChange={e => setProductFilter(e.target.value)}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Products</option>
						{products.map(product => (
							<option key={product.id} value={product.id}>
								{product.name}
							</option>
						))}
					</select>

					{/* Status filter */}
					<select
						value={statusFilter}
						onChange={e => setStatusFilter(e.target.value)}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Status</option>
						{STATUSES.map(status => (
							<option key={status} value={status}>
								{status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
							</option>
						))}
					</select>

					{/* Condition filter */}
					<select
						value={conditionFilter}
						onChange={e => setConditionFilter(e.target.value)}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Conditions</option>
						{CONDITIONS.map(condition => (
							<option key={condition} value={condition}>
								{condition.replace('_', ' ').charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Error message */}
			{error && (
				<div className="rounded-md bg-red-50 p-4 text-red-900">
					<p className="font-medium">Error</p>
					<p className="text-sm">{error}</p>
				</div>
			)}

			{/* Inventory count */}
			<div className="text-sm text-muted-foreground">
				Showing {filteredItems.length} of {items.length} inventory items
			</div>

			{/* Inventory table */}
			{filteredItems.length === 0 ? (
				<EmptyState
					icon={<Package className="h-12 w-12" />}
					title="No inventory items found"
					description={searchQuery || productFilter || statusFilter || conditionFilter ? 'Try adjusting your filters' : 'No inventory items have been added yet'}
				/>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Product
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Serial Number
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Condition
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Location
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Sale Price
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{filteredItems.map(item => (
								<tr key={item.id} className="hover:bg-muted/50">
									<td className="px-6 py-4 text-sm font-medium">
										<div>
											{item.productName}
											<div className="text-xs text-muted-foreground">{item.brandName}</div>
										</div>
									</td>
									<td className="px-6 py-4 text-sm font-mono text-muted-foreground">
										{item.serialNumber || 'N/A'}
									</td>
									<td className="px-6 py-4 text-sm">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConditionColor(item.condition)}`}
										>
											{item.condition.replace('_', ' ').charAt(0).toUpperCase() + item.condition.slice(1).replace('_', ' ')}
										</span>
									</td>
									<td className="px-6 py-4 text-sm">
										{editingId === item.id ? (
											<div className="flex items-center gap-2">
												<select
													value={editingStatus}
													onChange={e => setEditingStatus(e.target.value)}
													disabled={updating}
													className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
												>
													{STATUSES.map(status => (
														<option key={status} value={status}>
															{status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
														</option>
													))}
												</select>
												<button
													type="button"
													onClick={() => handleSaveEdit(item.id)}
													disabled={updating}
													className="rounded-md bg-green-600 p-1 text-white hover:bg-green-700 disabled:opacity-50"
													data-testid={`save-status-${item.id}`}
												>
													<Check className="h-3 w-3" />
												</button>
												<button
													type="button"
													onClick={handleCancelEdit}
													disabled={updating}
													className="rounded-md bg-gray-600 p-1 text-white hover:bg-gray-700 disabled:opacity-50"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
										) : (
											<button
												type="button"
												onClick={() => handleStartEdit(item)}
												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)} hover:opacity-80`}
												data-testid={`edit-status-${item.id}`}
											>
												{item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
											</button>
										)}
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{item.warehouseLocation || 'N/A'}</td>
									<td className="px-6 py-4 text-sm">{formatPrice(item.salePrice)}</td>
									<td className="px-6 py-4 text-right text-sm">
										{item.notes && (
											<span className="text-xs text-muted-foreground" title={item.notes}>
												Has Notes
											</span>
										)}
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
