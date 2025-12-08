import { useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

export function AuthLoader({ children, fallback }: Props) {
	const { isLoaded } = useAuth()

	if (!isLoaded) {
		return (
			fallback ?? (
				<div className="flex items-center justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
				</div>
			)
		)
	}

	return <>{children}</>
}
