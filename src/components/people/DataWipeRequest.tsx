'use client'

import { Award, CheckCircle2, RefreshCw, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataWipeRequestProps {
	deviceCount: number
	onWipeOptionSelected: (option: string) => void
	selectedOption: string | null
}

interface WipeOption {
	id: string
	label: string
	description: string
	icon: React.ReactNode
	details: string[]
	recommended?: boolean
}

const wipeOptions: WipeOption[] = [
	{
		id: 'standard_wipe',
		label: 'Standard wipe',
		description: 'Factory reset',
		icon: <RefreshCw className="h-6 w-6" />,
		details: [
			'Factory reset to default settings',
			'All user data removed',
			'Operating system reinstalled',
			'Suitable for most use cases',
		],
	},
	{
		id: 'secure_wipe',
		label: 'Secure wipe',
		description: 'DoD 5220.22-M compliant',
		icon: <Shield className="h-6 w-6" />,
		details: [
			'DoD 5220.22-M standard compliant',
			'Multi-pass data overwriting',
			'Military-grade secure erasure',
			'Meets compliance requirements',
		],
		recommended: true,
	},
	{
		id: 'certified_wipe',
		label: 'Certified wipe',
		description: 'With destruction certificate',
		icon: <Award className="h-6 w-6" />,
		details: [
			'DoD 5220.22-M secure wipe included',
			'Certificate of data destruction provided',
			'Audit trail documentation',
			'Required for regulated industries',
		],
	},
]

export default function DataWipeRequest({ deviceCount, onWipeOptionSelected, selectedOption }: DataWipeRequestProps) {
	return (
		<div className="space-y-4">
			<div>
				<h3 className="font-semibold text-lg">Request Secure Data Wipe</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Choose the level of data security for wiping {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
				</p>
			</div>

			<div className="space-y-3">
				{wipeOptions.map(option => (
					<button
						key={option.id}
						type="button"
						onClick={() => onWipeOptionSelected(option.id)}
						className={cn(
							'w-full rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50',
							selectedOption === option.id ? 'border-primary bg-primary/5' : 'border-border bg-background',
						)}
					>
						<div className="flex items-start gap-4">
							<div
								className={cn(
									'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
									selectedOption === option.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
								)}
							>
								{option.icon}
							</div>

							<div className="flex-1">
								<div className="flex items-start justify-between">
									<div>
										<div className="flex items-center gap-2">
											<p className="font-semibold">{option.label}</p>
											{option.recommended && (
												<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
													Recommended
												</span>
											)}
										</div>
										<p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
									</div>
									{selectedOption === option.id && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />}
								</div>

								{selectedOption === option.id && (
									<ul className="mt-3 space-y-1.5 border-t border-border pt-3">
										{option.details.map((detail, index) => (
											<li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
												<span className="text-primary mt-0.5">•</span>
												<span>{detail}</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</button>
				))}
			</div>

			{selectedOption && (
				<div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
					<p className="font-medium">Data wipe will be tracked</p>
					<p className="text-xs mt-1">Wipe status and completion will be recorded in the device history</p>
				</div>
			)}

			<div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
				<p className="font-medium">Important Security Note</p>
				<p className="text-xs mt-1">
					Data wipes will be performed after devices are returned and verified. Ensure all necessary backups are
					completed before device return.
				</p>
			</div>
		</div>
	)
}
