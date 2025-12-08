import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
	it('renders with default size', () => {
		render(<Spinner />)
		const spinner = screen.getByRole('status')
		expect(spinner).toBeInTheDocument()
	})

	it('applies custom className', () => {
		const { container } = render(<Spinner className="custom-class" />)
		const spinner = container.querySelector('[role="status"]')
		expect(spinner).toHaveClass('custom-class')
	})

	it('renders with small size', () => {
		const { container } = render(<Spinner size="sm" />)
		const spinner = container.querySelector('[role="status"]')
		expect(spinner).toHaveClass('w-4', 'h-4')
	})

	it('renders with medium size (default)', () => {
		const { container } = render(<Spinner size="md" />)
		const spinner = container.querySelector('[role="status"]')
		expect(spinner).toHaveClass('w-8', 'h-8')
	})

	it('renders with large size', () => {
		const { container } = render(<Spinner size="lg" />)
		const spinner = container.querySelector('[role="status"]')
		expect(spinner).toHaveClass('w-12', 'h-12')
	})

	it('has aria-busy attribute', () => {
		render(<Spinner />)
		const spinner = screen.getByRole('status')
		expect(spinner).toHaveAttribute('aria-busy', 'true')
	})

	it('contains SVG with loading indicator', () => {
		const { container } = render(<Spinner />)
		const svg = container.querySelector('svg')
		expect(svg).toBeInTheDocument()
	})
})
