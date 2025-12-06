"use client"

import { motion } from "framer-motion"

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		width: 0.5 + i * 0.03,
	}))

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg className="h-full w-full" viewBox="0 0 696 316" fill="none">
				<title>Background Paths</title>
				{paths.map(path => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.08 + path.id * 0.02}
						initial={{ pathLength: 0.3, opacity: 0.4 }}
						animate={{
							pathLength: 1,
							opacity: [0.2, 0.5, 0.2],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				))}
			</svg>
		</div>
	)
}

interface BackgroundPathsProps {
	title?: string
	subtitle?: string
	badge?: string
	primaryCta?: {
		text: string
		href: string
	}
	secondaryCta?: {
		text: string
		href: string
	}
	trustIndicators?: string[]
}

export function BackgroundPaths({
	title = "Run your business. We handle the tech.",
	subtitle = "The easiest way to get your team the tech they need - wherever they are. Track assets, manage IT spend, and keep everyone productive.",
	badge = "Trusted by 100+ growing companies",
	primaryCta = { text: "Start for free", href: "https://tryequipped.com/users/sign_up" },
	secondaryCta = { text: "See how it works", href: "#how-it-works" },
	trustIndicators = ["No credit card required", "Setup in minutes", "Free device shipping"],
}: BackgroundPathsProps) {
	const titleParts = title.split(".")

	return (
		<div className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-background">
			{/* Animated background paths */}
			<div className="absolute inset-0 text-primary/30">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			{/* Subtle gradient overlay */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />

			{/* Content */}
			<div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.5 }}
					className="mx-auto max-w-4xl"
				>
					{/* Badge */}
					{badge && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.6 }}
							className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm"
						>
							<span className="flex h-2 w-2 rounded-full bg-accent" />
							<span className="text-muted-foreground">{badge}</span>
						</motion.div>
					)}

					{/* Animated Title */}
					<h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
						{titleParts.map((part, partIndex) => (
							<span
								key={partIndex}
								className={`block ${partIndex === 1 ? "text-primary" : ""}`}
							>
								{part.trim().split("").map((letter, letterIndex) => (
									<motion.span
										key={`${partIndex}-${letterIndex}`}
										initial={{ y: 50, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{
											delay: 0.3 + partIndex * 0.15 + letterIndex * 0.02,
											type: "spring",
											stiffness: 120,
											damping: 20,
										}}
										className="inline-block"
									>
										{letter === " " ? "\u00A0" : letter}
									</motion.span>
								))}
								{partIndex < titleParts.length - 1 && "."}
							</span>
						))}
					</h1>

					{/* Subtitle */}
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8, duration: 0.6 }}
						className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
					>
						{subtitle}
					</motion.p>

					{/* CTAs */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 1, duration: 0.6 }}
						className="flex flex-col items-center justify-center gap-4 sm:flex-row"
					>
						<a
							href={primaryCta.href}
							className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:w-auto"
						>
							{primaryCta.text}
							<span className="transition-transform group-hover:translate-x-1">→</span>
						</a>
						<a
							href={secondaryCta.href}
							className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-base font-medium transition-colors hover:bg-muted sm:w-auto"
						>
							{secondaryCta.text}
						</a>
					</motion.div>

					{/* Trust indicators */}
					{trustIndicators.length > 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1.2, duration: 0.6 }}
							className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
						>
							{trustIndicators.map((indicator, index) => (
								<div key={index} className="flex items-center gap-2">
									<svg
										className="h-4 w-4 text-primary"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									<span>{indicator}</span>
								</div>
							))}
						</motion.div>
					)}
				</motion.div>
			</div>
		</div>
	)
}

export default BackgroundPaths
