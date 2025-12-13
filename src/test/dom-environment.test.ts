/**
 * DOM Environment Tests
 *
 * Verifies that DOM APIs (document, window, localStorage) are available in all tests.
 * These tests validate the Vitest 4.x + happy-dom environment configuration.
 *
 * @REQ-DOM-001 @Document - document API must be available
 * @REQ-DOM-002 @LocalStorage - localStorage API must be available
 * @REQ-DOM-003 @Window - window API must be available
 * @REQ-DOM-004 @AllTests - All DOM APIs work together
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('@REQ-DOM-001 DOM Environment Setup - document API', () => {
	/**
	 * Scenario: document API is available
	 *   Given I have a test that uses document
	 *   When I run the test with bun test
	 *   Then document should be defined
	 *   And document.createElement should work
	 *   And no ReferenceError should occur
	 */
	it('should have document defined', () => {
		expect(document).toBeDefined()
		expect(typeof document).toBe('object')
	})

	it('should be able to create DOM elements', () => {
		const div = document.createElement('div')
		expect(div).toBeDefined()
		expect(div.nodeName).toBe('DIV')
	})

	it('should be able to manipulate DOM elements', () => {
		const div = document.createElement('div')
		div.textContent = 'Hello World'
		expect(div.textContent).toBe('Hello World')

		div.setAttribute('data-testid', 'test')
		expect(div.getAttribute('data-testid')).toBe('test')
	})

	it('should be able to query the document', () => {
		const body = document.body
		expect(body).toBeDefined()
		expect(body.nodeName).toBe('BODY')
	})
})

describe('@REQ-DOM-002 DOM Environment Setup - localStorage API', () => {
	/**
	 * Scenario: localStorage API is available
	 *   Given I have a test that uses localStorage
	 *   When I run the test with bun test
	 *   Then localStorage should be defined
	 *   And localStorage.setItem/getItem should work
	 *   And no ReferenceError should occur
	 */

	beforeEach(() => {
		localStorage.clear()
	})

	it('should have localStorage defined', () => {
		expect(localStorage).toBeDefined()
		expect(typeof localStorage).toBe('object')
	})

	it('should be able to store and retrieve items', () => {
		localStorage.setItem('test-key', 'test-value')
		expect(localStorage.getItem('test-key')).toBe('test-value')
	})

	it('should be able to remove items', () => {
		localStorage.setItem('remove-test', 'value')
		expect(localStorage.getItem('remove-test')).toBe('value')

		localStorage.removeItem('remove-test')
		expect(localStorage.getItem('remove-test')).toBeNull()
	})

	it('should be able to clear all items', () => {
		localStorage.setItem('key1', 'value1')
		localStorage.setItem('key2', 'value2')

		localStorage.clear()

		expect(localStorage.getItem('key1')).toBeNull()
		expect(localStorage.getItem('key2')).toBeNull()
	})
})

describe('@REQ-DOM-003 DOM Environment Setup - window API', () => {
	/**
	 * Scenario: window API is available
	 *   Given I have a test that uses window
	 *   When I run the test with bun test
	 *   Then window should be defined
	 *   And window.location should be accessible
	 *   And no ReferenceError should occur
	 */

	it('should have window defined', () => {
		expect(window).toBeDefined()
		expect(typeof window).toBe('object')
	})

	it('should be able to access window.location', () => {
		expect(window.location).toBeDefined()
		expect(window.location.href).toBeDefined()
	})

	it('should be able to access window.navigator', () => {
		expect(window.navigator).toBeDefined()
		expect(window.navigator.userAgent).toBeDefined()
	})

	it('should be able to access window.document', () => {
		expect(window.document).toBeDefined()
		expect(window.document).toBe(document)
	})
})

describe('@REQ-DOM-004 DOM Environment Setup - All APIs work together', () => {
	/**
	 * Scenario: All existing tests pass with DOM environment
	 *   Given the DOM environment is fixed
	 *   When I run the full test suite
	 *   Then all 489 previously failing tests should pass
	 *   And no new failures should be introduced
	 */

	it('should have all required global DOM APIs available', () => {
		// Core DOM APIs
		expect(typeof document).toBe('object')
		expect(typeof window).toBe('object')
		expect(typeof localStorage).toBe('object')
		expect(typeof sessionStorage).toBe('object')

		// Constructors
		expect(typeof HTMLElement).toBe('function')
		expect(typeof Element).toBe('function')
		expect(typeof Node).toBe('function')
		expect(typeof Event).toBe('function')
	})

	it('should support typical React Testing Library use cases', () => {
		// Simulate what @testing-library/react does
		const container = document.createElement('div')
		document.body.appendChild(container)

		const button = document.createElement('button')
		button.textContent = 'Click me'
		button.addEventListener('click', () => {
			button.setAttribute('data-clicked', 'true')
		})

		container.appendChild(button)

		// Verify DOM manipulation works
		expect(container.querySelector('button')).toBe(button)
		expect(button.textContent).toBe('Click me')

		// Simulate click
		button.click()
		expect(button.getAttribute('data-clicked')).toBe('true')

		// Cleanup
		document.body.removeChild(container)
	})

	it('should persist data across localStorage and sessionStorage', () => {
		const testData = JSON.stringify({ user: 'test', id: 123 })

		localStorage.setItem('app-state', testData)
		sessionStorage.setItem('session-state', testData)

		expect(localStorage.getItem('app-state')).toBe(testData)
		expect(sessionStorage.getItem('session-state')).toBe(testData)

		const parsed = JSON.parse(localStorage.getItem('app-state') || '{}')
		expect(parsed.user).toBe('test')
		expect(parsed.id).toBe(123)
	})
})
