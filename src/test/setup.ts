/**
 * Vitest setup file
 *
 * This file runs before each test file and sets up global test utilities.
 */
import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock console methods to reduce noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Restore console in afterEach if needed for debugging
beforeEach(() => {
	vi.clearAllMocks()
})
