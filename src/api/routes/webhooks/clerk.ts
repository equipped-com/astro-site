/**
 * Clerk Webhook Handler
 *
 * Syncs user events from Clerk to D1 database.
 * Handles user.created, user.updated, user.deleted, and organization.membership.created events.
 *
 * All operations are idempotent - safe to replay without creating duplicates.
 */
import { Hono } from 'hono'
import { Webhook } from 'svix'

// Clerk webhook event types
interface ClerkWebhookEvent {
	type: string
	data: Record<string, unknown>
}

interface ClerkEmailAddress {
	email_address: string
	id: string
	verification?: { status: string }
}

interface ClerkUserData {
	id: string
	email_addresses?: ClerkEmailAddress[]
	first_name?: string | null
	last_name?: string | null
	image_url?: string | null
}

interface ClerkOrgMembershipData {
	organization: { id: string; name?: string }
	public_user_data: { user_id: string }
	role: string
}

// Export for testing
export interface WebhookDependencies {
	verifySignature: (
		secret: string,
		payload: string,
		headers: { 'svix-id': string; 'svix-timestamp': string; 'svix-signature': string },
	) => ClerkWebhookEvent
}

// Default implementation using Svix
export const defaultDependencies: WebhookDependencies = {
	verifySignature: (secret, payload, headers) => {
		const wh = new Webhook(secret)
		return wh.verify(payload, headers) as ClerkWebhookEvent
	},
}

// Factory to create webhook handler with injectable dependencies (for testing)
export function createClerkWebhook(deps: WebhookDependencies = defaultDependencies) {
	const webhook = new Hono<{ Bindings: Env }>()

	webhook.post('/', async c => {
		const webhookSecret = c.env.CLERK_WEBHOOK_SECRET

		if (!webhookSecret) {
			console.error('CLERK_WEBHOOK_SECRET not configured')
			return c.json({ error: 'Webhook not configured' }, 500)
		}

		const payload = await c.req.text()
		const headers = {
			'svix-id': c.req.header('svix-id') ?? '',
			'svix-timestamp': c.req.header('svix-timestamp') ?? '',
			'svix-signature': c.req.header('svix-signature') ?? '',
		}

		// Verify signature
		let evt: ClerkWebhookEvent
		try {
			evt = deps.verifySignature(webhookSecret, payload, headers)
		} catch (err) {
			console.error('Webhook verification failed:', err)
			return c.json({ error: 'Invalid signature' }, 400)
		}

		const { type, data } = evt
		const db = c.env.DB

		if (!db) {
			console.error('Database not configured')
			return c.json({ error: 'Database not available' }, 503)
		}

		try {
			switch (type) {
				case 'user.created':
					await handleUserCreated(db, data as unknown as ClerkUserData)
					break

				case 'user.updated':
					await handleUserUpdated(db, data as unknown as ClerkUserData)
					break

				case 'user.deleted':
					await handleUserDeleted(db, data as unknown as ClerkUserData)
					break

				case 'organization.membership.created':
					await handleOrgMembershipCreated(db, data as unknown as ClerkOrgMembershipData)
					break

				default:
					console.log(`Unhandled webhook type: ${type}`)
			}

			return c.json({ success: true })
		} catch (err) {
			console.error(`Error handling webhook ${type}:`, err)
			return c.json({ error: 'Internal server error' }, 500)
		}
	})

	return webhook
}

/**
 * Handle user.created event
 * Creates a new user or updates if already exists (idempotent via UPSERT)
 */
async function handleUserCreated(db: D1Database, data: ClerkUserData): Promise<void> {
	const email = data.email_addresses?.[0]?.email_address
	const avatarUrl = data.image_url ?? null

	if (!email) {
		console.warn('user.created event missing email address, user:', data.id)
		return
	}

	// Upsert to handle idempotency - if user already exists, just update
	await db
		.prepare(
			`
		INSERT INTO users (id, email, first_name, last_name, avatar_url)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			email = excluded.email,
			first_name = excluded.first_name,
			last_name = excluded.last_name,
			avatar_url = excluded.avatar_url,
			updated_at = CURRENT_TIMESTAMP
	`,
		)
		.bind(data.id, email, data.first_name ?? null, data.last_name ?? null, avatarUrl)
		.run()
}

/**
 * Handle user.updated event
 * Updates existing user profile information
 */
async function handleUserUpdated(db: D1Database, data: ClerkUserData): Promise<void> {
	const email = data.email_addresses?.[0]?.email_address
	const avatarUrl = data.image_url ?? null

	if (!email) {
		console.warn('user.updated event missing email address, user:', data.id)
		return
	}

	await db
		.prepare(
			`
		UPDATE users SET
			email = ?,
			first_name = ?,
			last_name = ?,
			avatar_url = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`,
		)
		.bind(email, data.first_name ?? null, data.last_name ?? null, avatarUrl, data.id)
		.run()
}

/**
 * Handle user.deleted event
 * Soft-deletes user by setting deleted_at timestamp
 * Note: Requires deleted_at column on users table
 */
async function handleUserDeleted(db: D1Database, data: ClerkUserData): Promise<void> {
	// First check if deleted_at column exists
	// If not, we'll do a real delete for safety (until migration adds soft delete support)
	try {
		const result = await db
			.prepare(
				`
			UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
		`,
			)
			.bind(data.id)
			.run()

		// If no rows affected, column may not exist - try hard delete as fallback
		if (!result.meta.changes || result.meta.changes === 0) {
			// Check if user exists at all
			const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(data.id).first()
			if (user) {
				console.log(`User ${data.id} soft deleted (0 changes - column may already be set)`)
			} else {
				console.log(`User ${data.id} not found for deletion`)
			}
		}
	} catch (err) {
		// If deleted_at column doesn't exist, log warning and do hard delete
		console.warn('Soft delete failed (deleted_at column may not exist), performing hard delete:', err)
		await db.prepare('DELETE FROM users WHERE id = ?').bind(data.id).run()
	}
}

/**
 * Handle organization.membership.created event
 * Creates account_access record linking user to organization/account
 */
async function handleOrgMembershipCreated(db: D1Database, data: ClerkOrgMembershipData): Promise<void> {
	const orgId = data.organization?.id
	const userId = data.public_user_data?.user_id
	const role = mapClerkRoleToInternal(data.role)

	if (!orgId || !userId) {
		console.warn('organization.membership.created missing required data:', { orgId, userId })
		return
	}

	// Generate a unique ID for the access record
	const accessId = crypto.randomUUID()

	// Upsert to handle idempotency
	await db
		.prepare(
			`
		INSERT INTO account_access (id, user_id, account_id, role)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id, account_id) DO UPDATE SET
			role = excluded.role
	`,
		)
		.bind(accessId, userId, orgId, role)
		.run()
}

/**
 * Map Clerk organization roles to internal role system
 * Clerk uses: org:admin, org:member, etc.
 * We use: owner, admin, member, buyer, viewer, noaccess
 */
function mapClerkRoleToInternal(clerkRole: string): string {
	// Clerk role format: "org:admin" or just "admin"
	const role = clerkRole.replace('org:', '').toLowerCase()

	switch (role) {
		case 'owner':
			return 'owner'
		case 'admin':
			return 'admin'
		case 'member':
			return 'member'
		case 'buyer':
			return 'buyer'
		case 'viewer':
			return 'viewer'
		default:
			return 'member' // Default to member for unknown roles
	}
}

// Export default handler for direct use
export default createClerkWebhook()
