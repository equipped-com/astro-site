'use client'

import { Filter, Laptop, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Spinner } from '@/components/dashboard/Spinner'
import type { Device } from '@/lib/scoped-queries'
import AddDeviceModal from './AddDeviceModal'
import DeviceTable from './DeviceTable'
import FleetSummaryCard from './FleetSummaryCard'

type StatusFilter = 'all' | Device['status']
type TypeFilter = 'all' | string

export default function DeviceInventory() {
	const [devices, setDevices] = useState<Device[]>([])
	const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)

	// Get unique device types from devices
	const deviceTypes = Array.from(new Set(devices.map(d => d.type).filter(Boolean))) as string[]

	// Fetch devices from API
	const fetchDevices = useCallback(async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/devices', {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error(`Failed to fetch devices: ${response.statusText}`)
			}

			const data = await response.json()
			setDevices(data.devices || [])
			setFilteredDevices(data.devices || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load devices')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchDevices()
	}, [fetchDevices])

	// Apply filters and search
	useEffect(() => {
		let filtered = [...devices]

		// Status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(d => d.status === statusFilter)
		}

		// Type filter
		if (typeFilter !== 'all') {
			filtered = filtered.filter(d => d.type === typeFilter)
		}

		// Search filter (name, serial, model, assigned_to)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				d =>
					d.name.toLowerCase().includes(query) ||
					d.model.toLowerCase().includes(query) ||
					d.serial_number?.toLowerCase().includes(query) ||
					d.assigned_to?.toLowerCase().includes(query),
			)
		}

		setFilteredDevices(filtered)
	}, [devices, searchQuery, statusFilter, typeFilter])

	function handleDeviceAdded(newDevice: Device) {
		setDevices([...devices, newDevice])
		setIsAddModalOpen(false)
	}

	function handleDeviceUpdated(updatedDevice: Device) {
		setDevices(devices.map(d => (d.id === updatedDevice.id ? updatedDevice : d)))
	}

	function handleDeviceDeleted(deviceId: string) {
		setDevices(devices.filter(d => d.id !== deviceId))
	}

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner size="lg" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
				<p className="font-semibold">Error loading devices</p>
				<p className="text-sm">{error}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Fleet Summary Card */}
			{devices.length > 0 && <FleetSummaryCard devices={devices} />}

			{/* Header with Add button */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Device Inventory</h1>
					<p className="mt-1 text-sm text-muted-foreground">Track and manage your organization's devices</p>
				</div>
				<button
					type="button"
					onClick={() => setIsAddModalOpen(true)}
					className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
				>
					<Plus className="h-4 w-4" />
					Add Device
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				{/* Search */}
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by name, serial, model, or assignee..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>

				{/* Status filter */}
				<div className="relative">
					<Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<select
						value={statusFilter}
						onChange={e => setStatusFilter(e.target.value as StatusFilter)}
						className="appearance-none rounded-md border border-border bg-background px-10 py-2 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					>
						<option value="all">All Statuses</option>
						<option value="available">Available</option>
						<option value="assigned">Assigned</option>
						<option value="in_use">In Use</option>
						<option value="maintenance">Maintenance</option>
						<option value="retired">Retired</option>
					</select>
				</div>

				{/* Type filter */}
				{deviceTypes.length > 0 && (
					<div className="relative">
						<Laptop className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<select
							value={typeFilter}
							onChange={e => setTypeFilter(e.target.value)}
							className="appearance-none rounded-md border border-border bg-background px-10 py-2 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							<option value="all">All Types</option>
							{deviceTypes.map(type => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* Results count */}
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Laptop className="h-4 w-4" />
				<span>
					Showing {filteredDevices.length} of {devices.length} devices
				</span>
			</div>

			{/* Device table/grid */}
			{filteredDevices.length === 0 ? (
				<EmptyState
					icon={<Laptop className="h-12 w-12" />}
					title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No results found' : 'No devices yet'}
					description={
						searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
							? 'Try adjusting your filters or search query'
							: 'Get started by adding your first device'
					}
					action={
						searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
							? {
									label: 'Clear Filters',
									onClick: () => {
										setSearchQuery('')
										setStatusFilter('all')
										setTypeFilter('all')
									},
								}
							: {
									label: 'Add Device',
									onClick: () => setIsAddModalOpen(true),
								}
					}
				>
					{devices.length === 0 && (
						<div className="mt-6 space-y-2 text-sm text-muted-foreground">
							<p>Quick actions:</p>
							<ul className="space-y-1">
								<li>• Add device by serial number</li>
								<li>• Order new device from store</li>
								<li>• Import from spreadsheet</li>
							</ul>
						</div>
					)}
				</EmptyState>
			) : (
				<DeviceTable devices={filteredDevices} onUpdate={handleDeviceUpdated} onDelete={handleDeviceDeleted} />
			)}

			{/* Add Device Modal */}
			<AddDeviceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleDeviceAdded} />
		</div>
	)
}
