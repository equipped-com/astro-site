/**
 * Tenant Middleware Tests
 *
 * Tests for subdomain extraction, tenant resolution, and reserved subdomain handling.
 *
 * @REQ-TENANT-001 - Subdomain extraction from host
 * @REQ-TENANT-002 - Tenant lookup from database
 * @REQ-TENANT-003 - Reserved subdomains handled
 * @REQ-TENANT-004 - Unknown tenant returns 404
 * @REQ-TENANT-005 - www subdomain redirects
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractSubdomain, RESERVED_SUBDOMAINS, requireTenant, tenantMiddleware } from './tenant'

// Mock D1 database types
interface MockD1PreparedStatement {
	bind: (...values: unknown[]) => MockD1PreparedStatement
	run: () => Promise<{ results: unknown[]; success: boolean; meta: { changes?: number } }>
	first: <T>() => Promise<T | null>
}

interface MockD1Database {
	prepare: (query: string) => MockD1PreparedStatement
}

// Mock account data
const mockAccount = {
	id: 'acct_acme',
	short_name: 'acme',
	name: 'Acme Corporation',
	billing_email: 'billing@acme.com',
	stripe_customer_id: 'cus_123',
	created_at: '2024-01-01T00:00:00Z',
}

// Helper to create mock Hono context
function createMockContext(overrides?: {
	host?: string
	url?: string
	db?: MockD1Database | null
	dbResult?: unknown
}) {
	const values = new Map<string, unknown>()

	// Default mock database
	const mockStatement: MockD1PreparedStatement = {
		bind: vi.fn().mockReturnThis(),
		run: vi.fn().mockResolvedValue({ results: [], success: true, meta: { changes: 1 } }),
		first: vi.fn().mockResolvedValue(overrides?.dbResult ?? null),
	}

	const mockDb: MockD1Database = {
		prepare: vi.fn().mockReturnValue(mockStatement),
	}

	const env = {
		DB: overrides?.db === null ? undefined : (overrides?.db ?? mockDb),
	}

	return {
		req: {
			header: vi.fn((key: string) => {
				if (key === 'host') return overrides?.host ?? 'tryequipped.com'
				return undefined
			}),
			url: overrides?.url ?? 'https://tryequipped.com/',
		},
		get: vi.fn((key: string) => values.get(key)),
		set: vi.fn((key: string, value: unknown) => values.set(key, value)),
		json: vi.fn((body: unknown, status?: number) => ({ body, status: status ?? 200 })),
		redirect: vi.fn((url: string, status?: number) => ({ redirectUrl: url, status: status ?? 302 })),
		env,
		_values: values,
	}
}

// Mock next function
function createMockNext() {
	return vi.fn().mockResolvedValue(undefined)
}

describe('Tenant Middleware', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	/**
	 * Feature: Subdomain Extraction
	 *
	 * @REQ-TENANT-001 - Subdomain extraction from host
	 */
	describe('extractSubdomain()', () => {
		describe('production domain (tryequipped.com)', () => {
			it('should extract subdomain from acme.tryequipped.com', () => {
				expect(extractSubdomain('acme.tryequipped.com')).toBe('acme')
			})

			it('should extract subdomain from test-org.tryequipped.com', () => {
				expect(extractSubdomain('test-org.tryequipped.com')).toBe('test-org')
			})

			it('should return null for root domain tryequipped.com', () => {
				expect(extractSubdomain('tryequipped.com')).toBe(null)
			})
		})

		describe('preview domain (tryequipped.preview.frst.dev)', () => {
			it('should extract subdomain from acme.tryequipped.preview.frst.dev', () => {
				expect(extractSubdomain('acme.tryequipped.preview.frst.dev')).toBe('acme')
			})

			it('should extract subdomain from test-org.tryequipped.preview.frst.dev', () => {
				expect(extractSubdomain('test-org.tryequipped.preview.frst.dev')).toBe('test-org')
			})
		})

		describe('localhost (development)', () => {
			it('should return null for localhost', () => {
				expect(extractSubdomain('localhost')).toBe(null)
			})

			it('should return null for localhost:4321', () => {
				expect(extractSubdomain('localhost:4321')).toBe(null)
			})
		})

		describe('port handling', () => {
			it('should extract subdomain from acme.tryequipped.com:443', () => {
				expect(extractSubdomain('acme.tryequipped.com:443')).toBe('acme')
			})

			it('should extract subdomain from acme.tryequipped.com:8080', () => {
				expect(extractSubdomain('acme.tryequipped.com:8080')).toBe('acme')
			})
		})

		describe('edge cases', () => {
			it('should return null for single segment', () => {
				expect(extractSubdomain('example')).toBe(null)
			})

			it('should return null for two segments (bare domain)', () => {
				expect(extractSubdomain('example.com')).toBe(null)
			})

			it('should extract subdomain from generic three-segment domain', () => {
				expect(extractSubdomain('sub.example.com')).toBe('sub')
			})
		})
	})

	/**
	 * Feature: Reserved Subdomains
	 *
	 * @REQ-TENANT-003 - Reserved subdomains handled
	 */
	describe('RESERVED_SUBDOMAINS', () => {
		it('should contain www', () => {
			expect(RESERVED_SUBDOMAINS.has('www')).toBe(true)
		})

		it('should contain admin', () => {
			expect(RESERVED_SUBDOMAINS.has('admin')).toBe(true)
		})

		it('should contain api', () => {
			expect(RESERVED_SUBDOMAINS.has('api')).toBe(true)
		})

		it('should contain app', () => {
			expect(RESERVED_SUBDOMAINS.has('app')).toBe(true)
		})

		it('should contain webhooks', () => {
			expect(RESERVED_SUBDOMAINS.has('webhooks')).toBe(true)
		})

		it('should contain billing', () => {
			expect(RESERVED_SUBDOMAINS.has('billing')).toBe(true)
		})

		it('should contain cdn', () => {
			expect(RESERVED_SUBDOMAINS.has('cdn')).toBe(true)
		})

		it('should contain help', () => {
			expect(RESERVED_SUBDOMAINS.has('help')).toBe(true)
		})

		it('should contain shop', () => {
			expect(RESERVED_SUBDOMAINS.has('shop')).toBe(true)
		})

		it('should contain store', () => {
			expect(RESERVED_SUBDOMAINS.has('store')).toBe(true)
		})

		it('should contain support', () => {
			expect(RESERVED_SUBDOMAINS.has('support')).toBe(true)
		})

		it('should not contain regular tenant names', () => {
			expect(RESERVED_SUBDOMAINS.has('acme')).toBe(false)
			expect(RESERVED_SUBDOMAINS.has('test-company')).toBe(false)
		})
	})

	/**
	 * Feature: Tenant Resolution
	 *
	 * @REQ-TENANT-002 - Tenant lookup from database
	 */
	describe('tenantMiddleware()', () => {
		describe('root domain (no subdomain)', () => {
			it('should set subdomain to null and proceed', async () => {
				const c = createMockContext({ host: 'tryequipped.com' })
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(c.set).toHaveBeenCalledWith('subdomain', null)
				expect(c.set).toHaveBeenCalledWith('isReservedSubdomain', false)
				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should not query database for root domain', async () => {
				const mockStatement: MockD1PreparedStatement = {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
					first: vi.fn().mockResolvedValue(null),
				}
				const mockDb: MockD1Database = {
					prepare: vi.fn().mockReturnValue(mockStatement),
				}

				const c = createMockContext({ host: 'tryequipped.com', db: mockDb })
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(mockDb.prepare).not.toHaveBeenCalled()
			})
		})

		/**
		 * @REQ-TENANT-005 - www subdomain redirects
		 * Scenario: www subdomain redirects to root
		 *   Given user visits www.tryequipped.com
		 *   When tenant middleware processes
		 *   Then 301 redirect to tryequipped.com
		 */
		describe('www subdomain redirect', () => {
			it('should redirect www.tryequipped.com to tryequipped.com', async () => {
				const c = createMockContext({
					host: 'www.tryequipped.com',
					url: 'https://www.tryequipped.com/page',
				})
				const next = createMockNext()
				const middleware = tenantMiddleware()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(301)
				expect(result.redirectUrl).toContain('tryequipped.com/page')
				expect(result.redirectUrl).not.toContain('www.')
				expect(next).not.toHaveBeenCalled()
			})
		})

		/**
		 * @REQ-TENANT-003 - Reserved subdomains handled
		 * Scenario: Reserved subdomains skip tenant lookup
		 */
		describe('reserved subdomains', () => {
			it('should set isReservedSubdomain for admin subdomain', async () => {
				const c = createMockContext({ host: 'admin.tryequipped.com' })
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(c.set).toHaveBeenCalledWith('subdomain', 'admin')
				expect(c.set).toHaveBeenCalledWith('isReservedSubdomain', true)
				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should not query database for reserved subdomains', async () => {
				const mockStatement: MockD1PreparedStatement = {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
					first: vi.fn().mockResolvedValue(null),
				}
				const mockDb: MockD1Database = {
					prepare: vi.fn().mockReturnValue(mockStatement),
				}

				const c = createMockContext({ host: 'api.tryequipped.com', db: mockDb })
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(mockDb.prepare).not.toHaveBeenCalled()
				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should handle all reserved subdomains', async () => {
				const reserved = ['admin', 'api', 'app', 'billing', 'cdn', 'help', 'shop', 'store', 'support', 'webhooks']

				for (const subdomain of reserved) {
					const c = createMockContext({ host: `${subdomain}.tryequipped.com` })
					const next = createMockNext()
					const middleware = tenantMiddleware()

					await middleware(c as any, next)

					expect(c.set).toHaveBeenCalledWith('isReservedSubdomain', true)
					expect(next).toHaveBeenCalledTimes(1)
				}
			})
		})

		/**
		 * @REQ-TENANT-002 - Tenant lookup from database
		 * Scenario: Valid tenant subdomain resolves account
		 */
		describe('tenant lookup', () => {
			it('should look up and set account context for valid tenant', async () => {
				const c = createMockContext({
					host: 'acme.tryequipped.com',
					dbResult: mockAccount,
				})
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(c.set).toHaveBeenCalledWith('subdomain', 'acme')
				expect(c.set).toHaveBeenCalledWith('isReservedSubdomain', false)
				expect(c.set).toHaveBeenCalledWith('account', mockAccount)
				expect(c.set).toHaveBeenCalledWith('accountId', 'acct_acme')
				expect(next).toHaveBeenCalledTimes(1)
			})

			it('should query database with correct subdomain', async () => {
				const mockStatement: MockD1PreparedStatement = {
					bind: vi.fn().mockReturnThis(),
					run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
					first: vi.fn().mockResolvedValue(mockAccount),
				}
				const mockDb: MockD1Database = {
					prepare: vi.fn().mockReturnValue(mockStatement),
				}

				const c = createMockContext({ host: 'acme.tryequipped.com', db: mockDb })
				const next = createMockNext()
				const middleware = tenantMiddleware()

				await middleware(c as any, next)

				expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM accounts WHERE short_name = ?')
				expect(mockStatement.bind).toHaveBeenCalledWith('acme')
			})
		})

		/**
		 * @REQ-TENANT-004 - Unknown tenant returns 404
		 * Scenario: Unknown subdomain returns 404
		 */
		describe('unknown tenant', () => {
			it('should return 404 for unknown subdomain', async () => {
				const c = createMockContext({
					host: 'nonexistent.tryequipped.com',
					dbResult: null, // Account not found
				})
				const next = createMockNext()
				const middleware = tenantMiddleware()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(404)
				expect(result.body).toEqual({
					error: 'Account not found',
					message: 'No account exists with subdomain "nonexistent"',
				})
				expect(next).not.toHaveBeenCalled()
			})
		})

		describe('database unavailable', () => {
			it('should return 503 when database is not configured', async () => {
				const c = createMockContext({
					host: 'acme.tryequipped.com',
					db: null,
				})
				const next = createMockNext()
				const middleware = tenantMiddleware()

				const result = await middleware(c as any, next)

				expect(result.status).toBe(503)
				expect(result.body.error).toBe('Service unavailable')
				expect(next).not.toHaveBeenCalled()
			})
		})
	})

	/**
	 * Feature: Require Tenant Middleware
	 */
	describe('requireTenant()', () => {
		it('should proceed when accountId is set', async () => {
			const c = createMockContext()
			c._values.set('accountId', 'acct_acme')
			const next = createMockNext()
			const middleware = requireTenant()

			await middleware(c as any, next)

			expect(next).toHaveBeenCalledTimes(1)
		})

		it('should return 400 when accountId is not set', async () => {
			const c = createMockContext()
			// No accountId set
			const next = createMockNext()
			const middleware = requireTenant()

			const result = await middleware(c as any, next)

			expect(result.status).toBe(400)
			expect(result.body).toEqual({
				error: 'Account context required',
				message: 'This endpoint requires an account context from subdomain',
			})
			expect(next).not.toHaveBeenCalled()
		})
	})

	/**
	 * Feature: Multi-Account Context
	 *
	 * Scenario: Multi-account access works correctly
	 *   Given a user with access to multiple accounts
	 *   When switching accounts (changing subdomain)
	 *   Then resources are scoped correctly
	 */
	describe('Multi-Account Context Isolation', () => {
		it('should set correct account context for different subdomains', async () => {
			// Account A
			const accountA = { ...mockAccount, id: 'acct_a', short_name: 'alpha' }
			const cA = createMockContext({ host: 'alpha.tryequipped.com', dbResult: accountA })
			const nextA = createMockNext()
			const middleware = tenantMiddleware()

			await middleware(cA as any, nextA)

			expect(cA.set).toHaveBeenCalledWith('accountId', 'acct_a')
			expect(cA.set).toHaveBeenCalledWith('account', accountA)

			// Account B
			const accountB = { ...mockAccount, id: 'acct_b', short_name: 'beta' }
			const cB = createMockContext({ host: 'beta.tryequipped.com', dbResult: accountB })
			const nextB = createMockNext()

			await middleware(cB as any, nextB)

			expect(cB.set).toHaveBeenCalledWith('accountId', 'acct_b')
			expect(cB.set).toHaveBeenCalledWith('account', accountB)
		})

		it('should isolate account context between requests', async () => {
			// This tests that each request gets its own context - critical for multi-tenant
			const accountA = { ...mockAccount, id: 'acct_a', short_name: 'alpha' }
			const accountB = { ...mockAccount, id: 'acct_b', short_name: 'beta' }

			// Simulate two concurrent requests to different accounts
			const contexts = [
				createMockContext({ host: 'alpha.tryequipped.com', dbResult: accountA }),
				createMockContext({ host: 'beta.tryequipped.com', dbResult: accountB }),
			]

			const middleware = tenantMiddleware()

			// Process both
			await Promise.all(contexts.map(c => middleware(c as any, createMockNext())))

			// Verify each has correct isolated context
			const setCallsA = (contexts[0].set as any).mock.calls
			const setCallsB = (contexts[1].set as any).mock.calls

			const accountIdCallA = setCallsA.find((c: unknown[]) => c[0] === 'accountId')
			const accountIdCallB = setCallsB.find((c: unknown[]) => c[0] === 'accountId')

			expect(accountIdCallA[1]).toBe('acct_a')
			expect(accountIdCallB[1]).toBe('acct_b')
		})
	})
})
