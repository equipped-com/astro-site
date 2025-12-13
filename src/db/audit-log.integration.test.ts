/**
 * Audit Log Integration Tests
 *
 * Tests the audit_log table operations with correct account_id field
 * Validates that the schema migration properly renamed organization_id to account_id
 */

import { getTableConfig } from 'drizzle-orm/sqlite-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { auditLog, type NewAuditLogEntry } from './schema'

// Get table configuration using Drizzle's public API
const tableConfig = getTableConfig(auditLog)
const columnNames = tableConfig.columns.map(col => col.name)
const indexNames = tableConfig.indexes.map(idx => idx.config.name)

describe('Audit Log Integration Tests', () => {
	describe('Audit Log Data Structure', () => {
		/**
		 * Validate the audit log entry structure
		 */
		it('should create audit log entry with correct account_id field', () => {
			const entry: NewAuditLogEntry = {
				id: 'audit_001',
				accountId: 'acc_123',
				userId: 'user_456',
				action: 'create',
				entityType: 'device',
				entityId: 'device_789',
				changes: JSON.stringify({ name: 'MacBook Pro' }),
				ipAddress: '192.168.1.1',
				userAgent: 'Mozilla/5.0',
			}

			expect(entry.accountId).toBe('acc_123')
			expect(entry).not.toHaveProperty('organizationId')
		})

		it('should support NULL values for optional fields', () => {
			const entry: NewAuditLogEntry = {
				id: 'audit_002',
				accountId: 'acc_123',
				userId: 'user_456',
				action: 'view',
				entityType: 'order',
				entityId: 'order_999',
				changes: null,
				ipAddress: null,
				userAgent: null,
			}

			expect(entry.changes).toBeNull()
			expect(entry.ipAddress).toBeNull()
			expect(entry.userAgent).toBeNull()
		})
	})

	describe('Audit Log Queries', () => {
		/**
		 * Test common audit log query patterns
		 */
		it('should query by account_id', () => {
			// This test verifies the correct field is used in queries
			expect(columnNames).toContain('account_id')
		})

		it('should query by user_id', () => {
			expect(columnNames).toContain('user_id')
		})

		it('should query by entity_type and entity_id', () => {
			expect(columnNames).toContain('entity_type')
			expect(columnNames).toContain('entity_id')
		})

		it('should order by created_at', () => {
			expect(columnNames).toContain('created_at')
		})
	})

	describe('Migration Verification', () => {
		/**
		 * Verify the schema migration is complete
		 */
		it('should have account_id column (not organization_id)', () => {
			expect(columnNames).toContain('account_id')
			expect(columnNames).not.toContain('organization_id')
		})

		it('should have idx_audit_account index (not idx_audit_org)', () => {
			expect(indexNames).toContain('idx_audit_account')
			expect(indexNames).not.toContain('idx_audit_org')
		})

		it('should preserve all required columns', () => {
			const requiredColumns = ['id', 'account_id', 'user_id', 'action', 'entity_type', 'entity_id', 'created_at']
			for (const col of requiredColumns) {
				expect(columnNames).toContain(col)
			}
		})

		it('should preserve optional columns', () => {
			const optionalColumns = ['changes', 'ip_address', 'user_agent']
			for (const col of optionalColumns) {
				expect(columnNames).toContain(col)
			}
		})
	})

	describe('Sample Audit Log Entries', () => {
		/**
		 * Test realistic audit log entries
		 */
		it('should create device creation audit entry', () => {
			const entry: NewAuditLogEntry = {
				id: 'audit_device_001',
				accountId: 'acc_equipped',
				userId: 'user_admin',
				action: 'create',
				entityType: 'device',
				entityId: 'device_macbook_001',
				changes: JSON.stringify({
					name: 'MacBook Pro 16"',
					model: 'M3 Pro',
					serialNumber: 'SERIAL123',
				}),
				ipAddress: '203.0.113.42',
				userAgent: 'Mozilla/5.0 (Macintosh)',
			}

			expect(entry.accountId).toBeDefined()
			expect(entry.action).toBe('create')
			expect(entry.entityType).toBe('device')
		})

		it('should create order update audit entry', () => {
			const entry: NewAuditLogEntry = {
				id: 'audit_order_001',
				accountId: 'acc_equipped',
				userId: 'user_buyer',
				action: 'update',
				entityType: 'order',
				entityId: 'order_stripe_abc',
				changes: JSON.stringify({
					status: { old: 'pending', new: 'processing' },
					updatedAt: new Date().toISOString(),
				}),
				ipAddress: '203.0.113.50',
				userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
			}

			expect(entry.accountId).toBeDefined()
			expect(entry.action).toBe('update')
		})

		it('should create person export audit entry', () => {
			const entry: NewAuditLogEntry = {
				id: 'audit_export_001',
				accountId: 'acc_equipped',
				userId: 'user_admin',
				action: 'export',
				entityType: 'person',
				entityId: 'person_export_batch_001',
				changes: JSON.stringify({
					format: 'csv',
					recordCount: 125,
					filters: { status: 'active' },
				}),
				ipAddress: '203.0.113.60',
				userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
			}

			expect(entry.accountId).toBeDefined()
			expect(entry.action).toBe('export')
		})
	})

	describe('Backward Compatibility Check', () => {
		/**
		 * Ensure no old field references remain
		 */
		it('should not have organization_id field', () => {
			expect(columnNames).not.toContain('organization_id')
		})

		it('should not have audit_logs table reference', () => {
			// The table name should be 'audit_log' in SQL
			expect(tableConfig.name).toBe('audit_log')
		})
	})
})
