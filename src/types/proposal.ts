/**
 * Proposal Types
 *
 * Type definitions for B2B proposals, which allow users to share cart items
 * with external stakeholders for approval before converting to orders.
 */

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

export interface ProposalItem {
	id: string
	proposal_id: string
	product_name: string
	product_sku?: string
	quantity: number
	unit_price: number
	monthly_price?: number
	specs?: Record<string, string>
}

export interface Proposal {
	id: string
	account_id: string
	created_by_user_id: string
	title: string
	status: ProposalStatus
	recipient_email?: string
	recipient_name?: string
	share_token?: string
	expires_at?: Date | string
	approved_at?: Date | string
	converted_to_order_id?: string
	subtotal?: number
	notes?: string
	created_at: Date | string
	updated_at: Date | string
}

export interface ProposalWithItems extends Proposal {
	items: ProposalItem[]
}

/**
 * Request payload for creating a new proposal
 */
export interface CreateProposalRequest {
	title: string
	recipient_name: string
	recipient_email: string
	expires_at?: string // ISO date string
	notes?: string
	items: Array<{
		product_name: string
		product_sku?: string
		quantity: number
		unit_price: number
		monthly_price?: number
		specs?: Record<string, string>
	}>
}

/**
 * Response from creating a proposal
 */
export interface CreateProposalResponse {
	proposal: ProposalWithItems
	share_url: string
}

/**
 * Request to send proposal via email
 */
export interface SendProposalRequest {
	proposal_id: string
}

/**
 * Public proposal view (for external recipients)
 */
export interface PublicProposalView {
	id: string
	title: string
	status: ProposalStatus
	recipient_name?: string
	expires_at?: string
	subtotal?: number
	notes?: string
	items: ProposalItem[]
	created_at: string
	is_expired: boolean
}
