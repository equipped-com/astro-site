/**
 * Integration List Component
 *
 * Displays available integrations for the platform.
 * Manages connections to Google Workspace, MDM providers, Slack, etc.
 */

import { Blocks, CheckCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface Integration {
	id: string
	name: string
	logo: string
	category: 'sso' | 'mdm' | 'communication' | 'other'
	description: string
	purpose: string
	status: 'connected' | 'available' | 'coming_soon'
	features?: string[]
	setupUrl?: string
}

interface IntegrationListProps {
	role: 'owner' | 'admin' | 'member' | 'buyer' | 'noaccess'
}

const INTEGRATIONS: Integration[] = [
	{
		id: 'google-workspace',
		name: 'Google Workspace',
		logo: 'https://www.google.com/favicon.ico',
		category: 'sso',
		description: 'SSO and directory sync',
		purpose: 'Authenticate users and sync employee directory from Google Workspace',
		status: 'available',
		features: ['Single Sign-On', 'Directory Sync', 'Auto-provisioning'],
	},
	{
		id: 'addigy',
		name: 'Addigy',
		logo: 'https://addigy.com/favicon.ico',
		category: 'mdm',
		description: 'Mac-focused MDM',
		purpose: 'Sync device inventory and software status from Addigy',
		status: 'available',
		features: ['Device Sync', 'Software Inventory', 'Compliance Status'],
	},
	{
		id: 'jamf',
		name: 'Jamf Pro',
		logo: 'https://www.jamf.com/favicon.ico',
		category: 'mdm',
		description: 'Apple device management',
		purpose: 'Enterprise Apple device management and deployment',
		status: 'coming_soon',
		features: ['Device Management', 'Zero-Touch Deployment', 'Security Policies'],
	},
	{
		id: 'mosyle',
		name: 'Mosyle',
		logo: 'https://mosyle.com/favicon.ico',
		category: 'mdm',
		description: 'Apple Business Manager integration',
		purpose: 'Manage Apple devices with ABM integration',
		status: 'coming_soon',
		features: ['ABM Integration', 'Device Enrollment', 'App Distribution'],
	},
	{
		id: 'slack',
		name: 'Slack',
		logo: 'https://slack.com/favicon.ico',
		category: 'communication',
		description: 'Transparent support channel',
		purpose: 'Create a shared support channel for real-time assistance',
		status: 'available',
		features: ['Support Channel', 'Real-time Notifications', 'Team Collaboration'],
	},
]

const CATEGORY_LABELS: Record<Integration['category'], string> = {
	sso: 'Authentication',
	mdm: 'Device Management',
	communication: 'Communication',
	other: 'Other',
}

function IntegrationList({ role }: IntegrationListProps) {
	const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([])
	const [connecting, setConnecting] = useState<string | null>(null)

	const canEdit = role === 'owner' || role === 'admin'

	const groupedIntegrations = INTEGRATIONS.reduce(
		(acc, integration) => {
			const category = integration.category
			if (!acc[category]) acc[category] = []
			acc[category].push(integration)
			return acc
		},
		{} as Record<Integration['category'], Integration[]>,
	)

	async function handleConnect(integrationId: string) {
		if (!canEdit) return

		setConnecting(integrationId)

		// Simulate connection flow (will be replaced with real OAuth/API)
		setTimeout(() => {
			setConnectedIntegrations([...connectedIntegrations, integrationId])
			setConnecting(null)
		}, 1500)
	}

	async function handleDisconnect(integrationId: string) {
		if (!canEdit) return

		setConnectedIntegrations(connectedIntegrations.filter(id => id !== integrationId))
	}

	function getIntegrationStatus(integration: Integration) {
		if (connectedIntegrations.includes(integration.id)) {
			return 'connected'
		}
		return integration.status
	}

	function renderStatusBadge(status: string) {
		switch (status) {
			case 'connected':
				return (
					<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
						<CheckCircle size={14} className="mr-1" />
						Connected
					</span>
				)
			case 'available':
				return (
					<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
						Available
					</span>
				)
			case 'coming_soon':
				return (
					<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
						Coming Soon
					</span>
				)
			default:
				return null
		}
	}

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-bold flex items-center gap-2">
					<Blocks size={24} />
					Integrations
				</h2>
				<p className="text-muted-foreground mt-1">Connect Equipped with your existing tools and services</p>
			</div>

			{!canEdit && (
				<div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
					You do not have permission to manage integrations. Contact your account owner or admin.
				</div>
			)}

			{Object.entries(groupedIntegrations).map(([category, integrations]) => (
				<div key={category}>
					<h3 className="text-lg font-semibold mb-4">{CATEGORY_LABELS[category as Integration['category']]}</h3>
					<div className="grid gap-4">
						{integrations.map(integration => {
							const status = getIntegrationStatus(integration)
							const isConnected = status === 'connected'
							const isConnecting = connecting === integration.id
							const isComingSoon = integration.status === 'coming_soon'

							return (
								<div key={integration.id} className="border rounded-lg p-6 hover:border-primary/50 transition">
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-4">
											<img src={integration.logo} alt={integration.name} className="w-12 h-12 rounded" />
											<div className="flex-1">
												<div className="flex items-center gap-3">
													<h4 className="font-semibold text-lg">{integration.name}</h4>
													{renderStatusBadge(status)}
												</div>
												<p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
												<p className="text-sm text-muted-foreground mt-2">
													<strong>Purpose:</strong> {integration.purpose}
												</p>

												{integration.features && (
													<ul className="mt-3 space-y-1">
														{integration.features.map(feature => (
															<li key={feature} className="text-sm text-muted-foreground">
																<CheckCircle size={14} className="inline-block mr-2 text-green-600" />
																{feature}
															</li>
														))}
													</ul>
												)}

												{integration.setupUrl && isConnected && (
													<a
														href={integration.setupUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center text-sm text-primary hover:underline mt-3"
													>
														Configure
														<ExternalLink size={14} className="ml-1" />
													</a>
												)}
											</div>
										</div>

										<div>
											{isComingSoon ? (
												<button
													disabled
													className="px-4 py-2 border rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
												>
													Coming Soon
												</button>
											) : isConnected ? (
												<button
													onClick={() => handleDisconnect(integration.id)}
													disabled={!canEdit}
													className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													Disconnect
												</button>
											) : (
												<button
													onClick={() => handleConnect(integration.id)}
													disabled={!canEdit || isConnecting}
													className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{isConnecting ? 'Connecting...' : 'Connect'}
												</button>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}

export default IntegrationList
