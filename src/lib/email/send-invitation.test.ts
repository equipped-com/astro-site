/**
 * Invitation Email Templates Tests
 *
 * Comprehensive tests for invitation email rendering with Gherkin BDD format.
 * Tests cover all three email types: invitation, acceptance notification, decline notification.
 *
 * Tests validate:
 * - Email content includes all required elements
 * - Links are correctly formatted
 * - Branding is applied consistently
 * - Mobile responsiveness via media queries
 * - Expiry dates are formatted correctly
 */

import { describe, expect, it } from 'vitest'
import {
	htmlToText,
	renderAcceptanceNotificationEmail,
	renderDeclineNotificationEmail,
	renderInvitationEmail,
	type AcceptanceNotificationContext,
	type DeclineNotificationContext,
	type InvitationEmailContext,
} from './send-invitation'

describe('Feature: Invitation Email Templates', () => {
	/**
	 * @REQ-EMAIL-001 @Template
	 * Scenario: Invitation email content
	 *   Given an invitation was sent to "alice@example.com"
	 *   When the invitation email is rendered
	 *   Then it should include:
	 *     | Element           | Present |
	 *     | Company name      | Yes     |
	 *     | Inviter name      | Yes     |
	 *     | Role being granted| Yes     |
	 *     | Accept button     | Yes     |
	 *     | Decline button    | Yes     |
	 *     | Expiry date       | Yes     |
	 *     | Equipped logo     | Yes     |
	 */
	describe('@REQ-EMAIL-001 - Invitation email content', () => {
		it('should include all required elements in invitation email', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'alice@example.com',
				inviterName: 'John Smith',
				companyName: 'Acme Corp',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://equipped.example.com/invitations/inv-123/accept',
				declineUrl: 'https://equipped.example.com/invitations/inv-123/decline',
			}

			const html = renderInvitationEmail(context)

			// Verify company name is present
			expect(html).toContain('Acme Corp')

			// Verify inviter name is present
			expect(html).toContain('John Smith')

			// Verify role is shown
			expect(html).toContain('admin')

			// Verify both buttons are present
			expect(html).toContain('Accept Invitation')
			expect(html).toContain('Decline')

			// Verify expiry date is present
			const expiryDate = new Date(context.expiryDate)
			const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
			expect(html).toContain(formattedExpiry)

			// Verify Equipped logo is present
			expect(html).toContain('Equipped')
		})

		it('should display personal greeting with invitee name', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'alice@example.com',
				inviterName: 'John Smith',
				companyName: 'Acme Corp',
				role: 'member',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should address invitee by email name
			expect(html).toContain('Hi alice')
		})

		it('should show role as badge in invitation email', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'bob@example.com',
				inviterName: 'Jane Doe',
				companyName: 'Tech Inc',
				role: 'buyer',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-456',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('Role:')
			expect(html).toContain('buyer')
		})

		it('should format expiry date as readable date', () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 14)

			const context: InvitationEmailContext = {
				inviteeEmail: 'charlie@example.com',
				inviterName: 'Admin User',
				companyName: 'Company',
				role: 'viewer',
				expiryDate: futureDate.toISOString(),
				invitationId: 'inv-789',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should include month name and year
			expect(html).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/)
		})
	})

	/**
	 * @REQ-EMAIL-002 @Links
	 * Scenario: Accept/decline links
	 *   Given an invitation email
	 *   When I click "Accept Invitation"
	 *   Then I should be taken to acceptance page with invitation token
	 *   When I click "Decline"
	 *   Then I should be taken to decline confirmation page
	 */
	describe('@REQ-EMAIL-002 - Accept/decline links', () => {
		it('should include properly formatted acceptance link with token', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-12345',
				acceptanceUrl: 'https://equipped.example.com/invitations/inv-12345/accept',
				declineUrl: 'https://equipped.example.com/invitations/inv-12345/decline',
			}

			const html = renderInvitationEmail(context)

			// Should include acceptance URL
			expect(html).toContain('https://equipped.example.com/invitations/inv-12345/accept')

			// Should be in href attribute (not just text)
			expect(html).toMatch(/href="[^"]*\/invitations\/inv-12345\/accept"/)
		})

		it('should include properly formatted decline link with token', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'member',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-67890',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://equipped.example.com/invitations/inv-67890/decline',
			}

			const html = renderInvitationEmail(context)

			// Should include decline URL
			expect(html).toContain('https://equipped.example.com/invitations/inv-67890/decline')

			// Should be in href attribute
			expect(html).toMatch(/href="[^"]*\/invitations\/inv-67890\/decline"/)
		})

		it('should have clickable button text for acceptance', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-xyz',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Button text should be clear CTA
			expect(html).toContain('Accept Invitation')
		})

		it('should have clickable button text for decline', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'member',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-abc',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('Decline')
		})
	})

	/**
	 * @REQ-EMAIL-003 @Branding
	 * Scenario: Email branding
	 *   Given any invitation email
	 *   Then it should use Equipped brand colors
	 *   And it should include the Equipped logo
	 *   And it should follow email design system
	 */
	describe('@REQ-EMAIL-003 - Email branding', () => {
		it('should include Equipped logo in all email types', () => {
			const invitationContext: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(invitationContext)
			expect(html).toContain('Equipped')
		})

		it('should use black header color (brand primary)', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have black background-color for header
			expect(html).toContain('background-color: #000000')
		})

		it('should include copyright footer', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('© 2025 Equipped')
			expect(html).toContain('Asset Management & Device Provisioning')
		})

		it('should have consistent styling across email', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have consistent border styling
			expect(html).toContain('border: 1px solid #e5e7eb')
			// Should have consistent spacing
			expect(html).toContain('padding')
		})
	})

	/**
	 * @REQ-EMAIL-004 @Notification
	 * Scenario: Accepted notification to inviter
	 *   Given "alice@example.com" accepted the invitation
	 *   When the acceptance email is sent to the inviter
	 *   Then it should say "alice@example.com has joined your team"
	 *   And it should include the role granted
	 *   And it should link to team settings
	 */
	describe('@REQ-EMAIL-004 - Accepted notification to inviter', () => {
		it('should notify inviter of acceptance', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'alice@example.com',
				accepterName: 'Alice Johnson',
				inviterEmail: 'inviter@example.com',
				inviterName: 'John Smith',
				companyName: 'Acme Corp',
				role: 'admin',
				teamSettingsUrl: 'https://equipped.example.com/settings/team',
			}

			const html = renderAcceptanceNotificationEmail(context)

			// Should include acceptance message
			expect(html).toContain('accepted your invitation')
			expect(html).toContain('Alice Johnson')
			expect(html).toContain('alice@example.com')
		})

		it('should display role granted in acceptance notification', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'bob@example.com',
				accepterName: 'Bob Wilson',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Admin',
				companyName: 'Tech Inc',
				role: 'member',
				teamSettingsUrl: 'https://example.com/settings',
			}

			const html = renderAcceptanceNotificationEmail(context)

			expect(html).toContain('member')
		})

		it('should include link to team settings', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'charlie@example.com',
				accepterName: 'Charlie Davis',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'buyer',
				teamSettingsUrl: 'https://equipped.example.com/dashboard/settings/team',
			}

			const html = renderAcceptanceNotificationEmail(context)

			expect(html).toContain('https://equipped.example.com/dashboard/settings/team')
			expect(html).toContain('Go to Team Settings')
		})

		it('should show success badge in acceptance notification', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'user@example.com',
				accepterName: 'User Name',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Inviter',
				companyName: 'Company',
				role: 'admin',
				teamSettingsUrl: 'https://example.com/settings',
			}

			const html = renderAcceptanceNotificationEmail(context)

			expect(html).toContain('✓')
			expect(html).toContain('Member joined successfully')
		})

		it('should include all member details in notification', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'newmember@example.com',
				accepterName: 'New Member',
				inviterEmail: 'admin@example.com',
				inviterName: 'Administrator',
				companyName: 'Enterprise Corp',
				role: 'viewer',
				teamSettingsUrl: 'https://example.com/team',
			}

			const html = renderAcceptanceNotificationEmail(context)

			expect(html).toContain('New Member')
			expect(html).toContain('newmember@example.com')
			expect(html).toContain('viewer')
			expect(html).toContain('Enterprise Corp')
		})
	})

	/**
	 * @REQ-EMAIL-005 @Notification
	 * Scenario: Declined notification to inviter
	 *   Given "bob@example.com" declined the invitation
	 *   When the decline email is sent to the inviter
	 *   Then it should say "bob@example.com declined your invitation"
	 *   And it should suggest alternative actions
	 */
	describe('@REQ-EMAIL-005 - Declined notification to inviter', () => {
		it('should notify inviter of decline', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'bob@example.com',
				declinerName: 'Bob Johnson',
				inviterEmail: 'inviter@example.com',
				inviterName: 'John Smith',
				companyName: 'Acme Corp',
				role: 'admin',
			}

			const html = renderDeclineNotificationEmail(context)

			// Should include decline message
			expect(html).toContain('declined')
			expect(html).toContain('Bob Johnson')
			expect(html).toContain('bob@example.com')
		})

		it('should display role offered in decline notification', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'jane@example.com',
				declinerName: 'Jane Doe',
				inviterEmail: 'admin@example.com',
				inviterName: 'Admin',
				companyName: 'Tech Inc',
				role: 'member',
			}

			const html = renderDeclineNotificationEmail(context)

			expect(html).toContain('member')
		})

		it('should suggest alternative actions in decline notification', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'user@example.com',
				declinerName: 'User Name',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Inviter',
				companyName: 'Company',
				role: 'viewer',
			}

			const html = renderDeclineNotificationEmail(context)

			// Should suggest reaching out
			expect(html).toContain('reach out')
			// Should suggest inviting someone else
			expect(html).toContain('invite')
		})

		it('should include all decline details', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'charlie@example.com',
				declinerName: 'Charlie Wilson',
				inviterEmail: 'admin@example.com',
				inviterName: 'Administrator',
				companyName: 'Enterprise',
				role: 'buyer',
			}

			const html = renderDeclineNotificationEmail(context)

			expect(html).toContain('Charlie Wilson')
			expect(html).toContain('charlie@example.com')
			expect(html).toContain('buyer')
			expect(html).toContain('Enterprise')
		})

		it('should provide helpful next steps after decline', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'user@example.com',
				declinerName: 'User Name',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Inviter',
				companyName: 'Company',
				role: 'admin',
			}

			const html = renderDeclineNotificationEmail(context)

			// Should suggest next steps
			expect(html).toContain('What happens next')
		})
	})

	/**
	 * @REQ-EMAIL-006 @Responsive
	 * Scenario: Mobile responsiveness
	 *   Given any invitation email
	 *   When viewed on mobile device
	 *   Then text should be readable
	 *   And buttons should be tappable
	 *   And layout should adapt to screen size
	 */
	describe('@REQ-EMAIL-006 - Mobile responsiveness', () => {
		it('should include mobile media query for responsive layout', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have media query for mobile
			expect(html).toContain('@media (max-width: 600px)')
		})

		it('should make buttons full width on mobile', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have display: block for buttons on mobile
			expect(html).toContain('width: 100%')
		})

		it('should reduce padding on mobile devices', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have smaller padding in mobile media query
			expect(html).toContain('padding: 24px 16px')
		})

		it('should have readable font sizes on mobile', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have font-size styling
			expect(html).toContain('font-size:')
		})

		it('should include viewport meta tag', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('viewport')
			expect(html).toContain('initial-scale=1.0')
		})

		it('should be responsive in acceptance notification', () => {
			const context: AcceptanceNotificationContext = {
				accepterEmail: 'user@example.com',
				accepterName: 'User',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Inviter',
				companyName: 'Company',
				role: 'admin',
				teamSettingsUrl: 'https://example.com/settings',
			}

			const html = renderAcceptanceNotificationEmail(context)

			expect(html).toContain('@media (max-width: 600px)')
			expect(html).toContain('viewport')
		})

		it('should be responsive in decline notification', () => {
			const context: DeclineNotificationContext = {
				declinerEmail: 'user@example.com',
				declinerName: 'User',
				inviterEmail: 'inviter@example.com',
				inviterName: 'Inviter',
				companyName: 'Company',
				role: 'admin',
			}

			const html = renderDeclineNotificationEmail(context)

			expect(html).toContain('@media (max-width: 600px)')
			expect(html).toContain('viewport')
		})
	})

	/**
	 * Additional utility function tests
	 */
	describe('HTML to text conversion', () => {
		it('should convert HTML to plain text', () => {
			const html = '<p>Hello <strong>world</strong></p>'
			const text = htmlToText(html)
			expect(text).toContain('Hello')
			expect(text).toContain('world')
		})

		it('should remove HTML tags', () => {
			const html = '<div><p>Text</p></div>'
			const text = htmlToText(html)
			expect(text).not.toContain('<')
			expect(text).not.toContain('>')
		})

		it('should decode HTML entities', () => {
			const html = 'AT&amp;T&nbsp;&lt;test&gt;'
			const text = htmlToText(html)
			expect(text).toContain('AT&T')
			expect(text).toContain('<test>')
		})

		it('should clean up whitespace', () => {
			const html = '<p>   Multiple   spaces   </p>'
			const text = htmlToText(html)
			expect(text).not.toMatch(/  +/)
		})
	})

	/**
	 * Email structure and validity tests
	 */
	describe('Email structure', () => {
		it('should have valid HTML structure in invitation email', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('<!DOCTYPE html>')
			expect(html).toContain('<html')
			expect(html).toContain('</html>')
			expect(html).toContain('<body>')
			expect(html).toContain('</body>')
		})

		it('should include charset meta tag', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('charset="UTF-8"')
		})

		it('should include language attribute', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			expect(html).toContain('lang="en"')
		})
	})

	/**
	 * Content verification tests
	 */
	describe('Email content quality', () => {
		it('should have professional tone', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should have clear, professional language
			expect(html).toContain('invited')
			expect(html).toContain('access')
		})

		it('should include helpful information about what comes next', () => {
			const context: InvitationEmailContext = {
				inviteeEmail: 'user@example.com',
				inviterName: 'Admin',
				companyName: 'Company',
				role: 'admin',
				expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
				invitationId: 'inv-123',
				acceptanceUrl: 'https://example.com/accept',
				declineUrl: 'https://example.com/decline',
			}

			const html = renderInvitationEmail(context)

			// Should explain what user gets after accepting
			expect(html).toContain('access')
		})
	})
})
