"use client"

import { cn } from "@/lib/utils"

interface ProgressiveBlurProps {
	className?: string
	direction?: "left" | "right" | "top" | "bottom"
	blurIntensity?: number
}

export function ProgressiveBlur({
	className,
	direction = "left",
	blurIntensity = 1,
}: ProgressiveBlurProps) {
	const gradientDirection = {
		left: "to right",
		right: "to left",
		top: "to bottom",
		bottom: "to top",
	}

	return (
		<div
			className={cn("pointer-events-none", className)}
			style={{
				background: `linear-gradient(${gradientDirection[direction]},
					var(--background) 0%,
					transparent 100%)`,
				backdropFilter: `blur(${blurIntensity * 4}px)`,
				WebkitBackdropFilter: `blur(${blurIntensity * 4}px)`,
				maskImage: `linear-gradient(${gradientDirection[direction]}, black, transparent)`,
				WebkitMaskImage: `linear-gradient(${gradientDirection[direction]}, black, transparent)`,
			}}
		/>
	)
}

export default ProgressiveBlur
