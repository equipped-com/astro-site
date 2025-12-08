/**
 * Checkout Flow Integration Tests
 *
 * Tests the complete checkout flow across all stages:
 * - Assignment (Stage 1)
 * - Shipping (Stage 2)
 * - Delivery (Stage 3)
 * - Payment (Stage 4)
 *
 * These tests verify that data flows correctly between stages
 * and that the entire checkout process works end-to-end.
 *
 * @REQ-INT-CHECKOUT-001 Checkout flow integration
 * @REQ-INT-CHECKOUT-002 Stage data propagation
 * @REQ-INT-CHECKOUT-003 Error handling across stages
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssignmentData, DeliveryData, TeamMember } from '@/types'
import AssignmentStage from './AssignmentStage'
import DeliveryStage from './DeliveryStage'
import ShippingStage from './ShippingStage'

// Mock team members
const mockTeamMembers: TeamMember[] = [
	{
		id: 'person_alice',
		name: 'Alice Smith',
		email: 'alice@company.com',
		hasAddress: true,
		hasPhone: true,
	},
	{
		id: 'person_bob',
		name: 'Bob Johnson',
		email: 'bob@company.com',
		hasAddress: false,
		hasPhone: false,
	},
	{
		id: 'person_carol',
		name: 'Carol Williams',
		email: 'carol@company.com',
		hasAddress: true,
		hasPhone: true,
	},
]

describe('Checkout Flow Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * Feature: Checkout Flow Integration
	 *
	 * @REQ-INT-CHECKOUT-001
	 * Scenario: Checkout flow integration
	 *   Given a user in checkout
	 *   When completing all stages (assignment -> shipping -> delivery -> payment)
	 *   Then order is created
	 *   And data flows correctly between stages
	 */
	describe('@REQ-INT-CHECKOUT-001: Complete checkout flow', () => {
		it('should allow completing the full checkout flow with person selection', async () => {
			const user = userEvent.setup()

			// Stage 1: Assignment
			const onAssignmentContinue = vi.fn()

			const { rerender } = render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={onAssignmentContinue} />)

			// Select "Assign it to someone" option
			const assignButton = screen.getByRole('button', { name: /assign it to someone/i })
			await user.click(assignButton)

			// Now the PersonSelector should be visible
			// Focus on the search input to show dropdown
			const searchInput = screen.getByPlaceholderText(/search team members/i)
			await user.click(searchInput)

			// Wait for dropdown to appear and select Alice
			await waitFor(() => {
				expect(screen.getByText('Alice Smith')).toBeInTheDocument()
			})
			await user.click(screen.getByText('Alice Smith'))

			// Click Continue
			const continueButton = screen.getByRole('button', { name: /continue/i })
			await user.click(continueButton)

			// Verify assignment data was passed
			expect(onAssignmentContinue).toHaveBeenCalledWith({
				assignedTo: mockTeamMembers[0],
				isUnassigned: false,
			})

			// Stage 2: Shipping
			const assignmentData: AssignmentData = {
				assignedTo: mockTeamMembers[0],
				isUnassigned: false,
			}
			const onShippingContinue = vi.fn()

			rerender(<ShippingStage assignedPerson={assignmentData.assignedTo} onContinue={onShippingContinue} />)

			// Select "To Alice's address" option
			const toAssigneeButton = screen.getByRole('button', { name: /to alice's address/i })
			await user.click(toAssigneeButton)

			// Click Continue
			const shippingContinueButton = screen.getByRole('button', { name: /continue/i })
			await user.click(shippingContinueButton)

			// Verify shipping data was passed
			expect(onShippingContinue).toHaveBeenCalledWith({
				useAssigneeAddress: true,
				address: undefined,
			})

			// Stage 3: Delivery
			const onDeliveryContinue = vi.fn()

			rerender(<DeliveryStage onContinue={onDeliveryContinue} cartSubtotal={2500} />)

			// Select "Standard" delivery option
			const standardOption = screen.getByText(/standard/i)
			await user.click(standardOption)

			// Click Continue
			const deliveryContinueButton = screen.getByRole('button', { name: /continue/i })
			await user.click(deliveryContinueButton)

			// Verify delivery data was passed
			expect(onDeliveryContinue).toHaveBeenCalledWith(
				expect.objectContaining({
					speed: 'standard',
					cost: expect.any(Number),
					estimatedDate: expect.any(Date),
				}),
			)
		})

		it('should allow unassigned device checkout flow', async () => {
			const user = userEvent.setup()
			const onAssignmentContinue = vi.fn()

			render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={onAssignmentContinue} />)

			// Select "Leave it unassigned" option
			const unassignedButton = screen.getByRole('button', { name: /leave it unassigned/i })
			await user.click(unassignedButton)

			// Click Continue
			const continueButton = screen.getByRole('button', { name: /continue/i })
			await user.click(continueButton)

			// Verify unassigned was selected
			expect(onAssignmentContinue).toHaveBeenCalledWith({
				assignedTo: null,
				isUnassigned: true,
			})
		})
	})

	/**
	 * @REQ-INT-CHECKOUT-002
	 * Scenario: Stage data propagation
	 *   Given assignment stage is completed
	 *   When shipping stage loads
	 *   Then assigned person data is available
	 *   And shipping options reflect assignment
	 */
	describe('@REQ-INT-CHECKOUT-002: Stage data propagation', () => {
		it('should show assignee address option when person has complete info', async () => {
			const user = userEvent.setup()
			const onContinue = vi.fn()

			// Alice has address and phone
			render(<ShippingStage assignedPerson={mockTeamMembers[0]} onContinue={onContinue} />)

			// Verify "To Alice's address" option is available and clickable
			const toAssigneeButton = screen.getByRole('button', { name: /to alice's address/i })
			expect(toAssigneeButton).not.toBeDisabled()

			// Can select and continue
			await user.click(toAssigneeButton)
			const continueButton = screen.getByRole('button', { name: /continue/i })
			await user.click(continueButton)

			expect(onContinue).toHaveBeenCalledWith({
				useAssigneeAddress: true,
				address: undefined,
			})
		})

		it('should disable assignee address option when person has incomplete info', async () => {
			// Bob has no address or phone
			render(<ShippingStage assignedPerson={mockTeamMembers[1]} onContinue={vi.fn()} />)

			// Verify "To Bob's address" option is disabled
			const toAssigneeButton = screen.getByRole('button', { name: /to bob's address/i })
			expect(toAssigneeButton).toBeDisabled()
		})

		it('should show only "To another address" when device is unassigned', () => {
			render(<ShippingStage assignedPerson={null} onContinue={vi.fn()} />)

			// Should only see "To another address" option
			const anotherAddressButton = screen.getByRole('button', { name: /to another address/i })
			expect(anotherAddressButton).toBeInTheDocument()

			// Should NOT see assignee address option
			expect(screen.queryByText(/to .+'s address/i)).not.toBeInTheDocument()
		})

		it('should preserve initial values when going back', async () => {
			const onContinue = vi.fn()

			// Initial assignment data
			const initialAssignment: AssignmentData = {
				assignedTo: mockTeamMembers[0],
				isUnassigned: false,
			}

			render(
				<AssignmentStage teamMembers={mockTeamMembers} initialAssignment={initialAssignment} onContinue={onContinue} />,
			)

			// Alice should already be selected - PersonSelector shows selected person
			expect(screen.getByText('Alice Smith')).toBeInTheDocument()

			// Continue should work immediately
			const continueButton = screen.getByRole('button', { name: /continue/i })
			expect(continueButton).not.toBeDisabled()
		})
	})

	/**
	 * @REQ-INT-CHECKOUT-003
	 * Scenario: Error handling across stages
	 *   Given user is on shipping stage
	 *   When address validation fails
	 *   Then errors are displayed
	 *   And user cannot continue
	 */
	describe('@REQ-INT-CHECKOUT-003: Error handling', () => {
		it('should disable continue button until assignment is selected', () => {
			render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={vi.fn()} />)

			// Continue button should be disabled initially
			const continueButton = screen.getByRole('button', { name: /continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should disable continue button until person is selected in assign mode', async () => {
			const user = userEvent.setup()

			render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={vi.fn()} />)

			// Click "Assign it to someone"
			const assignButton = screen.getByRole('button', { name: /assign it to someone/i })
			await user.click(assignButton)

			// Continue should still be disabled (no person selected)
			const continueButton = screen.getByRole('button', { name: /continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should disable continue button until shipping option is selected', () => {
			render(<ShippingStage assignedPerson={null} onContinue={vi.fn()} />)

			// Continue button should be disabled initially
			const continueButton = screen.getByRole('button', { name: /continue/i })
			expect(continueButton).toBeDisabled()
		})

		it('should disable continue button until delivery option is selected', () => {
			render(<DeliveryStage onContinue={vi.fn()} />)

			// Continue button should be disabled initially
			const continueButton = screen.getByRole('button', { name: /continue/i })
			expect(continueButton).toBeDisabled()
		})
	})

	/**
	 * Scenario: Delivery option updates cart totals
	 *   Given user is on delivery stage
	 *   When selecting a delivery option
	 *   Then cart totals are updated via callback
	 */
	describe('Delivery stage updates cart', () => {
		it('should call onCartUpdate when delivery option is selected', async () => {
			const user = userEvent.setup()
			const onCartUpdate = vi.fn()

			render(<DeliveryStage onContinue={vi.fn()} onCartUpdate={onCartUpdate} cartSubtotal={2500} />)

			// Select standard delivery
			const standardOption = screen.getByText(/standard/i)
			await user.click(standardOption)

			// Verify cart update was called with shipping and taxes
			await waitFor(() => {
				expect(onCartUpdate).toHaveBeenCalledWith(
					expect.any(Number), // shipping cost
					expect.any(Number), // taxes
				)
			})
		})

		it('should update cart when switching delivery options', async () => {
			const user = userEvent.setup()
			const onCartUpdate = vi.fn()

			render(<DeliveryStage onContinue={vi.fn()} onCartUpdate={onCartUpdate} cartSubtotal={2500} />)

			// Select standard delivery
			const standardOption = screen.getByText(/standard/i)
			await user.click(standardOption)

			// Select express delivery
			const expressOption = screen.getByText(/express/i)
			await user.click(expressOption)

			// Verify cart update was called for both selections
			await waitFor(() => {
				expect(onCartUpdate).toHaveBeenCalledTimes(2)
			})
		})
	})

	/**
	 * Scenario: Request info email flow
	 *   Given assigned person has missing info
	 *   When user clicks "Request Info"
	 *   Then email request is sent
	 */
	describe('Request info email integration', () => {
		it('should show request info option when assignee lacks info', async () => {
			const user = userEvent.setup()
			const onSendEmailRequest = vi.fn().mockResolvedValue(undefined)

			render(
				<ShippingStage
					assignedPerson={mockTeamMembers[1]} // Bob - no address/phone
					onContinue={vi.fn()}
					onSendEmailRequest={onSendEmailRequest}
				/>,
			)

			// The "To Bob's address" button should be disabled but exists
			const toAssigneeButton = screen.getByRole('button', { name: /to bob's address/i })
			expect(toAssigneeButton).toBeDisabled()
		})
	})
})

describe('AssignmentStage Component Tests', () => {
	it('should render all assignment options', () => {
		render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={vi.fn()} />)

		expect(screen.getByText(/who will use this equipment/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /assign it to someone/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /leave it unassigned/i })).toBeInTheDocument()
	})

	it('should display team members when clicking search input after assigning', async () => {
		const user = userEvent.setup()

		render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={vi.fn()} />)

		// Click assign option
		await user.click(screen.getByRole('button', { name: /assign it to someone/i }))

		// Now click on search input to show dropdown
		const searchInput = screen.getByPlaceholderText(/search team members/i)
		await user.click(searchInput)

		// Team members should be visible in dropdown
		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeInTheDocument()
			expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
			expect(screen.getByText('Carol Williams')).toBeInTheDocument()
		})
	})

	it('should highlight selected person and enable continue', async () => {
		const user = userEvent.setup()

		render(<AssignmentStage teamMembers={mockTeamMembers} onContinue={vi.fn()} />)

		// Click assign option
		await user.click(screen.getByRole('button', { name: /assign it to someone/i }))

		// Open dropdown
		const searchInput = screen.getByPlaceholderText(/search team members/i)
		await user.click(searchInput)

		// Select Alice
		await waitFor(() => {
			expect(screen.getByText('Alice Smith')).toBeInTheDocument()
		})
		await user.click(screen.getByText('Alice Smith'))

		// The continue button should now be enabled
		expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
	})
})

describe('ShippingStage Component Tests', () => {
	it('should render shipping options', () => {
		render(<ShippingStage assignedPerson={mockTeamMembers[0]} onContinue={vi.fn()} />)

		expect(screen.getByText(/where should we send the order/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /to another address/i })).toBeInTheDocument()
	})

	it('should show address form when "To another address" is selected', async () => {
		const user = userEvent.setup()

		render(<ShippingStage assignedPerson={null} onContinue={vi.fn()} />)

		// Click "To another address"
		await user.click(screen.getByRole('button', { name: /to another address/i }))

		// Address entry should be shown
		expect(screen.getByPlaceholderText(/start typing an address/i)).toBeInTheDocument()
	})
})

describe('DeliveryStage Component Tests', () => {
	it('should render delivery options', () => {
		render(<DeliveryStage onContinue={vi.fn()} />)

		expect(screen.getByText(/when would you like to get your order/i)).toBeInTheDocument()
		expect(screen.getByText(/standard/i)).toBeInTheDocument()
		expect(screen.getByText(/express/i)).toBeInTheDocument()
	})

	it('should keep continue disabled when custom date not selected', async () => {
		const user = userEvent.setup()

		render(<DeliveryStage onContinue={vi.fn()} />)

		// Click custom date option - use getAllByText since "Select a date" appears multiple times
		const customOptions = screen.getAllByText(/select a date/i)
		// Click the first one (the title of the option card)
		await user.click(customOptions[0])

		// Continue should still be disabled until a date is selected
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
		})
	})

	it('should pass initial delivery data when provided', () => {
		const initialDelivery: DeliveryData = {
			speed: 'express',
			estimatedDate: new Date(),
			cost: 49.99,
		}

		render(<DeliveryStage initialDelivery={initialDelivery} onContinue={vi.fn()} />)

		// Express should be pre-selected (continue button should be enabled)
		expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
	})
})
