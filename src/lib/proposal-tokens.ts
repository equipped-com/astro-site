/**
 * Proposal Token Generation
 *
 * Generates cryptographically secure, URL-safe tokens for shareable proposal links.
 * Tokens are unique identifiers stored in proposals.share_token for public access.
 */

/**
 * Generate a cryptographically secure random token
 * Returns a URL-safe base64 string (32 characters)
 */
export function generateProposalToken(): string {
	// Generate 24 random bytes (192 bits of entropy)
	const bytes = new Uint8Array(24)
	crypto.getRandomValues(bytes)

	// Convert to base64 and make URL-safe
	const base64 = btoa(String.fromCharCode(...bytes))
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Generate proposal share URL for a given token
 * Uses proposals subdomain for clean, shareable links
 * @param token - The proposal share token
 * @param baseDomain - Base domain (default: tryequipped.com)
 * @returns Full proposal share URL
 */
export function generateProposalShareUrl(token: string, baseDomain = 'tryequipped.com'): string {
	return `https://proposals.${baseDomain}/${token}`
}

/**
 * Generate a unique proposal ID
 * Format: prop_{timestamp}_{random}
 */
export function generateProposalId(): string {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 9)
	return `prop_${timestamp}_${random}`
}

/**
 * Generate a unique proposal item ID
 * Format: pitem_{timestamp}_{random}
 */
export function generateProposalItemId(): string {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 9)
	return `pitem_${timestamp}_${random}`
}

/**
 * Validate proposal token format (should be 32 URL-safe base64 chars)
 */
export function isValidProposalToken(token: string): boolean {
	// Check length and URL-safe base64 characters only
	return /^[A-Za-z0-9_-]{32}$/.test(token)
}
