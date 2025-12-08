'use client'

import { Download, Mail, Package, Printer, QrCode, Truck } from 'lucide-react'
import { useState } from 'react'
import type { ShippingLabel, TradeInItem } from '@/lib/alchemy/types'
import { cn } from '@/lib/utils'

interface ReturnLabelProps {
	tradeIn: TradeInItem
	onLabelGenerated?: (label: ShippingLabel) => void
	className?: string
}

export function ReturnLabel({ tradeIn, onLabelGenerated, className }: ReturnLabelProps) {
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSendingEmail, setIsSendingEmail] = useState(false)
	const [emailSent, setEmailSent] = useState(false)
	const label = tradeIn.shippingLabel

	async function handleGenerateLabel() {
		setIsGenerating(true)
		try {
			// Call API to generate label
			const response = await fetch('/api/trade-in/generate-label', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tradeInId: tradeIn.id }),
			})

			if (!response.ok) {
				throw new Error('Failed to generate label')
			}

			const data = await response.json()
			onLabelGenerated?.(data.label)
		} catch (error) {
			console.error('Error generating label:', error)
			alert('Failed to generate shipping label. Please try again.')
		} finally {
			setIsGenerating(false)
		}
	}

	async function handleEmailLabel() {
		if (!label) return

		setIsSendingEmail(true)
		try {
			const response = await fetch('/api/trade-in/email-label', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tradeInId: tradeIn.id }),
			})

			if (!response.ok) {
				throw new Error('Failed to send email')
			}

			setEmailSent(true)
			setTimeout(() => setEmailSent(false), 3000)
		} catch (error) {
			console.error('Error sending email:', error)
			alert('Failed to email label. Please try again.')
		} finally {
			setIsSendingEmail(false)
		}
	}

	async function handleDownloadPDF() {
		if (!label) return

		try {
			const response = await fetch(`/api/trade-in/label-pdf/${label.labelId}`)
			if (!response.ok) {
				throw new Error('Failed to download label')
			}

			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `shipping-label-${label.trackingNumber}.pdf`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Error downloading PDF:', error)
			alert('Failed to download label. Please try again.')
		}
	}

	function handlePrintLabel() {
		if (!label?.labelUrl) return
		window.open(label.labelUrl, '_blank')
	}

	if (!label) {
		return (
			<div className={cn('space-y-6', className)}>
				<div className="rounded-xl border border-border bg-card p-6">
					<div className="text-center space-y-4">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
							<Package className="h-8 w-8 text-primary" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-foreground">Ready to Ship?</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Generate a free prepaid shipping label to send us your device.
							</p>
						</div>
						<button
							type="button"
							onClick={handleGenerateLabel}
							disabled={isGenerating}
							className={cn(
								'w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3',
								'bg-primary text-primary-foreground font-medium hover:bg-primary/90',
								'disabled:opacity-50 transition-colors',
							)}
						>
							{isGenerating ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Generating label...
								</>
							) : (
								<>
									<Truck className="h-5 w-5" />
									Get Return Label
								</>
							)}
						</button>
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-4">
					<h4 className="text-sm font-medium text-foreground mb-3">What to expect:</h4>
					<ul className="space-y-2 text-sm text-muted-foreground">
						<li className="flex gap-2">
							<span className="text-primary">•</span>
							<span>Free prepaid shipping label (no cost to you)</span>
						</li>
						<li className="flex gap-2">
							<span className="text-primary">•</span>
							<span>Label will be emailed and available for download</span>
						</li>
						<li className="flex gap-2">
							<span className="text-primary">•</span>
							<span>Package your device securely in original box (if available)</span>
						</li>
						<li className="flex gap-2">
							<span className="text-primary">•</span>
							<span>Drop off at any {label?.carrier || 'FedEx'} location or schedule pickup</span>
						</li>
					</ul>
				</div>
			</div>
		)
	}

	const expiresAt = new Date(label.expiresAt)
	const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

	return (
		<div className={cn('space-y-6', className)}>
			{/* Label Generated Card */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-6 py-8 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
						<Package className="h-8 w-8 text-green-600" />
					</div>
					<h3 className="text-xl font-bold text-foreground">Shipping Label Ready!</h3>
					<p className="text-sm text-muted-foreground mt-2">
						Your prepaid return label has been generated and is ready to use.
					</p>
				</div>

				<div className="px-6 py-6 space-y-6">
					{/* Tracking Info */}
					<div className="flex items-center justify-between pb-4 border-b border-border">
						<div>
							<p className="text-xs text-muted-foreground">Carrier</p>
							<p className="font-medium text-foreground">{label.carrier}</p>
						</div>
						<div className="text-right">
							<p className="text-xs text-muted-foreground">Tracking Number</p>
							<p className="font-mono text-sm font-medium text-foreground">{label.trackingNumber}</p>
						</div>
					</div>

					{/* QR Code Placeholder */}
					<div className="flex justify-center py-4">
						<div className="flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30">
							<QrCode className="h-16 w-16 text-muted-foreground" />
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<button
							type="button"
							onClick={handleDownloadPDF}
							className={cn(
								'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3',
								'bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors',
							)}
						>
							<Download className="h-5 w-5" />
							Download PDF
						</button>

						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={handleEmailLabel}
								disabled={isSendingEmail}
								className={cn(
									'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
									'border border-border bg-background text-foreground font-medium',
									'hover:bg-muted transition-colors disabled:opacity-50',
								)}
							>
								<Mail className="h-4 w-4" />
								{emailSent ? 'Sent!' : isSendingEmail ? 'Sending...' : 'Email Label'}
							</button>

							<button
								type="button"
								onClick={handlePrintLabel}
								className={cn(
									'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
									'border border-border bg-background text-foreground font-medium',
									'hover:bg-muted transition-colors',
								)}
							>
								<Printer className="h-4 w-4" />
								Print
							</button>
						</div>
					</div>

					{/* Expiration Notice */}
					{daysUntilExpiry <= 30 && (
						<div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
							<div className="text-sm">
								<p className="font-medium text-amber-900">Label expires in {daysUntilExpiry} days</p>
								<p className="text-amber-700">
									Please ship by{' '}
									{expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Packing Instructions */}
			<div className="rounded-lg border border-border bg-card p-6">
				<h4 className="font-medium text-foreground mb-4">Packing Instructions</h4>
				<ol className="space-y-3 text-sm">
					<li className="flex gap-3">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium shrink-0 text-xs">
							1
						</span>
						<div>
							<p className="font-medium text-foreground">Back up your data</p>
							<p className="text-muted-foreground">Save any important files before shipping.</p>
						</div>
					</li>
					<li className="flex gap-3">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium shrink-0 text-xs">
							2
						</span>
						<div>
							<p className="font-medium text-foreground">Disable Find My</p>
							<p className="text-muted-foreground">
								Go to Settings &gt; [Your Name] &gt; Find My &gt; Find My Mac/iPhone &gt; Toggle off
							</p>
						</div>
					</li>
					<li className="flex gap-3">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium shrink-0 text-xs">
							3
						</span>
						<div>
							<p className="font-medium text-foreground">Factory reset</p>
							<p className="text-muted-foreground">Erase all content and settings before shipping.</p>
						</div>
					</li>
					<li className="flex gap-3">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium shrink-0 text-xs">
							4
						</span>
						<div>
							<p className="font-medium text-foreground">Pack securely</p>
							<p className="text-muted-foreground">
								Use original box if available, or wrap device in bubble wrap and place in sturdy box.
							</p>
						</div>
					</li>
					<li className="flex gap-3">
						<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium shrink-0 text-xs">
							5
						</span>
						<div>
							<p className="font-medium text-foreground">Attach label and ship</p>
							<p className="text-muted-foreground">
								Print and attach the shipping label to the outside of the box. Drop off at {label.carrier} or schedule a
								pickup.
							</p>
						</div>
					</li>
				</ol>
			</div>

			{/* Device Info */}
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-foreground">Shipping Device</p>
						<p className="text-xs text-muted-foreground mt-1">
							{tradeIn.model} ({tradeIn.year}) - {tradeIn.color}
						</p>
						<p className="text-xs text-muted-foreground font-mono">{tradeIn.serial}</p>
					</div>
					<div className="text-right">
						<p className="text-sm font-medium text-foreground">Trade-In Value</p>
						<p className="text-lg font-bold text-primary">${tradeIn.estimatedValue.toLocaleString()}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
