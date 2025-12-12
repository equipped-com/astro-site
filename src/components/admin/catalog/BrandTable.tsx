/**
 * Brand Table Component
 *
 * Displays all brands with add/edit/delete functionality for sys admins.
 *
 * @REQ-UI-002 Manage brands
 */
import { Pencil, Plus, Search, Store, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { TableSkeleton } from '@/components/dashboard/TableSkeleton'

interface Brand {
	id: string
	name: string
	slug: string
	logoUrl?: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
}

interface BrandFormData {
	name: string
	slug: string
	logo_url?: string
}

export default function BrandTable() {
	const [brands, setBrands] = useState<Brand[]>([])
	const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [showDialog, setShowDialog] = useState(false)
	const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
	const [formData, setFormData] = useState<BrandFormData>({
		name: '',
		slug: '',
		logo_url: '',
	})
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		fetchBrands()
	}, [])

	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredBrands(brands)
			return
		}

		const query = searchQuery.toLowerCase()
		const filtered = brands.filter(
			brand => brand.name.toLowerCase().includes(query) || brand.slug.toLowerCase().includes(query),
		)
		setFilteredBrands(filtered)
	}, [searchQuery, brands])

	async function fetchBrands() {
		try {
			const response = await fetch('/api/catalog/brands')
			if (!response.ok) {
				throw new Error('Failed to fetch brands')
			}
			const data = await response.json()
			setBrands(data.brands)
			setFilteredBrands(data.brands)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	function handleAddBrand() {
		setEditingBrand(null)
		setFormData({
			name: '',
			slug: '',
			logo_url: '',
		})
		setShowDialog(true)
	}

	function handleEditBrand(brand: Brand) {
		setEditingBrand(brand)
		setFormData({
			name: brand.name,
			slug: brand.slug,
			logo_url: brand.logoUrl || '',
		})
		setShowDialog(true)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)

		try {
			const url = editingBrand ? `/api/catalog/brands/${editingBrand.id}` : '/api/catalog/brands'
			const method = editingBrand ? 'PUT' : 'POST'

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to save brand')
			}

			// Refresh brands list
			await fetchBrands()
			setShowDialog(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save brand')
		} finally {
			setSubmitting(false)
		}
	}

	async function handleDelete(brand: Brand) {
		if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) {
			return
		}

		try {
			const response = await fetch(`/api/catalog/brands/${brand.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to delete brand')
			}

			// Refresh brands list
			await fetchBrands()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete brand')
		}
	}

	function formatDate(dateString?: string): string {
		if (!dateString) return 'Unknown'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	if (loading) {
		return <TableSkeleton />
	}

	return (
		<div className="space-y-6">
			{/* Search and Add bar */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search brands..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<button
					type="button"
					onClick={handleAddBrand}
					className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					data-testid="add-brand-button"
				>
					<Plus className="h-4 w-4" />
					Add Brand
				</button>
			</div>

			{/* Error message */}
			{error && (
				<div className="rounded-md bg-red-50 p-4 text-red-900">
					<p className="font-medium">Error</p>
					<p className="text-sm">{error}</p>
				</div>
			)}

			{/* Brand count */}
			<div className="text-sm text-muted-foreground">
				Showing {filteredBrands.length} of {brands.length} brands
			</div>

			{/* Brand table */}
			{filteredBrands.length === 0 ? (
				<EmptyState
					icon={<Store className="h-12 w-12" />}
					title="No brands found"
					description={searchQuery ? 'Try adjusting your search query' : 'No brands have been created yet'}
					action={
						!searchQuery ? (
							<button
								type="button"
								onClick={handleAddBrand}
								className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								<Plus className="h-4 w-4" />
								Add Your First Brand
							</button>
						) : undefined
					}
				/>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Brand Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Slug
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Created
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{filteredBrands.map(brand => (
								<tr key={brand.id} className="hover:bg-muted/50">
									<td className="px-6 py-4 text-sm font-medium">
										<div className="flex items-center gap-2">
											{brand.logoUrl ? (
												<img src={brand.logoUrl} alt={brand.name} className="h-6 w-6 rounded object-contain" />
											) : (
												<Store className="h-4 w-4 text-muted-foreground" />
											)}
											{brand.name}
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{brand.slug}</td>
									<td className="px-6 py-4 text-sm">
										{brand.isActive ? (
											<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
												Active
											</span>
										) : (
											<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
												Inactive
											</span>
										)}
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(brand.createdAt)}</td>
									<td className="px-6 py-4 text-right text-sm">
										<div className="flex items-center justify-end gap-2">
											<button
												type="button"
												onClick={() => handleEditBrand(brand)}
												className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
												data-testid={`edit-brand-${brand.slug}`}
											>
												<Pencil className="h-3.5 w-3.5" />
												Edit
											</button>
											<button
												type="button"
												onClick={() => handleDelete(brand)}
												className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
												data-testid={`delete-brand-${brand.slug}`}
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
			)}

			{/* Add/Edit Dialog */}
			{showDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
						<h2 className="mb-4 text-xl font-bold">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>

						<form onSubmit={handleSubmit} className="space-y-4">
							{/* Name */}
							<div>
								<label htmlFor="name" className="mb-1 block text-sm font-medium">
									Brand Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="name"
									required
									value={formData.name}
									onChange={e => setFormData({ ...formData, name: e.target.value })}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="Apple"
								/>
							</div>

							{/* Slug */}
							<div>
								<label htmlFor="slug" className="mb-1 block text-sm font-medium">
									Slug <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="slug"
									required
									value={formData.slug}
									onChange={e => setFormData({ ...formData, slug: e.target.value })}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="apple"
								/>
								<p className="mt-1 text-xs text-muted-foreground">Lowercase, no spaces (used in URLs)</p>
							</div>

							{/* Logo URL */}
							<div>
								<label htmlFor="logo_url" className="mb-1 block text-sm font-medium">
									Logo URL
								</label>
								<input
									type="url"
									id="logo_url"
									value={formData.logo_url}
									onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="https://example.com/logo.png"
								/>
							</div>

							{/* Buttons */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowDialog(false)}
									disabled={submitting}
									className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								>
									{submitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
