/**
 * Organization Form Component Tests
 *
 * Tests organization profile editing and deletion functionality.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OrganizationForm from './OrganizationForm'

describe('OrganizationForm', () => {
	beforeEach(() => {
		// Mock fetch API
		global.fetch = vi.fn()
		vi.clearAllMocks()
	})

	it('should render loading state initially', () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({
				organization: {
					id: 'acct-123',
					name: 'Acme Corp',
					billing_email: 'billing@acme.com',
					address: '123 Main St',
					logo_url: '',
				},
			}),
		})

		render(<OrganizationForm accountId="acct-123" role="owner" />)
		expect(screen.getByTestId('spinner')).toBeInTheDocument()
	})

	it('should display organization details after loading', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({
				organization: {
					id: 'acct-123',
					name: 'Acme Corp',
					billing_email: 'billing@acme.com',
					address: '123 Main St, SF, CA',
					logo_url: '',
				},
			}),
		})

		render(<OrganizationForm accountId="acct-123" role="owner" />)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
		})

		expect(screen.getByDisplayValue('billing@acme.com')).toBeInTheDocument()
		expect(screen.getByDisplayValue('123 Main St, SF, CA')).toBeInTheDocument()
	})

	it('should allow owner to edit organization details', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organization: {
						id: 'acct-123',
						name: 'Acme Corp',
						billing_email: 'billing@acme.com',
						address: '123 Main St',
						logo_url: '',
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organization: {
						id: 'acct-123',
						name: 'Acme Corporation',
						billing_email: 'billing@acme.com',
						address: '123 Main St',
						logo_url: '',
					},
				}),
			})

		render(<OrganizationForm accountId="acct-123" role="owner" />)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
		})

		const nameInput = screen.getByLabelText(/Company Name/i)
		fireEvent.change(nameInput, { target: { value: 'Acme Corporation' } })

		const saveButton = screen.getByRole('button', { name: /Save Changes/i })
		fireEvent.click(saveButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/organization',
				expect.objectContaining({
					method: 'PUT',
					body: expect.stringContaining('Acme Corporation'),
				}),
			)
		})
	})

	it('should prevent member from editing organization details', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({
				organization: {
					id: 'acct-123',
					name: 'Acme Corp',
					billing_email: 'billing@acme.com',
					address: '123 Main St',
					logo_url: '',
				},
			}),
		})

		render(<OrganizationForm accountId="acct-123" role="member" />)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
		})

		const nameInput = screen.getByLabelText(/Company Name/i)
		expect(nameInput).toBeDisabled()

		expect(screen.queryByRole('button', { name: /Save Changes/i })).not.toBeInTheDocument()
		expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument()
	})

	it('should show danger zone for owner', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({
				organization: {
					id: 'acct-123',
					name: 'Acme Corp',
					billing_email: 'billing@acme.com',
					address: '123 Main St',
					logo_url: '',
				},
			}),
		})

		render(<OrganizationForm accountId="acct-123" role="owner" />)

		await waitFor(() => {
			expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument()
		})

		expect(screen.getByRole('button', { name: /Delete Organization/i })).toBeInTheDocument()
	})

	it('should require confirmation before deleting organization', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organization: {
						id: 'acct-123',
						name: 'Acme Corp',
						billing_email: 'billing@acme.com',
						address: '123 Main St',
						logo_url: '',
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

		render(<OrganizationForm accountId="acct-123" role="owner" />)

		await waitFor(() => {
			expect(screen.getByText(/Danger Zone/i)).toBeInTheDocument()
		})

		// Click delete button
		const deleteButton = screen.getByRole('button', { name: /Delete Organization/i })
		fireEvent.click(deleteButton)

		// Confirmation input should appear
		await waitFor(() => {
			expect(screen.getByPlaceholderText(/Organization name/i)).toBeInTheDocument()
		})

		// Confirm button should be disabled initially
		const confirmButton = screen.getByRole('button', { name: /Confirm Deletion/i })
		expect(confirmButton).toBeDisabled()

		// Enter correct name
		const confirmInput = screen.getByPlaceholderText(/Organization name/i)
		fireEvent.change(confirmInput, { target: { value: 'Acme Corp' } })

		// Confirm button should be enabled
		expect(confirmButton).not.toBeDisabled()

		// Click confirm
		fireEvent.click(confirmButton)

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/organization',
				expect.objectContaining({
					method: 'DELETE',
					body: expect.stringContaining('Acme Corp'),
				}),
			)
		})
	})
})

/**
 * REGRESSION TEST
 * REQ-SET-001: Update organization profile
 */
describe('Organization Profile [REGRESSION]', () => {
	it('should allow updating company name, logo, billing email, and address', async () => {
		;(global.fetch as ReturnType<typeof vi.fn>)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organization: {
						id: 'acct-123',
						name: 'Acme Corp',
						billing_email: 'old@acme.com',
						address: 'Old Address',
						logo_url: '',
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organization: {
						id: 'acct-123',
						name: 'New Acme Corp',
						billing_email: 'new@acme.com',
						address: 'New Address',
						logo_url: 'https://example.com/logo.png',
					},
				}),
			})

		render(<OrganizationForm accountId="acct-123" role="owner" />)

		await waitFor(() => {
			expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
		})

		// Update all fields
		fireEvent.change(screen.getByLabelText(/Company Name/i), { target: { value: 'New Acme Corp' } })
		fireEvent.change(screen.getByLabelText(/Billing Email/i), { target: { value: 'new@acme.com' } })
		fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: 'New Address' } })
		fireEvent.change(screen.getByLabelText(/Logo URL/i), {
			target: { value: 'https://example.com/logo.png' },
		})

		// Submit form
		fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'/api/organization',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({
						name: 'New Acme Corp',
						billing_email: 'new@acme.com',
						address: 'New Address',
						logo_url: 'https://example.com/logo.png',
					}),
				}),
			)
		})
	})
})
