/**
 * Invitation Email Service
 *
 * Handles rendering and sending invitation emails with support for:
 * - Invitation sent (to invitee)
 * - Invitation accepted (to inviter)
 * - Invitation declined (to inviter)
 *
 * All emails are branded, mobile-responsive, and include clear CTAs.
 *
 * REQ-EMAIL-001 to REQ-EMAIL-006 from task
 */

import type { Role } from '@/api/middleware/auth'

export interface InvitationEmailContext {
	inviteeEmail: string
	inviterName: string
	companyName: string
	role: Role
	expiryDate: string
	invitationId: string
	acceptanceUrl: string
	declineUrl: string
}

export interface AcceptanceNotificationContext {
	accepterEmail: string
	accepterName: string
	inviterEmail: string
	inviterName: string
	companyName: string
	role: Role
	teamSettingsUrl: string
}

export interface DeclineNotificationContext {
	declinerEmail: string
	declinerName: string
	inviterEmail: string
	inviterName: string
	companyName: string
	role: Role
}

/**
 * Render invitation email HTML
 *
 * @REQ-EMAIL-001: Email includes company name, inviter name, role, buttons, expiry, logo
 * @REQ-EMAIL-002: Accept/decline links provided
 * @REQ-EMAIL-003: Uses Equipped branding
 * @REQ-EMAIL-006: Mobile responsive
 */
