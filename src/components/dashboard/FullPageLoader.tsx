import { Spinner } from './Spinner'

interface FullPageLoaderProps {
	message?: string
	subMessage?: string
}

export function FullPageLoader({
	message = 'Loading',
	subMessage = 'Please wait while we prepare your dashboard...',
}: FullPageLoaderProps) {
	return (
		<div
			className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
			role="status"
			aria-busy="true"
			aria-label={message}
		>
			<div className="flex flex-col items-center gap-4 text-center">
				<Spinner size="lg" />
				<div className="space-y-2">
					<h2 className="text-lg font-semibold text-foreground">{message}</h2>
					<p className="text-sm text-muted-foreground">{subMessage}</p>
				</div>
			</div>
		</div>
	)
}
