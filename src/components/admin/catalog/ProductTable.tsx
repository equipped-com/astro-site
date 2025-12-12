/**
 * Product Table Component
 *
 * Displays all products with search, filters, sorting, and pagination for sys admins.
 *
 * @REQ-UI-003 Browse products with filters
 */
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Package, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { TableSkeleton } from '@/components/dashboard/TableSkeleton'

interface Brand {
	id: string
	name: string
}

interface Product {
	id: string
	brandId: string
	brandName: string
	name: string
	modelIdentifier?: string | null
	modelNumber?: string | null
	sku: string
	productType: string
	description?: string | null
	specs?: string | null
	msrp?: number | null
	imageUrl?: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export default function ProductTable() {
	const [products, setProducts] = useState<Product[]>([])
	const [brands, setBrands] = useState<Brand[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Filters
	const [searchQuery, setSearchQuery] = useState('')
	const [brandFilter, setBrandFilter] = useState<string>('')
	const [typeFilter, setTypeFilter] = useState<string>('')
	const [activeFilter, setActiveFilter] = useState<string>('')

	// Pagination
	const [page, setPage] = useState(1)
	const [limit] = useState(20)
	const [total, setTotal] = useState(0)

	useEffect(() => {
		fetchBrands()
	}, [])

	useEffect(() => {
		fetchProducts()
	}, [page, searchQuery, brandFilter, typeFilter, activeFilter])

	async function fetchBrands() {
		try {
			const response = await fetch('/api/catalog/brands')
			if (!response.ok) {
				throw new Error('Failed to fetch brands')
			}
			const data = await response.json()
			setBrands(data.brands)
		} catch (err) {
			console.error('Error fetching brands:', err)
		}
	}

	async function fetchProducts() {
		setLoading(true)
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			})

			if (searchQuery) params.append('search', searchQuery)
			if (brandFilter) params.append('brand', brandFilter)
			if (typeFilter) params.append('type', typeFilter)
			if (activeFilter) params.append('active', activeFilter)

			const response = await fetch(`/api/catalog/products?${params}`)
			if (!response.ok) {
				throw new Error('Failed to fetch products')
			}
			const data = await response.json()
			setProducts(data.products)
			setTotal(data.pagination.total)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	async function handleDelete(product: Product) {
		if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
			return
		}

		try {
			const response = await fetch(`/api/catalog/products/${product.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to delete product')
			}

			// Refresh products list
			await fetchProducts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete product')
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

	function handleResetFilters() {
		setSearchQuery('')
		setBrandFilter('')
		setTypeFilter('')
		setActiveFilter('')
		setPage(1)
	}

	const totalPages = Math.ceil(total / limit)
	const hasActiveFilters = searchQuery || brandFilter || typeFilter || activeFilter

	if (loading && products.length === 0) {
		return <TableSkeleton />
	}

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<div className="space-y-4">
				{/* Search and Add button */}
				<div className="flex items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search by name or SKU..."
							value={searchQuery}
							onChange={e => {
								setSearchQuery(e.target.value)
								setPage(1)
							}}
							className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<a
						href="/admin/catalog/products/new"
						className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						data-testid="add-product-button"
					>
						<Plus className="h-4 w-4" />
						Add Product
					</a>
				</div>

				{/* Filter row */}
				<div className="flex items-center gap-4">
					{/* Brand filter */}
					<select
						value={brandFilter}
						onChange={e => {
							setBrandFilter(e.target.value)
							setPage(1)
						}}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Brands</option>
						{brands.map(brand => (
							<option key={brand.id} value={brand.id}>
								{brand.name}
							</option>
						))}
					</select>

					{/* Type filter */}
					<select
						value={typeFilter}
						onChange={e => {
							setTypeFilter(e.target.value)
							setPage(1)
						}}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Types</option>
						<option value="laptop">Laptop</option>
						<option value="desktop">Desktop</option>
						<option value="tablet">Tablet</option>
						<option value="phone">Phone</option>
						<option value="accessory">Accessory</option>
						<option value="display">Display</option>
					</select>

					{/* Active filter */}
					<select
						value={activeFilter}
						onChange={e => {
							setActiveFilter(e.target.value)
							setPage(1)
						}}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">All Status</option>
						<option value="true">Active</option>
						<option value="false">Inactive</option>
					</select>

					{/* Reset filters */}
					{hasActiveFilters && (
						<button
							type="button"
							onClick={handleResetFilters}
							className="text-sm text-primary hover:underline"
						>
							Reset Filters
						</button>
					)}
				</div>
			</div>

			{/* Error message */}
			{error && (
				<div className="rounded-md bg-red-50 p-4 text-red-900">
					<p className="font-medium">Error</p>
					<p className="text-sm">{error}</p>
				</div>
			)}

			{/* Product count */}
			<div className="text-sm text-muted-foreground">
				Showing {products.length} of {total} products
			</div>

			{/* Product table */}
			{products.length === 0 ? (
				<EmptyState
					icon={<Package className="h-12 w-12" />}
					title="No products found"
					description={
						hasActiveFilters ? 'Try adjusting your filters' : 'No products have been created yet'
					}
					action={
						!hasActiveFilters ? (
							<a
								href="/admin/catalog/products/new"
								className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								<Plus className="h-4 w-4" />
								Add Your First Product
							</a>
						) : undefined
					}
				/>
			) : (
				<>
					<div className="overflow-hidden rounded-lg border border-border">
						<table className="w-full">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Product
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Brand
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										SKU
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										MSRP
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Status
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border bg-card">
								{products.map(product => (
									<tr key={product.id} className="hover:bg-muted/50">
										<td className="px-6 py-4 text-sm font-medium">
											<div className="flex items-center gap-2">
												{product.imageUrl ? (
													<img src={product.imageUrl} alt={product.name} className="h-8 w-8 rounded object-cover" />
												) : (
													<Package className="h-4 w-4 text-muted-foreground" />
												)}
												<div>
													{product.name}
													{product.modelIdentifier && (
														<div className="text-xs text-muted-foreground">{product.modelIdentifier}</div>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">{product.brandName}</td>
										<td className="px-6 py-4 text-sm font-mono text-muted-foreground">{product.sku}</td>
										<td className="px-6 py-4 text-sm capitalize text-muted-foreground">{product.productType}</td>
										<td className="px-6 py-4 text-sm">{formatPrice(product.msrp)}</td>
										<td className="px-6 py-4 text-sm">
											{product.isActive ? (
												<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
													Active
												</span>
											) : (
												<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
													Inactive
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-right text-sm">
											<div className="flex items-center justify-end gap-2">
												<a
													href={`/admin/catalog/products/${product.id}/edit`}
													className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
													data-testid={`edit-product-${product.sku}`}
												>
													<Pencil className="h-3.5 w-3.5" />
													Edit
												</a>
												<button
													type="button"
													onClick={() => handleDelete(product)}
													className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
													data-testid={`delete-product-${product.sku}`}
												>
													<Trash2 className="h-3.5 w-3.5" />
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								Page {page} of {totalPages}
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setPage(p => Math.max(1, p - 1))}
									disabled={page === 1}
									className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronLeft className="h-4 w-4" />
									Previous
								</button>
								<button
									type="button"
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