export function renderInvitationEmail(context: InvitationEmailContext): string {
	const { inviteeEmail, inviterName, companyName, role, expiryDate, acceptanceUrl, declineUrl } = context

	const expiryDateObj = new Date(expiryDate)
	const formattedExpiry = expiryDateObj.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>You've been invited to join ${companyName} on Equipped</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			line-height: 1.6;
			color: #3f3f46;
			background-color: #f9fafb;
		}
		.container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
			border: 1px solid #e5e7eb;
		}
		.header {
			background-color: #000000;
			padding: 32px 24px;
			text-align: center;
		}
		.logo {
			font-size: 24px;
			font-weight: 700;
			color: #ffffff;
			letter-spacing: -0.5px;
		}
		.content {
			padding: 32px 24px;
		}
		.greeting {
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 16px;
			color: #000000;
		}
		.text {
			margin-bottom: 16px;
			font-size: 14px;
			line-height: 1.6;
		}
		.role-badge {
			display: inline-block;
			background-color: #f3f4f6;
			border: 1px solid #e5e7eb;
			padding: 6px 12px;
			border-radius: 4px;
			font-size: 13px;
			font-weight: 500;
			color: #374151;
			margin: 16px 0;
		}
		.cta-section {
			margin: 32px 0;
			text-align: center;
		}
		.button {
			display: inline-block;
			padding: 12px 24px;
			font-size: 14px;
			font-weight: 600;
			text-decoration: none;
			border-radius: 4px;
			margin: 8px;
			cursor: pointer;
			transition: all 0.2s;
		}
		.button-primary {
			background-color: #000000;
			color: #ffffff;
			border: 1px solid #000000;
		}
		.button-primary:hover {
			background-color: #1f2937;
		}
		.button-secondary {
			background-color: #ffffff;
			color: #000000;
			border: 1px solid #000000;
		}
		.button-secondary:hover {
			background-color: #f3f4f6;
		}
		.expiry-notice {
			background-color: #fef3c7;
			border: 1px solid #fcd34d;
			border-radius: 4px;
			padding: 12px;
			margin: 16px 0;
			font-size: 13px;
			color: #78350f;
		}
		.footer {
			background-color: #f9fafb;
			border-top: 1px solid #e5e7eb;
			padding: 24px;
			text-align: center;
			font-size: 12px;
			color: #6b7280;
		}
		.divider {
			height: 1px;
			background-color: #e5e7eb;
			margin: 24px 0;
		}
		@media (max-width: 600px) {
			.container {
				border: none;
			}
			.content {
				padding: 24px 16px;
			}
			.header {
				padding: 24px 16px;
			}
			.button {
				display: block;
				width: 100%;
				margin: 8px 0;
			}
			.greeting {
				font-size: 18px;
			}
			.text {
				font-size: 13px;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo">Equipped</div>
		</div>
		<div class="content">
			<div class="greeting">You've been invited to join ${companyName}</div>

			<div class="text">
				Hi ${inviteeEmail.split('@')[0]},
			</div>

			<div class="text">
				<strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Equipped as a <strong>${role}</strong>.
			</div>

			<div class="text">
				Once you accept this invitation, you'll have access to:
			</div>
			<div class="text" style="margin-left: 16px; font-size: 13px;">
				• Device management and provisioning<br>
				• Team collaboration tools<br>
				• Asset tracking and reporting<br>
				• Integration with your IT systems
			</div>

			<div class="role-badge">
				Role: <strong>${role}</strong>
			</div>

			<div class="cta-section">
				<a href="${acceptanceUrl}" class="button button-primary">Accept Invitation</a>
				<a href="${declineUrl}" class="button button-secondary">Decline</a>
			</div>

			<div class="expiry-notice">
				<strong>Important:</strong> This invitation expires on ${formattedExpiry}. Accept it before then to join the team.
			</div>

			<div class="divider"></div>

			<div class="text" style="font-size: 13px; color: #6b7280;">
				If you have any questions about this invitation or need help getting started, please contact ${inviterName}.
			</div>
		</div>
		<div class="footer">
			<div style="margin-bottom: 12px;">Equipped - Asset Management & Device Provisioning</div>
			<div>© 2025 Equipped. All rights reserved.</div>
		</div>
	</div>
</body>
</html>`
}

/**
 * Render acceptance notification email (sent to inviter)
 *
 * @REQ-EMAIL-004: Notifies inviter of acceptance
 * @REQ-EMAIL-003: Uses Equipped branding
 */
export function renderAcceptanceNotificationEmail(context: AcceptanceNotificationContext): string {
	const { accepterEmail, accepterName, companyName, role, teamSettingsUrl } = context

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${accepterName} accepted your invitation to ${companyName}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			line-height: 1.6;
			color: #3f3f46;
			background-color: #f9fafb;
		}
		.container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
			border: 1px solid #e5e7eb;
		}
		.header {
			background-color: #000000;
			padding: 32px 24px;
			text-align: center;
		}
		.logo {
			font-size: 24px;
			font-weight: 700;
			color: #ffffff;
			letter-spacing: -0.5px;
		}
		.content {
			padding: 32px 24px;
		}
		.greeting {
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 16px;
			color: #000000;
		}
		.text {
			margin-bottom: 16px;
			font-size: 14px;
			line-height: 1.6;
		}
		.success-badge {
			display: inline-block;
			background-color: #dcfce7;
			border: 1px solid #bbf7d0;
			padding: 8px 12px;
			border-radius: 4px;
			font-size: 13px;
			font-weight: 500;
			color: #166534;
			margin: 16px 0;
		}
		.role-details {
			background-color: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			padding: 16px;
			margin: 16px 0;
			font-size: 13px;
		}
		.role-details-item {
			margin-bottom: 8px;
		}
		.role-details-label {
			color: #6b7280;
			font-weight: 500;
		}
		.button {
			display: inline-block;
			padding: 12px 24px;
			font-size: 14px;
			font-weight: 600;
			text-decoration: none;
			border-radius: 4px;
			background-color: #000000;
			color: #ffffff;
			margin: 16px 0;
			cursor: pointer;
			transition: all 0.2s;
		}
		.button:hover {
			background-color: #1f2937;
		}
		.footer {
			background-color: #f9fafb;
			border-top: 1px solid #e5e7eb;
			padding: 24px;
			text-align: center;
			font-size: 12px;
			color: #6b7280;
		}
		.divider {
			height: 1px;
			background-color: #e5e7eb;
			margin: 24px 0;
		}
		@media (max-width: 600px) {
			.container {
				border: none;
			}
			.content {
				padding: 24px 16px;
			}
			.header {
				padding: 24px 16px;
			}
			.button {
				display: block;
				width: 100%;
			}
			.greeting {
				font-size: 18px;
			}
			.text {
				font-size: 13px;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo">Equipped</div>
		</div>
		<div class="content">
			<div class="greeting">Team member accepted your invitation</div>

			<div class="text">
				Great news! <strong>${accepterName}</strong> (<strong>${accepterEmail}</strong>) has accepted your invitation to join <strong>${companyName}</strong> on Equipped.
			</div>

			<div class="success-badge">
				✓ Member joined successfully
			</div>

			<div class="role-details">
				<div class="role-details-item">
					<span class="role-details-label">Name:</span> ${accepterName}
				</div>
				<div class="role-details-item">
					<span class="role-details-label">Email:</span> ${accepterEmail}
				</div>
				<div class="role-details-item">
					<span class="role-details-label">Role:</span> <strong>${role}</strong>
				</div>
			</div>

			<div class="text">
				They now have access to all the team resources and can start collaborating right away. You can manage their permissions and team role from your team settings.
			</div>

			<div style="text-align: center;">
				<a href="${teamSettingsUrl}" class="button">Go to Team Settings</a>
			</div>

			<div class="divider"></div>

			<div class="text" style="font-size: 13px; color: #6b7280;">
				You can invite more team members, adjust roles, and manage your team from your account settings at any time.
			</div>
		</div>
		<div class="footer">
			<div style="margin-bottom: 12px;">Equipped - Asset Management & Device Provisioning</div>
			<div>© 2025 Equipped. All rights reserved.</div>
		</div>
	</div>
</body>
</html>`
}

/**
 * Render decline notification email (sent to inviter)
 *
 * @REQ-EMAIL-005: Notifies inviter of decline
 * @REQ-EMAIL-003: Uses Equipped branding
 */
export function renderDeclineNotificationEmail(context: DeclineNotificationContext): string {
	const { declinerEmail, declinerName, companyName, role } = context

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${declinerName} declined your invitation to ${companyName}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			line-height: 1.6;
			color: #3f3f46;
			background-color: #f9fafb;
		}
		.container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
			border: 1px solid #e5e7eb;
		}
		.header {
			background-color: #000000;
			padding: 32px 24px;
			text-align: center;
		}
		.logo {
			font-size: 24px;
			font-weight: 700;
			color: #ffffff;
			letter-spacing: -0.5px;
		}
		.content {
			padding: 32px 24px;
		}
		.greeting {
			font-size: 20px;
			font-weight: 600;
			margin-bottom: 16px;
			color: #000000;
		}
		.text {
			margin-bottom: 16px;
			font-size: 14px;
			line-height: 1.6;
		}
		.info-box {
			background-color: #fef3c7;
			border: 1px solid #fcd34d;
			border-radius: 4px;
			padding: 16px;
			margin: 16px 0;
			font-size: 13px;
		}
		.decline-details {
			background-color: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			padding: 16px;
			margin: 16px 0;
			font-size: 13px;
		}
		.decline-details-item {
			margin-bottom: 8px;
		}
		.decline-details-label {
			color: #6b7280;
			font-weight: 500;
		}
		.footer {
			background-color: #f9fafb;
			border-top: 1px solid #e5e7eb;
			padding: 24px;
			text-align: center;
			font-size: 12px;
			color: #6b7280;
		}
		.divider {
			height: 1px;
			background-color: #e5e7eb;
			margin: 24px 0;
		}
		@media (max-width: 600px) {
			.container {
				border: none;
			}
			.content {
				padding: 24px 16px;
			}
			.header {
				padding: 24px 16px;
			}
			.greeting {
				font-size: 18px;
			}
			.text {
				font-size: 13px;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo">Equipped</div>
		</div>
		<div class="content">
			<div class="greeting">Invitation declined</div>

			<div class="text">
				<strong>${declinerName}</strong> (<strong>${declinerEmail}</strong>) has declined your invitation to join <strong>${companyName}</strong> on Equipped.
			</div>

			<div class="decline-details">
				<div class="decline-details-item">
					<span class="decline-details-label">Declined by:</span> ${declinerName}
				</div>
				<div class="decline-details-item">
					<span class="decline-details-label">Email:</span> ${declinerEmail}
				</div>
				<div class="decline-details-item">
					<span class="decline-details-label">Role offered:</span> <strong>${role}</strong>
				</div>
			</div>

			<div class="info-box">
				<strong>What happens next?</strong><br>
				You can invite another team member to this role, or reach out to ${declinerName} directly if you'd like to discuss further.
			</div>

			<div class="text">
				If you'd like to invite a different person to this role or have questions, you can manage your team invitations from your account settings.
			</div>

			<div class="divider"></div>

			<div class="text" style="font-size: 13px; color: #6b7280;">
				Questions? You can always invite them again later or reach out to them directly through your preferred communication channel.
			</div>
		</div>
		<div class="footer">
			<div style="margin-bottom: 12px;">Equipped - Asset Management & Device Provisioning</div>
			<div>© 2025 Equipped. All rights reserved.</div>
		</div>
	</div>
</body>
</html>`
}

/**
 * Extract text version from HTML email (for plain text email clients)
 */
export function htmlToText(html: string): string {
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/  +/g, ' ')
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0)
		.join('\n')
}
