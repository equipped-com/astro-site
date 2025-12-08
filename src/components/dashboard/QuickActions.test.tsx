/**
 * @REQ dashboard/dashboard-home
 * @description Tests for QuickActions component displaying action shortcuts
 *
 * Feature: Dashboard Quick Actions
 *   As a user
 *   I want to see quick action shortcuts
 *   So that I can efficiently navigate to common tasks
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuickActions } from './QuickActions'

describe('QuickActions', () => {
	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Display all quick action shortcuts
	 *   Given I am viewing the dashboard
	 *   When the QuickActions component renders
	 *   Then I should see 4 action cards
	 *   And they should include "Add Device", "Shop Devices", "Add Team Member", and "Create Proposal"
	 */
	it('should render all quick action cards', () => {
		render(<QuickActions />)

		expect(screen.getByText('Add Device')).toBeInTheDocument()
		expect(screen.getByText('Shop Devices')).toBeInTheDocument()
		expect(screen.getByText('Add Team Member')).toBeInTheDocument()
		expect(screen.getByText('Create Proposal')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Quick Actions section has a title
	 *   Given I am viewing the dashboard
	 *   When the QuickActions component renders
	 *   Then I should see a "Quick Actions" heading
	 */
	it('should display section title', () => {
		render(<QuickActions />)

		expect(screen.getByText('Quick Actions')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Action cards include descriptions
	 *   Given I am viewing quick actions
	 *   When I look at each action card
	 *   Then each should have a descriptive subtitle
	 */
	it('should display descriptions for each action', () => {
		render(<QuickActions />)

		expect(screen.getByText('Register a new device to your fleet')).toBeInTheDocument()
		expect(screen.getByText('Browse and order new equipment')).toBeInTheDocument()
		expect(screen.getByText('Onboard a new employee')).toBeInTheDocument()
		expect(screen.getByText('Generate a quote for approval')).toBeInTheDocument()
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Action cards link to correct pages
	 *   Given I am viewing quick actions
	 *   When I check the action card links
	 *   Then they should point to the correct URLs
	 */
	it('should link to correct destination pages', () => {
		render(<QuickActions />)

		const addDeviceLink = screen.getByText('Add Device').closest('a')
		const shopLink = screen.getByText('Shop Devices').closest('a')
		const addMemberLink = screen.getByText('Add Team Member').closest('a')
		const proposalLink = screen.getByText('Create Proposal').closest('a')

		expect(addDeviceLink).toHaveAttribute('href', '/dashboard/devices?action=add')
		expect(shopLink).toHaveAttribute('href', '/dashboard/store')
		expect(addMemberLink).toHaveAttribute('href', '/dashboard/people?action=add')
		expect(proposalLink).toHaveAttribute('href', '/dashboard/proposals/new')
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Primary actions are visually distinct
	 *   Given I am viewing quick actions
	 *   When I look at the action cards
	 *   Then primary actions (Add Device, Shop Devices) should have distinct styling
	 *   And secondary actions should have standard styling
	 */
	it('should style primary actions differently', () => {
		render(<QuickActions />)

		const addDeviceCard = screen.getByText('Add Device').closest('a')
		const shopCard = screen.getByText('Shop Devices').closest('a')
		const addMemberCard = screen.getByText('Add Team Member').closest('a')

		// Primary cards should have primary-related classes
		expect(addDeviceCard?.className).toContain('border-primary')
		expect(shopCard?.className).toContain('border-primary')

		// Secondary cards should have border-border
		expect(addMemberCard?.className).toContain('border-border')
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Action cards display icons
	 *   Given I am viewing quick actions
	 *   When I look at each action card
	 *   Then each should have a relevant icon
	 */
	it('should render icons for each action', () => {
		const { container } = render(<QuickActions />)

		// Check that SVG icons are present (lucide-react icons render as SVGs)
		const svgs = container.querySelectorAll('svg')
		expect(svgs.length).toBeGreaterThanOrEqual(4) // At least one icon per action
	})

	/**
	 * @REQ dashboard/dashboard-home
	 * Scenario: Responsive grid layout
	 *   Given I am viewing quick actions on different screen sizes
	 *   When the component renders
	 *   Then it should use a responsive grid layout
	 */
	it('should use responsive grid layout', () => {
		const { container } = render(<QuickActions />)

		const grid = container.querySelector('.grid')
		expect(grid?.className).toMatch(/sm:grid-cols-2/)
		expect(grid?.className).toMatch(/lg:grid-cols-4/)
	})
})
