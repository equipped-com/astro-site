'use client'

import { Edit, MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import type { Device } from '@/lib/scoped-queries'

interface DeviceTableProps {
	devices: Device[]
	onUpdate: (device: Device) => void
	onDelete: (deviceId: string) => void
}

export default function DeviceTable({ devices, onUpdate: _onUpdate, onDelete }: DeviceTableProps) {
	const [actionMenuId, setActionMenuId] = useState<string | null>(null)

	function getStatusBadgeColor(status: Device['status']): string {
		switch (status) {
			case 'available':
				return 'bg-green-100 text-green-700 border-green-200'
			case 'assigned':
				return 'bg-blue-100 text-blue-700 border-blue-200'
			case 'in_use':
				return 'bg-purple-100 text-purple-700 border-purple-200'
			case 'maintenance':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200'
			case 'retired':
				return 'bg-gray-100 text-gray-700 border-gray-200'
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200'
		}
	}

	function formatStatus(status: Device['status']): string {
		return status
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}

	async function handleDelete(deviceId: string) {
		if (!confirm('Are you sure you want to delete this device?')) {
			return
		}

		try {
			const response = await fetch(`/api/devices/${deviceId}`, {
				method: 'DELETE',
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error('Failed to delete device')
			}

			onDelete(deviceId)
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to delete device')
		}
	}

	return (
		<div className="rounded-lg border border-border overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-muted border-b border-border">
						<tr>
							<th className="px-4 py-3 text-left font-semibold">Name</th>
							<th className="px-4 py-3 text-left font-semibold">Type</th>
							<th className="px-4 py-3 text-left font-semibold">Model</th>
							<th className="px-4 py-3 text-left font-semibold">Serial Number</th>
							<th className="px-4 py-3 text-left font-semibold">Status</th>
							<th className="px-4 py-3 text-left font-semibold">Assigned To</th>
							<th className="px-4 py-3 text-left font-semibold">Trade-In Value</th>
							<th className="px-4 py-3 text-right font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{devices.map(device => (
							<tr key={device.id} className="hover:bg-muted/50 transition-colors">
								<td className="px-4 py-3 font-medium">{device.name}</td>
								<td className="px-4 py-3">{device.type}</td>
								<td className="px-4 py-3">{device.model}</td>
								<td className="px-4 py-3 font-mono text-xs text-muted-foreground">
									{device.serial_number || <span className="italic">Not provided</span>}
								</td>
								<td className="px-4 py-3">
									<span
										className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadgeColor(device.status)}`}
									>
										{formatStatus(device.status)}
									</span>
								</td>
								<td className="px-4 py-3">
									{device.assigned_to || <span className="italic text-muted-foreground">Unassigned</span>}
								</td>
								<td className="px-4 py-3">
									<span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200">
										Trade-In: $450
									</span>
								</td>
								<td className="px-4 py-3 text-right">
									<div className="relative inline-block">
										<button
											type="button"
											onClick={() => setActionMenuId(actionMenuId === device.id ? null : device.id)}
											className="p-1 rounded hover:bg-muted transition-colors"
											aria-label="Device actions"
										>
											<MoreVertical className="h-4 w-4" />
										</button>

										{actionMenuId === device.id && (
											<>
												<div
													className="fixed inset-0 z-10"
													onClick={() => setActionMenuId(null)}
													onKeyDown={e => e.key === 'Escape' && setActionMenuId(null)}
													role="button"
													tabIndex={-1}
													aria-label="Close menu"
												/>
												<div className="absolute right-0 mt-2 w-40 rounded-md border border-border bg-card shadow-lg z-20">
													<button
														type="button"
														onClick={() => {
															setActionMenuId(null)
															// TODO: Implement edit modal
															alert('Edit functionality coming soon')
														}}
														className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
													>
														<Edit className="h-4 w-4" />
														Edit
													</button>
													<button
														type="button"
														onClick={() => {
															setActionMenuId(null)
															handleDelete(device.id)
														}}
														className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
													>
														<Trash className="h-4 w-4" />
														Delete
													</button>
												</div>
											</>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
