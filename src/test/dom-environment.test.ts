/**
 * DOM Environment Tests
 *
 * @REQ-DOM-001 @Document
 * @REQ-DOM-002 @LocalStorage
 * @REQ-DOM-003 @Window
 * @REQ-DOM-004 @AllTests
 *
 * Verifies that DOM APIs are available in all tests.
 * These tests should pass if the DOM environment is properly configured.
 */

import { describe, it, expect } from 'vitest'

describe('DOM Environment Setup', () => {
	describe('@REQ-DOM-001 document API is available', () => {
		it('should have document defined', () => {
			expect(document).toBeDefined()
		})

		it('should be able to use document.createElement', () => {
			const div = document.createElement('div')
			expect(div).toBeDefined()
			expect(div.nodeName).toBe('DIV')
		})

		it('should be able to manipulate the DOM', () => {
			const div = document.createElement('div')
			div.textContent = 'Hello World'
			expect(div.textContent).toBe('Hello World')
		})
	})

	describe('@REQ-DOM-002 localStorage API is available', () => {
		it('should have localStorage defined', () => {
			expect(localStorage).toBeDefined()
		})

		it('should be able to use localStorage.setItem', () => {
			localStorage.setItem('test-key', 'test-value')
			expect(localStorage.getItem('test-key')).toBe('test-value')
		})

		it('should be able to use localStorage.removeItem', () => {
			localStorage.setItem('remove-test', 'value')
			localStorage.removeItem('remove-test')
			expect(localStorage.getItem('remove-test')).toBeNull()
		})
	})

	describe('@REQ-DOM-003 window API is available', () => {
		it('should have window defined', () => {
			expect(window).toBeDefined()
		})

		it('should be able to access window.location', () => {
			expect(window.location).toBeDefined()
			expect(window.location.href).toBeDefined()
		})

		it('should be able to access window.navigator', () => {
			expect(window.navigator).toBeDefined()
		})
	})

	describe('@REQ-DOM-004 All DOM APIs work together', () => {
		it('should have all required global DOM APIs', () => {
			// Document
			expect(typeof document).toBe('object')
			expect(document.createElement).toBeInstanceOf(Function)

			// Window
			expect(typeof window).toBe('object')
			expect(window.location).toBeDefined()

			// Storage
			expect(typeof localStorage).toBe('object')
			expect(typeof sessionStorage).toBe('object')

			// Constructors
			expect(typeof HTMLElement).toBe('function')
			expect(typeof Element).toBe('function')
			expect(typeof Node).toBe('function')
		})
	})
})
