/**
 * Product Form Component
 *
 * Create or edit product form with validation and specs JSON editor.
 *
 * @REQ-UI-004 Create new product
 * @REQ-UI-005 Edit existing product
 */
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Brand {
	id: string
	name: string
}

interface ProductFormData {
	brand_id: string
	name: string
	model_identifier: string
	model_number: string
	sku: string
	product_type: string
	description: string
	specs: string
	msrp: string
	image_url: string
	is_active: boolean
}

interface ProductFormProps {
	productId?: string
}

export default function ProductForm({ productId }: ProductFormProps) {
	const [brands, setBrands] = useState<Brand[]>([])
	const [loading, setLoading] = useState(!!productId)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [jsonError, setJsonError] = useState<string | null>(null)

	const [formData, setFormData] = useState<ProductFormData>({
		brand_id: '',
		name: '',
		model_identifier: '',
		model_number: '',
		sku: '',
		product_type: '',
		description: '',
		specs: '',
		msrp: '',
		image_url: '',
		is_active: true,
	})

	useEffect(() => {
		fetchBrands()
	}, [])

	useEffect(() => {
		if (productId) {
			fetchProduct()
		}
	}, [productId])

	async function fetchBrands() {
		try {
			const response = await fetch('/api/catalog/brands')
			if (!response.ok) {
				throw new Error('Failed to fetch brands')
			}
			const data = await response.json()
			setBrands(data.brands)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch brands')
		}
	}

	async function fetchProduct() {
		setLoading(true)
		try {
			const response = await fetch(`/api/catalog/products/${productId}`)
			if (!response.ok) {
				throw new Error('Failed to fetch product')
			}
			const data = await response.json()
			const product = data.product

			setFormData({
				brand_id: product.brandId || '',
				name: product.name || '',
				model_identifier: product.modelIdentifier || '',
				model_number: product.modelNumber || '',
				sku: product.sku || '',
				product_type: product.productType || '',
				description: product.description || '',
				specs: product.specs || '',
				msrp: product.msrp ? product.msrp.toString() : '',
				image_url: product.imageUrl || '',
				is_active: product.isActive ?? true,
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch product')
		} finally {
			setLoading(false)
		}
	}

	function validateJSON(value: string): boolean {
		if (!value.trim()) {
			setJsonError(null)
			return true
		}

		try {
			JSON.parse(value)
			setJsonError(null)
			return true
		} catch (err) {
			setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
			return false
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)

		// Validate JSON specs
		if (formData.specs && !validateJSON(formData.specs)) {
			setSubmitting(false)
			return
		}

		try {
			const url = productId ? `/api/catalog/products/${productId}` : '/api/catalog/products'
			const method = productId ? 'PUT' : 'POST'

			// Build request body
			const body: Record<string, unknown> = {
				brand_id: formData.brand_id,
				name: formData.name,
				sku: formData.sku,
				product_type: formData.product_type,
				is_active: formData.is_active,
			}

			// Add optional fields
			if (formData.model_identifier) body.model_identifier = formData.model_identifier
			if (formData.model_number) body.model_number = formData.model_number
			if (formData.description) body.description = formData.description
			if (formData.specs) body.specs = JSON.parse(formData.specs)
			if (formData.msrp) body.msrp = Number.parseFloat(formData.msrp)
			if (formData.image_url) body.image_url = formData.image_url

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to save product')
			}

			// Redirect back to products list
			window.location.href = '/admin/catalog/products'
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save product')
			setSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Loading product...</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<a
					href="/admin/catalog/products"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Products
				</a>
			</div>

			{/* Error message */}
			{error && (
				<div className="rounded-md bg-red-50 p-4 text-red-900">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4" />
						<p className="font-medium">Error</p>
					</div>
					<p className="text-sm mt-1">{error}</p>
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-border bg-card p-6">
				{/* Basic Information */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Basic Information</h2>

					{/* Brand */}
					<div>
						<label htmlFor="brand_id" className="mb-1 block text-sm font-medium">
							Brand <span className="text-red-500">*</span>
						</label>
						<select
							id="brand_id"
							required
							value={formData.brand_id}
							onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="">Select a brand</option>
							{brands.map(brand => (
								<option key={brand.id} value={brand.id}>
									{brand.name}
								</option>
							))}
						</select>
					</div>

					{/* Product Name */}
					<div>
						<label htmlFor="name" className="mb-1 block text-sm font-medium">
							Product Name <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="name"
							required
							value={formData.name}
							onChange={e => setFormData({ ...formData, name: e.target.value })}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="MacBook Pro 14-inch M3"
						/>
					</div>

					{/* Model Identifier and Model Number */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="model_identifier" className="mb-1 block text-sm font-medium">
								Model Identifier
							</label>
							<input
								type="text"
								id="model_identifier"
								value={formData.model_identifier}
								onChange={e => setFormData({ ...formData, model_identifier: e.target.value })}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="MBP14-M3-512"
							/>
						</div>
						<div>
							<label htmlFor="model_number" className="mb-1 block text-sm font-medium">
								Model Number
							</label>
							<input
								type="text"
								id="model_number"
								value={formData.model_number}
								onChange={e => setFormData({ ...formData, model_number: e.target.value })}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="A2779"
							/>
						</div>
					</div>

					{/* SKU and Product Type */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="sku" className="mb-1 block text-sm font-medium">
								SKU <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="sku"
								required
								value={formData.sku}
								onChange={e => setFormData({ ...formData, sku: e.target.value })}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="APL-MBP14-M3-512"
							/>
						</div>
						<div>
							<label htmlFor="product_type" className="mb-1 block text-sm font-medium">
								Product Type <span className="text-red-500">*</span>
							</label>
							<select
								id="product_type"
								required
								value={formData.product_type}
								onChange={e => setFormData({ ...formData, product_type: e.target.value })}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="">Select type</option>
								<option value="laptop">Laptop</option>
								<option value="desktop">Desktop</option>
								<option value="tablet">Tablet</option>
								<option value="phone">Phone</option>
								<option value="accessory">Accessory</option>
								<option value="display">Display</option>
							</select>
						</div>
					</div>
				</div>

				{/* Pricing and Media */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Pricing and Media</h2>

					{/* MSRP */}
					<div>
						<label htmlFor="msrp" className="mb-1 block text-sm font-medium">
							MSRP (USD) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							id="msrp"
							required
							step="0.01"
							min="0"
							value={formData.msrp}
							onChange={e => setFormData({ ...formData, msrp: e.target.value })}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="1999.00"
						/>
					</div>

					{/* Image URL */}
					<div>
						<label htmlFor="image_url" className="mb-1 block text-sm font-medium">
							Image URL
						</label>
						<input
							type="url"
							id="image_url"
							value={formData.image_url}
							onChange={e => setFormData({ ...formData, image_url: e.target.value })}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="https://example.com/image.jpg"
						/>
					</div>
				</div>

				{/* Description and Specs */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Description and Specifications</h2>

					{/* Description */}
					<div>
						<label htmlFor="description" className="mb-1 block text-sm font-medium">
							Description
						</label>
						<textarea
							id="description"
							rows={3}
							value={formData.description}
							onChange={e => setFormData({ ...formData, description: e.target.value })}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Product description..."
						/>
					</div>

					{/* Specs JSON */}
					<div>
						<label htmlFor="specs" className="mb-1 block text-sm font-medium">
							Specifications (JSON)
						</label>
						<textarea
							id="specs"
							rows={6}
							value={formData.specs}
							onChange={e => {
								setFormData({ ...formData, specs: e.target.value })
								validateJSON(e.target.value)
							}}
							className={`w-full rounded-md border ${jsonError ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
							placeholder={`{
  "cpu": "Apple M3",
  "memory": "16GB",
  "storage": "512GB SSD",
  "display": "14.2-inch Liquid Retina XDR"
}`}
						/>
						{jsonError && <p className="mt-1 text-xs text-red-500">{jsonError}</p>}
						<p className="mt-1 text-xs text-muted-foreground">Enter valid JSON for product specifications</p>
					</div>
				</div>

				{/* Status */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold">Status</h2>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="is_active"
							checked={formData.is_active}
							onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
							className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
						/>
						<label htmlFor="is_active" className="text-sm font-medium">
							Active (visible in catalog)
						</label>
					</div>
				</div>

				{/* Submit */}
				<div className="flex gap-4 border-t border-border pt-4">
					<a
						href="/admin/catalog/products"
						className="flex-1 rounded-md border border-input px-4 py-2 text-center text-sm font-medium hover:bg-accent"
					>
						Cancel
					</a>
					<button
						type="submit"
						disabled={submitting || !!jsonError}
						className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save className="h-4 w-4" />
						{submitting ? 'Saving...' : productId ? 'Save Changes' : 'Create Product'}
					</button>
				</div>
			</form>
		</div>
	)
}
