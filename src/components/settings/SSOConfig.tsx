/**
 * SSO Configuration Component
 *
 * Displays and manages Single Sign-On integrations.
 * Shows Google Workspace, Microsoft Azure AD, and Okta options.
 */

import { AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react'
import { useState } from 'react'

interface SSOProvider {
	id: string
	name: string
	logo: string
	status: 'connected' | 'available' | 'coming_soon'
	description: string
	features?: string[]
}

interface SSOConfigProps {
	role: 'owner' | 'admin' | 'member' | 'buyer' | 'noaccess'
}

const SSO_PROVIDERS: SSOProvider[] = [
	{
		id: 'google',
		name: 'Google Workspace',
		logo: 'https://www.google.com/favicon.ico',
		status: 'available',
		description: 'Sign in with Google and sync your directory',
		features: ['Single Sign-On', 'Directory Sync', 'Automatic Provisioning'],
	},
	{
		id: 'azure',
		name: 'Microsoft Azure AD',
		logo: 'https://www.microsoft.com/favicon.ico',
		status: 'available',
		description: 'Enterprise SSO with Microsoft',
		features: ['Single Sign-On', 'SAML 2.0', 'Azure AD Integration'],
	},
	{
		id: 'okta',
		name: 'Okta',
		logo: 'https://www.okta.com/favicon.ico',
		status: 'coming_soon',
		description: 'Enterprise identity management',
		features: ['Single Sign-On', 'MFA', 'User Provisioning'],
	},
]

function SSOConfig({ role }: SSOConfigProps) {
	const [connectedProviders, setConnectedProviders] = useState<string[]>([])
	const [connecting, setConnecting] = useState<string | null>(null)

	const canEdit = role === 'owner' || role === 'admin'

	async function handleConnect(providerId: string) {
		if (!canEdit) return

		setConnecting(providerId)

		// Simulate connection flow (will be replaced with real OAuth)
		setTimeout(() => {
			setConnectedProviders([...connectedProviders, providerId])
			setConnecting(null)
		}, 1500)
	}

	async function handleDisconnect(providerId: string) {
		if (!canEdit) return

		setConnectedProviders(connectedProviders.filter(id => id !== providerId))
	}

	function getProviderStatus(provider: SSOProvider) {
		if (connectedProviders.includes(provider.id)) {
			return 'connected'
		}
		return provider.status
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
						<AlertCircle size={14} className="mr-1" />
						Available
					</span>
				)
			case 'coming_soon':
				return (
					<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
						<Clock size={14} className="mr-1" />
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
					<Shield size={24} />
					Single Sign-On (SSO)
				</h2>
				<p className="text-muted-foreground mt-1">Configure SSO to streamline authentication for your team</p>
			</div>

			{!canEdit && (
				<div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
					You do not have permission to configure SSO. Contact your account owner or admin.
				</div>
			)}

			<div className="grid gap-4">
				{SSO_PROVIDERS.map(provider => {
					const status = getProviderStatus(provider)
					const isConnected = status === 'connected'
					const isConnecting = connecting === provider.id
					const isComingSoon = provider.status === 'coming_soon'

					return (
						<div key={provider.id} className="border rounded-lg p-6 hover:border-primary/50 transition">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									<img src={provider.logo} alt={provider.name} className="w-12 h-12 rounded" />
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<h3 className="font-semibold text-lg">{provider.name}</h3>
											{renderStatusBadge(status)}
										</div>
										<p className="text-sm text-muted-foreground mt-1">{provider.description}</p>

										{provider.features && (
											<ul className="mt-3 space-y-1">
												{provider.features.map(feature => (
													<li key={feature} className="text-sm text-muted-foreground">
														<CheckCircle size={14} className="inline-block mr-2 text-green-600" />
														{feature}
													</li>
												))}
											</ul>
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
											onClick={() => handleDisconnect(provider.id)}
											disabled={!canEdit}
											className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Disconnect
										</button>
									) : (
										<button
											onClick={() => handleConnect(provider.id)}
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

			{/* SSO Enforcement */}
			<div className="border rounded-lg p-6">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="font-semibold text-lg">Enforce SSO for All Users</h3>
						<p className="text-sm text-muted-foreground mt-1">
							Require all team members to sign in using SSO (no password login)
						</p>
					</div>
					<label className="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" disabled={!canEdit || connectedProviders.length === 0} className="sr-only peer" />
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
					</label>
				</div>
				{connectedProviders.length === 0 && (
					<p className="text-xs text-muted-foreground mt-3">Connect an SSO provider to enable enforcement</p>
				)}
			</div>
		</div>
	)
}

export default SSOConfig
