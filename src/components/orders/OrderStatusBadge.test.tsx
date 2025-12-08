import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Order } from '@/lib/scoped-queries'
import { OrderStatusBadge } from './OrderStatusBadge'

describe('OrderStatusBadge Component', () => {
	/**
	 * @REQ-ORD-004
	 * Feature: Order List
	 * Scenario: Order status display
	 */
	describe('@REQ-ORD-004: Order status badges with appropriate colors', () => {
		it('should render Pending status with yellow badge', () => {
			render(<OrderStatusBadge status="pending" />)

			const badge = screen.getByText('Pending')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-yellow-100')
			expect(badge.className).toContain('text-yellow-800')
			expect(badge.className).toContain('border-yellow-200')
		})

		it('should render Pending leasing approval status with orange badge', () => {
			render(<OrderStatusBadge status="pending_leasing_approval" />)

			const badge = screen.getByText('Pending leasing approval')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-orange-100')
			expect(badge.className).toContain('text-orange-800')
			expect(badge.className).toContain('border-orange-200')
		})

		it('should render Processing status with blue badge', () => {
			render(<OrderStatusBadge status="processing" />)

			const badge = screen.getByText('Processing')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-blue-100')
			expect(badge.className).toContain('text-blue-800')
			expect(badge.className).toContain('border-blue-200')
		})

		it('should render Shipped status with purple badge', () => {
			render(<OrderStatusBadge status="shipped" />)

			const badge = screen.getByText('Shipped')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-purple-100')
			expect(badge.className).toContain('text-purple-800')
			expect(badge.className).toContain('border-purple-200')
		})

		it('should render Delivered status with green badge', () => {
			render(<OrderStatusBadge status="delivered" />)

			const badge = screen.getByText('Delivered')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-green-100')
			expect(badge.className).toContain('text-green-800')
			expect(badge.className).toContain('border-green-200')
		})

		it('should render Cancelled status with red badge', () => {
			render(<OrderStatusBadge status="cancelled" />)

			const badge = screen.getByText('Cancelled')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-red-100')
			expect(badge.className).toContain('text-red-800')
			expect(badge.className).toContain('border-red-200')
		})

		it('should render Returned status with gray badge', () => {
			render(<OrderStatusBadge status="returned" />)

			const badge = screen.getByText('Returned')
			expect(badge).toBeInTheDocument()
			expect(badge.className).toContain('bg-gray-100')
			expect(badge.className).toContain('text-gray-800')
			expect(badge.className).toContain('border-gray-200')
		})
	})

	describe('Badge styling and structure', () => {
		it('should have correct base classes for all badges', () => {
			const statuses: Order['status'][] = [
				'pending',
				'pending_leasing_approval',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
				'returned',
			]

			for (const status of statuses) {
				const { container } = render(<OrderStatusBadge status={status} />)
				const badge = container.querySelector('span')

				expect(badge?.className).toContain('inline-flex')
				expect(badge?.className).toContain('items-center')
				expect(badge?.className).toContain('px-2.5')
				expect(badge?.className).toContain('py-0.5')
				expect(badge?.className).toContain('rounded-full')
				expect(badge?.className).toContain('text-xs')
				expect(badge?.className).toContain('font-medium')
				expect(badge?.className).toContain('border')
			}
		})

		it('should accept custom className prop', () => {
			render(<OrderStatusBadge status="pending" className="custom-class" />)

			const badge = screen.getByText('Pending')
			expect(badge.className).toContain('custom-class')
		})

		it('should display correct label text for each status', () => {
			const statusLabels: Record<Order['status'], string> = {
				pending: 'Pending',
				pending_leasing_approval: 'Pending leasing approval',
				processing: 'Processing',
				shipped: 'Shipped',
				delivered: 'Delivered',
				cancelled: 'Cancelled',
				returned: 'Returned',
			}

			for (const [status, label] of Object.entries(statusLabels)) {
				render(<OrderStatusBadge status={status as Order['status']} />)
				expect(screen.getByText(label)).toBeInTheDocument()
			}
		})
	})
})
