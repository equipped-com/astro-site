/**
 * Customer List Component
 *
 * Displays all customer accounts with search and filtering for sys admins.
 * Includes "View as Customer" button for impersonation.
 *
 * @REQ-SA-003 View all customers with search/filter
 * @REQ-SA-006 Enter impersonation mode
 */
import { useUser } from '@clerk/clerk-react'
import { Building2, ExternalLink, Eye, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getImpersonationUrl, startImpersonationSession } from '@/lib/impersonation'
import { EmptyState } from '../dashboard/EmptyState'
import { TableSkeleton } from '../dashboard/TableSkeleton'

interface Customer {
	id: string
	name: string
	short_name: string
	primary_contact_email?: string
	device_count: number
	last_order_date?: string
	created_at: string
}

export default function CustomerList() {
	const { user } = useUser()
	const [customers, setCustomers] = useState<Customer[]>([])
	const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [impersonating, setImpersonating] = useState<string | null>(null)

	useEffect(() => {
		async function fetchCustomers() {
			try {
				const response = await fetch('/api/admin/customers')
				if (!response.ok) {
					throw new Error('Failed to fetch customers')
				}
				const data = await response.json()
				setCustomers(data)
				setFilteredCustomers(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchCustomers()
	}, [])

	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredCustomers(customers)
			return
		}

		const query = searchQuery.toLowerCase()
		const filtered = customers.filter(
			customer =>
				customer.name.toLowerCase().includes(query) ||
				customer.short_name.toLowerCase().includes(query) ||
				customer.primary_contact_email?.toLowerCase().includes(query),
		)
		setFilteredCustomers(filtered)
	}, [searchQuery, customers])

	function formatDate(dateString?: string): string {
		if (!dateString) return 'Never'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	/**
	 * Start impersonation session for a customer
	 * @REQ-SA-006 Enter impersonation mode
	 */
	const handleViewAsCustomer = useCallback(
		async (customer: Customer) => {
			if (!user) return

			setImpersonating(customer.id)

			try {
				// Call API to log impersonation start
				const response = await fetch('/api/admin/impersonation/start', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ accountId: customer.id }),
				})

				if (!response.ok) {
					throw new Error('Failed to start impersonation')
				}

				const { session } = await response.json()

				// Store session in localStorage
				startImpersonationSession(session)

				// Redirect to customer's dashboard with impersonation flag
				window.location.href = getImpersonationUrl(customer.short_name)
			} catch (err) {
				console.error('Failed to start impersonation:', err)
				setError(err instanceof Error ? err.message : 'Failed to start impersonation')
				setImpersonating(null)
			}
		},
		[user],
	)

	if (loading) {
		return <TableSkeleton />
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4 text-red-900">
				<p className="font-medium">Error loading customers</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Search bar */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by company name or email..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<button
					type="button"
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Export CSV
				</button>
			</div>

			{/* Customer count */}
			<div className="text-sm text-muted-foreground">
				Showing {filteredCustomers.length} of {customers.length} customers
			</div>

			{/* Customer table */}
			{filteredCustomers.length === 0 ? (
				<EmptyState
					icon={<Building2 className="h-12 w-12" />}
					title="No customers found"
					description={searchQuery ? 'Try adjusting your search query' : 'No customer accounts exist yet'}
				/>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Company Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Primary Contact
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Device Count
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Last Order
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Created Date
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{filteredCustomers.map(customer => (
								<tr key={customer.id} className="hover:bg-muted/50">
									<td className="px-6 py-4 text-sm font-medium">
										<div className="flex items-center gap-2">
											<Building2 className="h-4 w-4 text-muted-foreground" />
											{customer.name}
										</div>
										<div className="text-xs text-muted-foreground">{customer.short_name}.tryequipped.com</div>
									</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">
										{customer.primary_contact_email || 'Not set'}
									</td>
									<td className="px-6 py-4 text-sm">{customer.device_count}</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(customer.last_order_date)}</td>
									<td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(customer.created_at)}</td>
									<td className="px-6 py-4 text-right text-sm">
										<div className="flex items-center justify-end gap-3">
											{/* View as Customer button - @REQ-SA-006 */}
											<button
												type="button"
												onClick={() => handleViewAsCustomer(customer)}
												disabled={impersonating === customer.id}
												className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
												data-testid={`impersonate-${customer.short_name}`}
											>
												<Eye className="h-3.5 w-3.5" />
												{impersonating === customer.id ? 'Loading...' : 'View as Customer'}
											</button>
											{/* External link to customer portal */}
											<a
												href={`https://${customer.short_name}.tryequipped.com`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-primary hover:underline"
											>
												View Site
												<ExternalLink className="h-3 w-3" />
											</a>
										</div>
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
