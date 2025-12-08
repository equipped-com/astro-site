import { useUser } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'

export function WelcomeCard() {
	const { user, isLoaded } = useUser()

	if (!isLoaded) {
		return (
			<div className="rounded-lg border border-border bg-card p-8">
				<div className="flex items-center gap-2">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<span className="text-muted-foreground">Loading...</span>
				</div>
			</div>
		)
	}

	const userName = user?.firstName || user?.fullName || 'there'
	const currentHour = new Date().getHours()
	const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

	return (
		<div className="rounded-lg border border-border bg-card p-8">
			<h1 className="text-3xl font-bold text-foreground">
				{greeting}, {userName}
			</h1>
			<p className="mt-2 text-muted-foreground">Welcome to your dashboard. Here's an overview of your account.</p>
		</div>
	)
}
