import type { Order } from '@/lib/scoped-queries'

interface OrderStatusBadgeProps {
	status: Order['status']
	className?: string
}

const statusConfig = {
	pending: {
		label: 'Pending',
		className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
	},
	pending_leasing_approval: {
		label: 'Pending leasing approval',
		className: 'bg-orange-100 text-orange-800 border-orange-200',
	},
	processing: {
		label: 'Processing',
		className: 'bg-blue-100 text-blue-800 border-blue-200',
	},
	shipped: {
		label: 'Shipped',
		className: 'bg-purple-100 text-purple-800 border-purple-200',
	},
	delivered: {
		label: 'Delivered',
		className: 'bg-green-100 text-green-800 border-green-200',
	},
	cancelled: {
		label: 'Cancelled',
		className: 'bg-red-100 text-red-800 border-red-200',
	},
	returned: {
		label: 'Returned',
		className: 'bg-gray-100 text-gray-800 border-gray-200',
	},
} as const

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
	const config = statusConfig[status]

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
		>
			{config.label}
		</span>
	)
}
