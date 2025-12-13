/**
 * DOM Environment Setup for Vitest
 *
 * Ensures DOM APIs (document, window, localStorage) are available in all tests.
 *
 * Vitest 4.x changed how environment setup works. Even with environment: 'happy-dom'
 * in vitest.config.ts, the DOM APIs may not be globally available without explicit setup.
 *
 * This file forces happy-dom to initialize before any tests run.
 */

import { Window } from 'happy-dom'
import { beforeEach, vi } from 'vitest'

// Create happy-dom window instance with standard options
const window = new Window({ url: 'http://localhost:3000' })

// Populate global scope with DOM APIs
globalThis.window = window as any
globalThis.document = window.document as any

// Use Object.defineProperty for read-only properties
Object.defineProperty(globalThis, 'navigator', {
	value: window.navigator,
	writable: true,
	configurable: true,
})

globalThis.localStorage = window.localStorage as any
globalThis.sessionStorage = window.sessionStorage as any
globalThis.HTMLElement = window.HTMLElement as any
globalThis.Element = window.Element as any
globalThis.Node = window.Node as any
globalThis.Text = window.Text as any
globalThis.Comment = window.Comment as any
globalThis.DocumentFragment = window.DocumentFragment as any
globalThis.HTMLDivElement = window.HTMLDivElement as any
globalThis.HTMLSpanElement = window.HTMLSpanElement as any
globalThis.HTMLButtonElement = window.HTMLButtonElement as any
globalThis.HTMLInputElement = window.HTMLInputElement as any
globalThis.HTMLFormElement = window.HTMLFormElement as any
globalThis.Event = window.Event as any
globalThis.MouseEvent = window.MouseEvent as any
globalThis.KeyboardEvent = window.KeyboardEvent as any
globalThis.CustomEvent = window.CustomEvent as any

// Mock browser dialog APIs (confirm, alert, prompt)
// These are missing in JSDOM/happy-dom environments
globalThis.confirm = vi.fn(() => true)
globalThis.alert = vi.fn()
globalThis.prompt = vi.fn(() => '')

// Reset mocks before each test for isolation
beforeEach(() => {
	vi.mocked(global.confirm).mockReturnValue(true)
	vi.mocked(global.alert).mockClear()
	vi.mocked(global.prompt).mockReturnValue('')
})
