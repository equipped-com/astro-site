/**
 * Proposal API Routes
 *
 * Handles B2B proposal creation, viewing, and management.
 * Proposals allow users to share cart items with external stakeholders for approval.
 */

import { Hono } from 'hono'
import {
	generateProposalId,
	generateProposalItemId,
	generateProposalShareUrl,
	generateProposalToken,
	isValidProposalToken,
} from '@/lib/proposal-tokens'
import type { CreateProposalRequest, ProposalWithItems, PublicProposalView } from '@/types/proposal'

const proposals = new Hono<{ Bindings: Env }>()

/**
 * POST /api/proposals
 * Create a new proposal from cart items
 *
 * Requires: authentication + account access
 */
proposals.post('/', async c => {
	const userId = c.get('userId')
	const accountId = c.get('accountId')

	if (!userId || !accountId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const body = (await c.req.json()) as CreateProposalRequest

	// Validate required fields
	if (!body.title || !body.recipient_name || !body.recipient_email || !body.items || body.items.length === 0) {
		return c.json(
			{
				error: 'Validation failed',
				message: 'Title, recipient name, recipient email, and items are required',
			},
			400,
		)
	}

	// Generate unique IDs and share token
	const proposalId = generateProposalId()
	const shareToken = generateProposalToken()

	// Calculate subtotal
	const subtotal = body.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

	// Default expiration: 30 days from now
	const expiresAt = body.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

	try {
		// Insert proposal
		await c.env.DB.prepare(
			`INSERT INTO proposals (
				id, account_id, created_by_user_id, title, status,
				recipient_email, recipient_name, share_token, expires_at,
				subtotal, notes, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
		)
			.bind(
				proposalId,
				accountId,
				userId,
				body.title,
				'draft',
				body.recipient_email,
				body.recipient_name,
				shareToken,
				expiresAt,
				subtotal,
				body.notes || null,
			)
			.run()

		// Insert proposal items
		for (const item of body.items) {
			const itemId = generateProposalItemId()
			await c.env.DB.prepare(
				`INSERT INTO proposal_items (
					id, proposal_id, product_name, product_sku,
					quantity, unit_price, monthly_price, specs
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(
					itemId,
					proposalId,
					item.product_name,
					item.product_sku || null,
					item.quantity,
					item.unit_price,
					item.monthly_price || null,
					item.specs ? JSON.stringify(item.specs) : null,
				)
				.run()
		}

		// Fetch the created proposal with items
		const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(proposalId).first()

		const items = await c.env.DB.prepare('SELECT * FROM proposal_items WHERE proposal_id = ?').bind(proposalId).all()

		const proposalWithItems: ProposalWithItems = {
			...(proposal as ProposalWithItems),
			items: items.results.map(item => ({
				...item,
				specs: item.specs ? JSON.parse(item.specs as string) : undefined,
			})),
		}

		// Generate share URL
		const baseDomain = c.env.BASE_DOMAIN || 'tryequipped.com'
		const shareUrl = generateProposalShareUrl(shareToken, baseDomain)

		return c.json(
			{
				proposal: proposalWithItems,
				share_url: shareUrl,
			},
			201,
		)
	} catch (error) {
		console.error('Failed to create proposal:', error)
		return c.json({ error: 'Failed to create proposal' }, 500)
	}
})

/**
 * GET /api/proposals
 * List all proposals for the current account
 *
 * Requires: authentication + account access
 */
proposals.get('/', async c => {
	const accountId = c.get('accountId')

	if (!accountId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const result = await c.env.DB.prepare(
		`SELECT p.*,
			(SELECT COUNT(*) FROM proposal_items WHERE proposal_id = p.id) as item_count
		FROM proposals p
		WHERE p.account_id = ?
		ORDER BY p.created_at DESC`,
	)
		.bind(accountId)
		.all()

	return c.json({ proposals: result.results })
})

/**
 * GET /api/proposals/:id
 * Get a specific proposal with items
 *
 * Requires: authentication + account access
 */
proposals.get('/:id', async c => {
	const accountId = c.get('accountId')
	const proposalId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	// Fetch proposal with account verification
	const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE id = ? AND account_id = ?')
		.bind(proposalId, accountId)
		.first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Fetch proposal items
	const items = await c.env.DB.prepare('SELECT * FROM proposal_items WHERE proposal_id = ?').bind(proposalId).all()

	const proposalWithItems: ProposalWithItems = {
		...(proposal as ProposalWithItems),
		items: items.results.map(item => ({
			...item,
			specs: item.specs ? JSON.parse(item.specs as string) : undefined,
		})),
	}

	return c.json({ proposal: proposalWithItems })
})

/**
 * POST /api/proposals/:id/send
 * Mark proposal as sent and send email notification
 *
 * Requires: authentication + account access
 */
proposals.post('/:id/send', async c => {
	const accountId = c.get('accountId')
	const proposalId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	// Fetch proposal with account verification
	const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE id = ? AND account_id = ?')
		.bind(proposalId, accountId)
		.first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Update status to 'sent'
	await c.env.DB.prepare('UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
		.bind('sent', proposalId)
		.run()

	// TODO: Send email notification via CloudFlare Email Workers or third-party service
	// For now, just return success

	return c.json({ success: true, message: 'Proposal sent' })
})

/**
 * DELETE /api/proposals/:id
 * Delete a proposal and all its items
 *
 * Requires: authentication + account access
 */
proposals.delete('/:id', async c => {
	const accountId = c.get('accountId')
	const proposalId = c.req.param('id')

	if (!accountId) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	// Verify proposal belongs to account
	const proposal = await c.env.DB.prepare('SELECT id FROM proposals WHERE id = ? AND account_id = ?')
		.bind(proposalId, accountId)
		.first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Delete proposal (items cascade via foreign key)
	await c.env.DB.prepare('DELETE FROM proposals WHERE id = ?').bind(proposalId).run()

	return c.json({ success: true })
})

/**
 * GET /api/proposals/public/:token
 * Public view of a proposal via share token (no auth required)
 *
 * This endpoint is PUBLIC and does not require authentication.
 */
proposals.get('/public/:token', async c => {
	const token = c.req.param('token')

	// Validate token format
	if (!isValidProposalToken(token)) {
		return c.json({ error: 'Invalid token' }, 400)
	}

	// Fetch proposal by share token
	const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE share_token = ?').bind(token).first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Check if expired
	const expiresAt = proposal.expires_at ? new Date(proposal.expires_at as string) : null
	const isExpired = expiresAt ? expiresAt < new Date() : false

	// If first view, update status to 'viewed'
	if (proposal.status === 'sent') {
		await c.env.DB.prepare('UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
			.bind('viewed', proposal.id)
			.run()
	}

	// Fetch proposal items
	const items = await c.env.DB.prepare('SELECT * FROM proposal_items WHERE proposal_id = ?').bind(proposal.id).all()

	const publicView: PublicProposalView = {
		id: proposal.id as string,
		title: proposal.title as string,
		status: proposal.status as PublicProposalView['status'],
		recipient_name: proposal.recipient_name as string | undefined,
		expires_at: proposal.expires_at as string | undefined,
		subtotal: proposal.subtotal as number | undefined,
		notes: proposal.notes as string | undefined,
		items: items.results.map(item => ({
			...item,
			specs: item.specs ? JSON.parse(item.specs as string) : undefined,
		})),
		created_at: proposal.created_at as string,
		is_expired: isExpired,
	}

	return c.json({ proposal: publicView })
})

/**
 * POST /api/proposals/public/:token/approve
 * Approve a proposal (public endpoint, no auth required)
 */
proposals.post('/public/:token/approve', async c => {
	const token = c.req.param('token')

	// Validate token format
	if (!isValidProposalToken(token)) {
		return c.json({ error: 'Invalid token' }, 400)
	}

	// Fetch proposal by share token
	const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE share_token = ?').bind(token).first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Check if expired
	const expiresAt = proposal.expires_at ? new Date(proposal.expires_at as string) : null
	const isExpired = expiresAt ? expiresAt < new Date() : false

	if (isExpired) {
		return c.json({ error: 'Proposal has expired' }, 400)
	}

	// Update status to 'approved'
	await c.env.DB.prepare(
		'UPDATE proposals SET status = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
	)
		.bind('approved', proposal.id)
		.run()

	return c.json({ success: true, message: 'Proposal approved' })
})

/**
 * POST /api/proposals/public/:token/decline
 * Decline a proposal (public endpoint, no auth required)
 */
proposals.post('/public/:token/decline', async c => {
	const token = c.req.param('token')

	// Validate token format
	if (!isValidProposalToken(token)) {
		return c.json({ error: 'Invalid token' }, 400)
	}

	// Fetch proposal by share token
	const proposal = await c.env.DB.prepare('SELECT * FROM proposals WHERE share_token = ?').bind(token).first()

	if (!proposal) {
		return c.json({ error: 'Proposal not found' }, 404)
	}

	// Update status to 'declined'
	await c.env.DB.prepare('UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
		.bind('declined', proposal.id)
		.run()

	return c.json({ success: true, message: 'Proposal declined' })
})

export default proposals
