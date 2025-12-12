/**
 * Test Helpers - Render with Providers
 *
 * Provides utilities for rendering React components with common providers
 * and mocks for testing.
 */
import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import * as impersonationLib from '@/lib/impersonation'

// Mock session data for impersonation tests
export const mockImpersonationSession: impersonationLib.ImpersonationSession = {
	adminUserId: 'user_admin123',
	adminEmail: 'admin@tryequipped.com',
	adminName: 'Test Admin',
	accountId: 'acc_customer456',
	accountName: 'Test Corp',
	accountShortName: 'testcorp',
	startedAt: new Date().toISOString(),
}

// Default fetch mock that resolves successfully
export function createFetchMock(responses: Array<{ ok: boolean; data: unknown }>) {
	let callIndex = 0
	return vi.fn(() => {
		const response = responses[callIndex] || responses[responses.length - 1]
		callIndex++
		return Promise.resolve({
			ok: response.ok,
			json: () => Promise.resolve(response.data),
		})
	})
}

// Setup impersonation mock
export function setupImpersonationMock(session: impersonationLib.ImpersonationSession | null = null) {
	vi.mocked(impersonationLib.getImpersonationSession).mockReturnValue(session)
	vi.mocked(impersonationLib.endImpersonationSession).mockImplementation(() => {})
	vi.mocked(impersonationLib.getAdminDashboardUrl).mockReturnValue('/admin')
}

// Mock window.location
export function mockWindowLocation(href = '') {
	const originalLocation = window.location
	Object.defineProperty(window, 'location', {
		value: { href },
		writable: true,
		configurable: true,
	})
	return () => {
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
			configurable: true,
		})
	}
}

// Provider wrapper for tests
interface WrapperProps {
	children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
	// Add any providers needed for tests here
	// e.g., <AuthProvider>, <ThemeProvider>, etc.
	return <>{children}</>
}

// Custom render function with providers
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
	return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react'
export { renderWithProviders as render }
