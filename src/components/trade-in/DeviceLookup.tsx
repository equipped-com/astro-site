'use client'

import { AlertCircle, CheckCircle, Laptop, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import type { DeviceModel } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface DeviceLookupProps {
	onDeviceFound: (serial: string, device: DeviceModel) => void
	onError?: (error: string) => void
	className?: string
}

export function DeviceLookup({ onDeviceFound, onError, className }: DeviceLookupProps) {
	const [serial, setSerial] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [foundDevice, setFoundDevice] = useState<DeviceModel | null>(null)

	async function handleLookup() {
		if (!serial.trim()) {
			setError('Please enter a serial number')
			return
		}

		setIsLoading(true)
		setError(null)
		setFoundDevice(null)

		try {
			// Dynamic import to avoid SSR issues
			const { lookupDevice } = await import('@/lib/alchemy/client')
			const result = await lookupDevice(serial)

			if (result.success && result.device) {
				setFoundDevice(result.device)
				onDeviceFound(result.serial, result.device)
			} else {
				const errorMsg = result.error || 'Device not found'
				setError(errorMsg)
				onError?.(errorMsg)
			}
		} catch (err) {
			const errorMsg = 'Failed to look up device. Please try again.'
			setError(errorMsg)
			onError?.(errorMsg)
		} finally {
			setIsLoading(false)
		}
	}

	function handleKeyDown(event: React.KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLookup()
		}
	}

	return (
		<div className={cn('space-y-6', className)}>
			{/* Input Section */}
			<div className="space-y-4">
				<div>
					<label htmlFor="serial" className="block text-sm font-medium text-foreground mb-2">
						Device Serial Number
					</label>
					<p className="text-sm text-muted-foreground mb-3">
						Find your serial number in System Settings {'>'} General {'>'} About, or on the bottom of your device.
					</p>
					<div className="flex gap-3">
						<div className="relative flex-1">
							<input
								id="serial"
								type="text"
								value={serial}
								onChange={e => setSerial(e.target.value.toUpperCase())}
								onKeyDown={handleKeyDown}
								placeholder="e.g., C02XYZ123ABC"
								className={cn(
									'w-full rounded-md border border-input bg-background px-4 py-3 text-sm font-mono',
									'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
									error && 'border-destructive focus:ring-destructive',
								)}
								disabled={isLoading}
							/>
							{foundDevice && (
								<CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
							)}
						</div>
						<button
							type="button"
							onClick={handleLookup}
							disabled={isLoading || !serial.trim()}
							className={cn(
								'inline-flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium',
								'bg-primary text-primary-foreground hover:bg-primary/90',
								'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
							)}
						>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
							Look Up
						</button>
					</div>
				</div>

				{/* Error State */}
				{error && (
					<div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4">
						<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-destructive">Device Not Found</p>
							<p className="text-sm text-muted-foreground mt-1">{error}</p>
						</div>
					</div>
				)}
			</div>

			{/* Device Found Card */}
			{foundDevice && (
				<div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
					<div className="flex items-start gap-4">
						<div className="rounded-lg bg-muted p-3">
							<Laptop className="h-8 w-8 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-foreground">{foundDevice.model}</h3>
							<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-muted-foreground">Year:</span>{' '}
									<span className="text-foreground">{foundDevice.year}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Color:</span>{' '}
									<span className="text-foreground">{foundDevice.color}</span>
								</div>
								{foundDevice.storage && (
									<div>
										<span className="text-muted-foreground">Storage:</span>{' '}
										<span className="text-foreground">{foundDevice.storage}</span>
									</div>
								)}
							</div>
							{foundDevice.specs && (
								<div className="mt-3 flex flex-wrap gap-2">
									{Object.entries(foundDevice.specs).map(([key, value]) => (
										<span
											key={key}
											className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
										>
											{value}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Demo Hint */}
			<div className="text-xs text-muted-foreground">
				<p>
					<span className="font-medium">Demo:</span> Try serial number{' '}
					<button
						type="button"
						onClick={() => setSerial('C02XYZ123ABC')}
						className="font-mono text-primary hover:underline"
					>
						C02XYZ123ABC
					</button>{' '}
					for a sample MacBook Air M1.
				</p>
			</div>
		</div>
	)
}
