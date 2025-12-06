"use client"

import { cn } from "@/lib/utils"
import { useMotionValue, animate, motion } from "framer-motion"
import { useState, useEffect } from "react"
import useMeasure from "react-use-measure"

interface InfiniteSliderProps {
	children: React.ReactNode
	gap?: number
	speed?: number
	speedOnHover?: number
	direction?: "horizontal" | "vertical"
	reverse?: boolean
	className?: string
}

export function InfiniteSlider({
	children,
	gap = 16,
	speed = 50,
	speedOnHover,
	direction = "horizontal",
	reverse = false,
	className,
}: InfiniteSliderProps) {
	const [ref, { width, height }] = useMeasure()
	const translation = useMotionValue(0)
	const [isHovering, setIsHovering] = useState(false)
	const [isPaused, setIsPaused] = useState(false)

	const size = direction === "horizontal" ? width : height
	const contentSize = size + gap

	useEffect(() => {
		if (isPaused || contentSize === gap) return

		const currentSpeed = isHovering && speedOnHover !== undefined ? speedOnHover : speed
		const duration = contentSize / currentSpeed
		const from = reverse ? -contentSize / 2 : 0
		const to = reverse ? 0 : -contentSize / 2

		const controls = animate(translation, [from, to], {
			ease: "linear",
			duration,
			repeat: Infinity,
			repeatType: "loop",
			repeatDelay: 0,
			onRepeat: () => {
				translation.set(from)
			},
		})

		return controls.stop
	}, [translation, contentSize, gap, speed, speedOnHover, isHovering, reverse, isPaused])

	return (
		<div
			className={cn("overflow-hidden", className)}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			<motion.div
				className="flex w-max"
				style={{
					...(direction === "horizontal"
						? { x: translation, gap: `${gap}px` }
						: { y: translation, flexDirection: "column", gap: `${gap}px` }),
				}}
				ref={ref}
			>
				{children}
				{children}
			</motion.div>
		</div>
	)
}

export default InfiniteSlider
