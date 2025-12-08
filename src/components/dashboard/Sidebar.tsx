'use client'

import { useEffect, useState } from 'react'
import {
	Laptop,
	ShoppingCart,
	Store,
	Users,
	Settings,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
	label: string
	icon: React.ReactNode
	path: string
}

const navItems: NavItem[] = [
	{
		label: 'Devices',
		icon: <Laptop className="h-5 w-5" />,
		path: '/dashboard/devices',
	},
	{
		label: 'Orders',
		icon: <ShoppingCart className="h-5 w-5" />,
		path: '/dashboard/orders',
	},
	{
		label: 'Store',
		icon: <Store className="h-5 w-5" />,
		path: '/dashboard/store',
	},
	{
		label: 'People',
		icon: <Users className="h-5 w-5" />,
		path: '/dashboard/people',
	},
	{
		label: 'Settings',
		icon: <Settings className="h-5 w-5" />,
		path: '/dashboard/settings',
	},
]

export default function Sidebar() {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isHovering, setIsHovering] = useState(false)
	const [currentPath, setCurrentPath] = useState('')

	useEffect(() => {
		setCurrentPath(window.location.pathname)
	}, [])

	const shouldBeExpanded = isExpanded || isHovering

	function isActive(path: string): boolean {
		return currentPath.startsWith(path)
	}

	function handleKeyDown(event: React.KeyboardEvent, path: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			window.location.href = path
		}
	}

	return (
		<>
			{/* Desktop Sidebar */}
			<aside
				className="hidden flex-col border-r border-border bg-background transition-all duration-300 md:flex"
				style={{
					width: shouldBeExpanded ? '16rem' : '4.5rem',
				}}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<nav className="flex flex-1 flex-col gap-2 p-4">
					{navItems.map((item) => (
						<a
							key={item.path}
							href={item.path}
							className={cn(
								'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
								'hover:bg-muted',
								isActive(item.path)
									? 'bg-muted text-primary font-semibold'
									: 'text-muted-foreground'
							)}
							tabIndex={0}
							onKeyDown={(e) => handleKeyDown(e, item.path)}
						>
							<div className="flex-shrink-0">{item.icon}</div>
							{shouldBeExpanded && (
								<span className="whitespace-nowrap text-sm">{item.label}</span>
							)}
						</a>
					))}
				</nav>

				{/* Collapse Toggle */}
				<div className="border-t border-border p-4">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex w-full items-center justify-center rounded-md p-2 hover:bg-muted"
						aria-label={shouldBeExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
					>
						{shouldBeExpanded ? (
							<ChevronLeft className="h-5 w-5" />
						) : (
							<ChevronRight className="h-5 w-5" />
						)}
					</button>
				</div>
			</aside>

			{/* Mobile Navigation - Placeholder for hamburger menu */}
			<div className="md:hidden" />
		</>
	)
}
