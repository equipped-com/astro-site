import { SignIn } from '@clerk/clerk-react'
import { ClerkProvider } from './ClerkProvider'

export default function SignInComponent() {
	return (
		<ClerkProvider>
			<SignIn
				routing="path"
				path="/sign-in"
				afterSignInUrl="/dashboard"
				appearance={{
					elements: {
						formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
						card: 'bg-card border border-border shadow-lg rounded-lg',
						headerTitle: 'text-foreground font-bold',
						headerSubtitle: 'text-muted-foreground',
						socialButtonsBlockButton: 'border-border hover:bg-accent',
						formFieldInput: 'border-border focus:border-primary bg-background text-foreground',
						footerActionLink: 'text-primary hover:text-primary/90',
					},
					layout: {
						socialButtonsPlacement: 'bottom',
						socialButtonsVariant: 'blockButton',
					},
				}}
			/>
		</ClerkProvider>
	)
}
