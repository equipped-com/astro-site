"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ChevronRight } from "lucide-react"
import { InfiniteSlider } from "@/components/ui/infinite-slider"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"

interface Logo {
	name: string
	src: string
}

interface HeroSectionProps {
	heroImage: string
	logos: Logo[]
}

export function HeroSection({ heroImage, logos }: HeroSectionProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end start"],
	})

	const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
	const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

	return (
		<>
			{/* Hero Section */}
			<section ref={containerRef} className="relative min-h-[50vh] overflow-hidden">
				{/* Ken Burns Background Image */}
				<div className="absolute inset-0 overflow-hidden">
					<motion.div
						className="absolute inset-0"
						style={{ opacity, scale }}
					>
						<motion.img
							src={heroImage}
							alt="Hero background"
							className="h-full w-full object-cover"
							initial={{ scale: 1, x: 0, y: 0 }}
							animate={{
								scale: [1, 1.15, 1.1, 1.2, 1],
								x: ["0%", "3%", "-2%", "2%", "0%"],
								y: ["0%", "-2%", "2%", "-1%", "0%"],
							}}
							transition={{
								duration: 30,
								repeat: Infinity,
								ease: "linear",
							}}
						/>
					</motion.div>
					{/* Overlay gradient */}
					<div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
					<div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/50" />
				</div>

				{/* Content */}
				<div className="relative z-10 flex min-h-[50vh] flex-col justify-center py-16 md:py-20 lg:py-24">
					<div className="mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
						<div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
							{/* Badge */}
							<div className="mb-6 inline-flex animate-slide-up items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm opacity-0 backdrop-blur-sm [animation-delay:200ms] [animation-fill-mode:forwards]">
								<span className="flex h-2 w-2 rounded-full bg-green-500" />
								<span className="text-muted-foreground">Now shipping to 50+ countries</span>
							</div>

							{/* Title */}
							<h1 className="mt-4 max-w-2xl animate-slide-up text-balance text-4xl font-extrabold tracking-tight opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards] sm:text-5xl md:text-6xl lg:mt-8 xl:text-7xl">
								<span className="block">All things tech,</span>
								<span className="block">one monthly fee.</span>
								<span className="block text-primary">It's that simple.</span>
							</h1>

							{/* Subtitle */}
							<p className="mt-6 max-w-xl animate-slide-up text-balance text-lg text-muted-foreground opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards] md:text-xl">
								Equipped is the easiest way to get your team the tech they need wherever they are, keep track of your assets and IT spend, and keep your team fully equipped and productive.
							</p>

							{/* CTAs */}
							<div className="mt-10 flex animate-slide-up flex-col items-center justify-center gap-3 opacity-0 [animation-delay:700ms] [animation-fill-mode:forwards] sm:flex-row lg:justify-start">
								<a
									href="https://tryequipped.com/users/sign_up"
									className="group inline-flex h-12 items-center justify-center gap-1 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
								>
									<span className="text-nowrap">Sign up for free</span>
									<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
								</a>
								<a
									href="#how-it-works"
									className="inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors hover:bg-muted"
								>
									<span className="text-nowrap">I'm a Consultant</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Logo Section */}
			<section className="relative z-20 bg-background pb-8">
				<div className="mx-auto max-w-7xl px-6">
					<div className="flex flex-col items-center md:flex-row">
						<div className="mb-4 md:mb-0 md:max-w-44 md:border-r md:border-border md:pr-6">
							<p className="text-center text-sm text-muted-foreground md:text-end">
								Powering the best teams
							</p>
						</div>
						<div className="relative w-full py-6 md:w-[calc(100%-11rem)] md:pl-6">
							<InfiniteSlider speed={40} speedOnHover={20} gap={80}>
								{logos.map((logo) => (
									<div key={logo.name} className="flex items-center justify-center">
										<img
											className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 md:h-8"
											src={logo.src}
											alt={logo.name}
										/>
									</div>
								))}
							</InfiniteSlider>
							<ProgressiveBlur
								className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20"
								direction="left"
								blurIntensity={1}
							/>
							<ProgressiveBlur
								className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20"
								direction="right"
								blurIntensity={1}
							/>
						</div>
					</div>
				</div>
			</section>
		</>
	)
}

export default HeroSection
