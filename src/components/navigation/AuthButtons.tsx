import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export function AuthButtons() {
	const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

	if (!publishableKey) {
		// Fallback for SSR/build time - show sign in/sign up buttons
		return (
			<>
				<a
					href="/sign-in"
					className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
				>
					Sign in
				</a>
				<a
					href="/sign-up"
					className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Get Started
				</a>
			</>
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
			<SignedOut>
				<a
					href="/sign-in"
					className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
				>
					Sign in
				</a>
				<a
					href="/sign-up"
					className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Get Started
				</a>
			</SignedOut>

			<SignedIn>
				<a
					href="/dashboard"
					className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
				>
					Dashboard
				</a>
				<UserButton
					afterSignOutUrl="/"
					appearance={{
						elements: {
							avatarBox: 'h-8 w-8',
						},
					}}
				/>
			</SignedIn>
		</ClerkProvider>
	)
}
