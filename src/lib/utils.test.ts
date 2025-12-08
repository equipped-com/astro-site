import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
	it('should merge class names correctly', () => {
		const result = cn('text-red-500', 'bg-blue-500')
		expect(result).toContain('text-red-500')
		expect(result).toContain('bg-blue-500')
	})

	it('should handle conditional classes', () => {
		const isActive = true
		const result = cn('base-class', isActive && 'active-class')
		expect(result).toContain('base-class')
		expect(result).toContain('active-class')
	})

	it('should not include false conditional classes', () => {
		const isActive = false
		const result = cn('base-class', isActive && 'active-class')
		expect(result).toContain('base-class')
		expect(result).not.toContain('active-class')
	})

	it('should merge conflicting Tailwind classes correctly', () => {
		const result = cn('p-4', 'p-8')
		expect(result).toBe('p-8')
	})

	it('should handle arrays of class names', () => {
		const result = cn(['text-red-500', 'bg-blue-500'])
		expect(result).toContain('text-red-500')
		expect(result).toContain('bg-blue-500')
	})

	it('should handle empty inputs', () => {
		const result = cn()
		expect(result).toBe('')
	})

	it('should filter out null and undefined', () => {
		const result = cn('base-class', null, undefined, 'other-class')
		expect(result).toContain('base-class')
		expect(result).toContain('other-class')
		expect(result).not.toContain('null')
		expect(result).not.toContain('undefined')
	})
})
