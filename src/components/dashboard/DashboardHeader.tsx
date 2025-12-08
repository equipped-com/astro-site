'use client'

import { ClerkProvider, UserButton } from '@clerk/clerk-react'
import { Menu } from 'lucide-react'
import { useState } from 'react'

interface DashboardHeaderProps {
	title?: string
}

export default function DashboardHeader({ title = 'Dashboard' }: DashboardHeaderProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

	if (!publishableKey) {
		return (
			<header className="border-b border-border bg-background px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden"
							aria-label="Toggle menu"
						>
							<Menu className="h-6 w-6" />
						</button>
						<h1 className="text-2xl font-bold">{title}</h1>
					</div>
					<div className="flex items-center gap-4">
						<a href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
							Sign in
						</a>
					</div>
				</div>
			</header>
		)
	}

	return (
		<ClerkProvider
			publishableKey={publishableKey}
			afterSignInUrl="/dashboard"
			afterSignUpUrl="/dashboard"
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
		>
			<header className="border-b border-border bg-background px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden"
							aria-label="Toggle menu"
						>
							<Menu className="h-6 w-6" />
						</button>
						<h1 className="text-2xl font-bold">{title}</h1>
					</div>
					<div className="flex items-center gap-4">
						<UserButton />
					</div>
				</div>
			</header>
		</ClerkProvider>
	)
}
