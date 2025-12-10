/**
 * Invitation Expiry Worker
 *
 * Scheduled worker that runs daily to:
 * - Query invitations where expires_at < NOW() and status is still pending
 * - Log expired invitations for monitoring
 * - Optional: Send expiry notifications to inviters
 *
 * Schedule: Daily at 2 AM UTC
 */
import { and, isNull, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { accountInvitations } from '../db/schema'
import { getInvitationStatus, type Invitation } from '../lib/invitations'

interface Env {
	DB: D1Database
	ENVIRONMENT?: string
}

interface ScheduledEvent {
	scheduledTime: number
	cron: string
}

// Re-export from lib/invitations for convenience
export { getInvitationStatus }

/**
 * Scheduled worker handler
 * Runs daily at 2 AM UTC via cron trigger
 */
export default {
	async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
		const startTime = Date.now()
		console.log(`[Invitation Expiry Worker] Started at ${new Date(event.scheduledTime).toISOString()}`)
		console.log(`[Invitation Expiry Worker] Cron schedule: ${event.cron}`)

		try {
			const db = drizzle(env.DB)
			const now = new Date()

			// Query for expired invitations that are still pending
			const expiredInvitations = await db
				.select({
					id: accountInvitations.id,
					accountId: accountInvitations.accountId,
					email: accountInvitations.email,
					role: accountInvitations.role,
					invitedByUserId: accountInvitations.invitedByUserId,
					sentAt: accountInvitations.sentAt,
					expiresAt: accountInvitations.expiresAt,
				})
				.from(accountInvitations)
				.where(
					and(
						lt(accountInvitations.expiresAt, now.toISOString()),
						isNull(accountInvitations.acceptedAt),
						isNull(accountInvitations.declinedAt),
						isNull(accountInvitations.revokedAt),
					),
				)
				.execute()

			const duration = Date.now() - startTime

			// Log results
			console.log(`[Invitation Expiry Worker] Found ${expiredInvitations.length} expired invitations`)
			console.log(`[Invitation Expiry Worker] Processing duration: ${duration}ms`)

			if (expiredInvitations.length > 0) {
				console.log('[Invitation Expiry Worker] Expired invitation details:')
				for (const invitation of expiredInvitations) {
					const sentDate = new Date(invitation.sentAt || '')
					const expiresDate = new Date(invitation.expiresAt)
					const daysExpired = Math.floor((now.getTime() - expiresDate.getTime()) / (1000 * 60 * 60 * 24))

					console.log(
						`  - ID: ${invitation.id}, Email: ${invitation.email}, Account: ${invitation.accountId}, ` +
						`Expired: ${daysExpired} days ago (sent: ${sentDate.toISOString().split('T')[0]})`,
					)
				}

				// TODO: Send expiry notifications to inviters
				// This would integrate with an email service (e.g., SendGrid, Resend)
				// For now, we just log the expired invitations
			}

			console.log(`[Invitation Expiry Worker] Completed successfully in ${duration}ms`)
		} catch (error) {
			const duration = Date.now() - startTime
			console.error('[Invitation Expiry Worker] Error occurred:')
			console.error(`  Duration: ${duration}ms`)

			if (error instanceof Error) {
				console.error(`  Error: ${error.message}`)
				console.error(`  Stack: ${error.stack}`)
			} else {
				console.error(`  Error: ${String(error)}`)
			}

			// Re-throw to mark the worker execution as failed
			throw error
		}
	},
}
