/**
 * ProposalItems Tests
 *
 * Tests for proposal items display component.
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ProposalItem } from '@/types/proposal'
import { ProposalItems } from './ProposalItems'

const mockItems: ProposalItem[] = [
	{
		id: 'pitem_1',
		proposal_id: 'prop_1234',
		product_name: 'MacBook Pro 14"',
		product_sku: 'MBP14-M3-16GB',
		quantity: 2,
		unit_price: 1999.0,
		monthly_price: 83.29,
		specs: {
			Processor: 'M3 Pro',
			Memory: '16GB',
			Storage: '512GB SSD',
		},
	},
	{
		id: 'pitem_2',
		proposal_id: 'prop_1234',
		product_name: 'Magic Mouse',
		product_sku: 'MM-WHITE',
		quantity: 3,
		unit_price: 79.0,
		specs: {
			Color: 'White',
		},
	},
]

describe('ProposalItems', () => {
	it('should display all items with names and SKUs', () => {
		render(<ProposalItems items={mockItems} />)

		expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument()
		expect(screen.getByText('SKU: MBP14-M3-16GB')).toBeInTheDocument()
		expect(screen.getByText('Magic Mouse')).toBeInTheDocument()
		expect(screen.getByText('SKU: MM-WHITE')).toBeInTheDocument()
	})

	it('should display quantities correctly', () => {
		render(<ProposalItems items={mockItems} />)

		expect(screen.getByText('Qty: 2')).toBeInTheDocument()
		expect(screen.getByText('Qty: 3')).toBeInTheDocument()
	})

	it('should display item totals (unit price × quantity)', () => {
		render(<ProposalItems items={mockItems} />)

		// MacBook: 1999 × 2 = 3998
		expect(screen.getByText('$3998.00')).toBeInTheDocument()

		// Mouse: 79 × 3 = 237
		expect(screen.getByText('$237.00')).toBeInTheDocument()
	})

	it('should display specifications for items', () => {
		render(<ProposalItems items={mockItems} />)

		// MacBook specs
		expect(screen.getByText('Processor:')).toBeInTheDocument()
		expect(screen.getByText('M3 Pro')).toBeInTheDocument()
		expect(screen.getByText('Memory:')).toBeInTheDocument()
		expect(screen.getByText('16GB')).toBeInTheDocument()
		expect(screen.getByText('Storage:')).toBeInTheDocument()
		expect(screen.getByText('512GB SSD')).toBeInTheDocument()

		// Mouse specs
		expect(screen.getByText('Color:')).toBeInTheDocument()
		expect(screen.getByText('White')).toBeInTheDocument()
	})

	it('should display monthly price when available', () => {
		render(<ProposalItems items={mockItems} />)

		expect(screen.getByText('$83.29/month')).toBeInTheDocument()
	})

	it('should calculate and display subtotal', () => {
		render(<ProposalItems items={mockItems} />)

		// Subtotal: (1999 × 2) + (79 × 3) = 3998 + 237 = 4235
		expect(screen.getByText('$4235.00')).toBeInTheDocument()
	})

	it('should use provided subtotal if given', () => {
		render(<ProposalItems items={mockItems} subtotal={5000.0} />)

		expect(screen.getByText('$5000.00')).toBeInTheDocument()
	})

	it('should handle items without specs', () => {
		const itemsWithoutSpecs: ProposalItem[] = [
			{
				id: 'pitem_1',
				proposal_id: 'prop_1234',
				product_name: 'Basic Item',
				quantity: 1,
				unit_price: 100.0,
			},
		]

		render(<ProposalItems items={itemsWithoutSpecs} />)

		expect(screen.getByText('Basic Item')).toBeInTheDocument()
		expect(screen.queryByText('Specifications')).not.toBeInTheDocument()
	})

	it('should handle items without monthly price', () => {
		const itemsWithoutMonthly: ProposalItem[] = [
			{
				id: 'pitem_1',
				proposal_id: 'prop_1234',
				product_name: 'One-time Purchase',
				quantity: 1,
				unit_price: 500.0,
			},
		]

		render(<ProposalItems items={itemsWithoutMonthly} />)

		expect(screen.getByText('One-time Purchase')).toBeInTheDocument()
		expect(screen.queryByText(/\/month/)).not.toBeInTheDocument()
	})

	it('should handle items without SKU', () => {
		const itemsWithoutSku: ProposalItem[] = [
			{
				id: 'pitem_1',
				proposal_id: 'prop_1234',
				product_name: 'Custom Item',
				quantity: 1,
				unit_price: 200.0,
			},
		]

		render(<ProposalItems items={itemsWithoutSku} />)

		expect(screen.getByText('Custom Item')).toBeInTheDocument()
		expect(screen.queryByText(/SKU:/)).not.toBeInTheDocument()
	})

	it('should display empty specs gracefully', () => {
		const itemsWithEmptySpecs: ProposalItem[] = [
			{
				id: 'pitem_1',
				proposal_id: 'prop_1234',
				product_name: 'Item',
				quantity: 1,
				unit_price: 100.0,
				specs: {},
			},
		]

		render(<ProposalItems items={itemsWithEmptySpecs} />)

		expect(screen.getByText('Item')).toBeInTheDocument()
		expect(screen.queryByText('Specifications')).not.toBeInTheDocument()
	})
})
