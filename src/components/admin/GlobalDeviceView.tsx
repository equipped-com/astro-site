/**
 * Global Device View Component
 *
 * Displays all devices across all customers for sys admins.
 */
import { Download, Laptop, Package, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../dashboard/EmptyState'
import { Spinner } from '../dashboard/Spinner'
import { TableSkeleton } from '../dashboard/TableSkeleton'

interface Device {
	id: string
	name: string
	type: string
	serial_number?: string
	assigned_to_name?: string
	account_name: string
	account_short_name: string
	status: string
	created_at: string
}

export default function GlobalDeviceView() {
	const [devices, setDevices] = useState<Device[]>([])
	const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [customerFilter, setCustomerFilter] = useState('')

	useEffect(() => {
		async function fetchDevices() {
			try {
				const response = await fetch('/api/admin/devices')
				if (!response.ok) {
					throw new Error('Failed to fetch devices')
				}
				const data = await response.json()
				setDevices(data)
				setFilteredDevices(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchDevices()
	}, [])

	useEffect(() => {
		let filtered = devices

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				device =>
					device.name.toLowerCase().includes(query) ||
					device.serial_number?.toLowerCase().includes(query) ||
					device.assigned_to_name?.toLowerCase().includes(query),
			)
		}

		if (customerFilter) {
			filtered = filtered.filter(device => device.account_short_name === customerFilter)
		}

		setFilteredDevices(filtered)
	}, [searchQuery, customerFilter, devices])

	function handleExport() {
		// Generate CSV export
		const headers = ['Device Name', 'Type', 'Serial Number', 'Assigned To', 'Customer', 'Status']
		const rows = filteredDevices.map(device => [
			device.name,
			device.type,
			device.serial_number || '',
			device.assigned_to_name || 'Unassigned',
			device.account_name,
			device.status,
		])

		const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
		const blob = new Blob([csv], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `devices-${new Date().toISOString().split('T')[0]}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	// Get unique customer list for filter
	const uniqueCustomers = Array.from(new Set(devices.map(d => d.account_short_name))).sort()

	if (loading) {
		return <TableSkeleton />
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4 text-red-900">
				<p className="font-medium">Error loading devices</p>
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
						placeholder="Search by device name, serial, or assignee..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<select
					value={customerFilter}
					onChange={e => setCustomerFilter(e.target.value)}
					className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Customers</option>
					{uniqueCustomers.map(customer => (
						<option key={customer} value={customer}>
							{customer}
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

			{/* Device count */}
			<div className="text-sm text-muted-foreground">
				Showing {filteredDevices.length} of {devices.length} devices
			</div>

			{/* Device table */}
			{filteredDevices.length === 0 ? (
				<EmptyState
					icon={<Package className="h-12 w-12" />}
					title="No devices found"
					description={searchQuery || customerFilter ? 'Try adjusting your filters' : 'No devices exist yet'}
				/>
			) : (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Device
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Type
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Serial Number
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Assigned To
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Customer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{filteredDevices.map(device => (
								<tr key={device.id} className="hover:bg-muted/50">
									<td className="px-6 py-4 text-sm font-medium">
										<div className="flex items-center gap-2">
											<Laptop className="h-4 w-4 text-muted-foreground" />
											{device.name}
										</div>
									</td>
									<td className="px-6 py-4 text-sm capitalize">{device.type}</td>
									<td className="px-6 py-4 text-sm font-mono text-muted-foreground">{device.serial_number || 'N/A'}</td>
									<td className="px-6 py-4 text-sm">
										{device.assigned_to_name || <span className="text-muted-foreground">Unassigned</span>}
									</td>
									<td className="px-6 py-4 text-sm">
										<a
											href={`https://${device.account_short_name}.tryequipped.com`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											{device.account_name}
										</a>
									</td>
									<td className="px-6 py-4 text-sm">
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
												device.status === 'active'
													? 'bg-green-100 text-green-700'
													: device.status === 'pending'
														? 'bg-yellow-100 text-yellow-700'
														: 'bg-gray-100 text-gray-700'
											}`}
										>
											{device.status}
										</span>
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
