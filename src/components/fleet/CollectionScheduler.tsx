'use client'

import { ArrowLeft, Calendar, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '@/components/dashboard/Spinner'

interface Device {
	id: string
	name: string
	model: string
	type: string
}

interface CollectionSchedulerProps {
	device: Device
	collectionMethod: 'ship_label' | 'schedule_pickup'
	onBack: () => void
	onComplete: () => void
	submitting: boolean
}

export default function CollectionScheduler({
	device,
	collectionMethod,
	onBack,
	onComplete,
	submitting,
}: CollectionSchedulerProps) {
	const [email, setEmail] = useState('')
	const [address, setAddress] = useState('')
	const [pickupDate, setPickupDate] = useState('')

	function handleSchedule() {
		onComplete()
	}

	const isShipLabel = collectionMethod === 'ship_label'
	const isValid = isShipLabel ? email.trim().length > 0 : address.trim().length > 0 && pickupDate.trim().length > 0

	return (
		<div className="space-y-6">
			{/* Info banner */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start gap-3">
					{isShipLabel ? <Mail className="h-5 w-5 text-blue-600 mt-0.5" /> : <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />}
					<div className="flex-1">
						<p className="font-medium text-blue-900">
							{isShipLabel ? 'Shipping Label Details' : 'Pickup Scheduling'}
						</p>
						<p className="text-sm text-blue-700 mt-1">
							{isShipLabel
								? 'We\'ll send a prepaid return label to the employee. They can print it and drop off the package at any carrier location.'
								: 'Our courier partner will visit the address on the selected date to collect the device.'}
						</p>
					</div>
				</div>
			</div>

			{isShipLabel ? (
				<>
					{/* Email address */}
					<div>
						<label className="block text-sm font-medium mb-2" htmlFor="employee-email">
							Employee Email <span className="text-red-500">*</span>
						</label>
						<input
							id="employee-email"
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							placeholder="employee@company.com"
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<p className="text-xs text-muted-foreground mt-1">Shipping label will be sent to this address</p>
					</div>

					{/* Instructions preview */}
					<div className="bg-muted rounded-lg p-4">
						<p className="text-sm font-medium mb-2">Email will include:</p>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• Prepaid return shipping label (PDF)</li>
							<li>• Packaging instructions</li>
							<li>• Nearest drop-off locations</li>
							<li>• Expected processing timeline</li>
						</ul>
					</div>
				</>
			) : (
				<>
					{/* Pickup address */}
					<div>
						<label className="block text-sm font-medium mb-2" htmlFor="pickup-address">
							Pickup Address <span className="text-red-500">*</span>
						</label>
						<textarea
							id="pickup-address"
							value={address}
							onChange={e => setAddress(e.target.value)}
							placeholder="123 Main St, Apt 4B&#10;San Francisco, CA 94102"
							rows={3}
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
						/>
					</div>

					{/* Pickup date */}
					<div>
						<label className="block text-sm font-medium mb-2" htmlFor="pickup-date">
							Preferred Pickup Date <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								id="pickup-date"
								type="date"
								value={pickupDate}
								onChange={e => setPickupDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
								className="w-full rounded-md border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>
						<p className="text-xs text-muted-foreground mt-1">Courier will attempt pickup between 9 AM - 5 PM</p>
					</div>

					{/* Notes */}
					<div className="bg-muted rounded-lg p-4">
						<p className="text-sm font-medium mb-2">Pickup details:</p>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• Courier will call 30 minutes before arrival</li>
							<li>• Device should be powered off and packaged</li>
							<li>• Original packaging not required</li>
							<li>• Signature required upon collection</li>
						</ul>
					</div>
				</>
			)}

			{/* Actions */}
			<div className="flex justify-between gap-3 pt-4 border-t">
				<button
					type="button"
					onClick={onBack}
					disabled={submitting}
					className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>
				<button
					type="button"
					onClick={handleSchedule}
					disabled={submitting || !isValid}
					className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitting && <Spinner size="sm" />}
					{submitting ? 'Scheduling...' : isShipLabel ? 'Send Label' : 'Schedule Pickup'}
				</button>
			</div>
		</div>
	)
}
