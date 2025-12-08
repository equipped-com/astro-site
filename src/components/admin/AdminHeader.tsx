/**
 * Admin Dashboard Header
 *
 * Header for the sys admin dashboard with global navigation and user menu.
 */
import { UserButton, useUser } from '@clerk/clerk-react'
import { Home, Search } from 'lucide-react'

export default function AdminHeader() {
	const { user } = useUser()

	return (
		<header className="border-b border-border bg-card">
			<div className="flex h-16 items-center justify-between px-6">
				<div className="flex items-center gap-4">
					<a href="/admin" className="flex items-center gap-2 font-semibold text-lg">
						<Home className="h-5 w-5" />
						<span>Admin Dashboard</span>
					</a>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						<span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
							SYS_ADMIN
						</span>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{/* Global Search */}
					<button
						type="button"
						className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
					>
						<Search className="h-4 w-4" />
						<span>Search all customers...</span>
					</button>

					{/* User menu */}
					<div className="flex items-center gap-3">
						<div className="text-right">
							<div className="text-sm font-medium">
								{user?.firstName} {user?.lastName}
							</div>
							<div className="text-xs text-muted-foreground">
								{user?.primaryEmailAddress?.emailAddress}
							</div>
						</div>
						<UserButton afterSignOutUrl="/" />
					</div>
				</div>
			</div>
		</header>
	)
}
