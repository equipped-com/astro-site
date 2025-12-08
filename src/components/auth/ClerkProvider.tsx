import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

interface Props {
	children: ReactNode
}

export function ClerkProvider({ children }: Props) {
	const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY

	if (!publishableKey) {
		throw new Error('Missing PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. ' + 'Please add it to your .env file.')
	}

	return (
		<BaseClerkProvider
			publishableKey={publishableKey}
			afterSignInUrl="/dashboard"
			afterSignUpUrl="/dashboard"
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
		>
			{children}
		</BaseClerkProvider>
	)
}
