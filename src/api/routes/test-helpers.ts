/**
 * Shared test helpers for API route tests.
 *
 * Uses auth injection pattern - middleware sets clerkAuth context
 * that getAuth() reads, allowing full control over auth state in tests.
 */

import { Hono } from 'hono'
import { vi } from 'vitest'

export interface MockDb {
	prepare: ReturnType<typeof vi.fn>
}

export interface MockAuth {
	userId?: string
	sessionId?: string
}

export interface TestAppOptions<TRoutes> {
	routes: TRoutes
	db: MockDb
	auth?: MockAuth
	/** Additional context variables to set (e.g., accountId, role) */
	context?: Record<string, unknown>
}

/**
 * Create test app with injected auth context.
 *
 * This mimics what clerkMiddleware() does - it sets c.clerkAuth
 * which getAuth() then reads. By injecting this ourselves, we can:
 * - Control auth state per-test
 * - Verify auth was checked
 * - Test unauthenticated scenarios
 */
export function createTestApp<TRoutes extends Hono>({
	routes,
	db,
	auth = { userId: 'user_123', sessionId: 'session_123' },
	context = {},
}: TestAppOptions<TRoutes>) {
	const authCallTracker = vi.fn()

	const app = new Hono()

	app.use('*', async (c, next) => {
		// Inject DB
		c.env = { DB: db } as unknown as typeof c.env

		// Inject auth context - this is what clerkMiddleware() does
		// getAuth(c) internally calls c.get('clerkAuth')()
		c.set('clerkAuth', () => {
			authCallTracker()
			return auth
		})

		// Inject additional context variables
		for (const [key, value] of Object.entries(context)) {
			c.set(key, value)
		}

		return next()
	})

	app.route('/', routes)

	return { app, authCallTracker }
}

/**
 * Create a mock DB with common patterns.
 */
export function createMockDb(handlers: {
	first?: (query: string, params: unknown[]) => Promise<unknown>
	all?: (query: string, params: unknown[]) => Promise<{ results: unknown[] }>
	run?: (query: string, params: unknown[]) => Promise<{ success: boolean }>
}): MockDb {
	let lastParams: unknown[] = []

	return {
		prepare: vi.fn((query: string) => ({
			bind: vi.fn((...params: unknown[]) => {
				lastParams = params
				return {
					first: vi.fn(() => handlers.first?.(query, lastParams) ?? null),
					all: vi.fn(() => handlers.all?.(query, lastParams) ?? { results: [] }),
					run: vi.fn(() => handlers.run?.(query, lastParams) ?? { success: true }),
				}
			}),
		})),
	}
}
