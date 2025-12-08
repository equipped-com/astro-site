/**
 * Scoped Query Helpers
 *
 * Provides tenant-scoped database query helpers to ensure all queries
 * are automatically filtered by account_id.
 *
 * This prevents accidental data leakage between tenants.
 */

import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types'
import type { Context } from 'hono'
import { getTenantContext } from './tenant-context'

export interface Device {
	id: string
	account_id: string
	name: string
	type: string
	model: string
	serial_number?: string
	status: 'available' | 'assigned' | 'in_use' | 'maintenance' | 'retired'
	assigned_to?: string
	created_at: string
	updated_at?: string
	deleted_at?: string
}

export interface Person {
	id: string
	account_id: string
	first_name: string
	last_name: string
	email: string
	phone?: string
	status: 'active' | 'offboarding' | 'offboarded'
	created_at: string
	updated_at?: string
}

export interface Order {
	id: string
	account_id: string
	created_by_user_id: string
	assigned_to_person_id?: string
	status: 'pending' | 'pending_leasing_approval' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
	payment_method?: string
	subtotal: number
	shipping_cost: number
	tax_amount: number
	total: number
	monthly_cost?: number
	shipping_address?: string
	shipping_city?: string
	shipping_state?: string
	shipping_zip?: string
	shipping_country?: string
	tracking_number?: string
	carrier?: string
	estimated_delivery?: string
	delivered_at?: string
	is_synthetic?: boolean
	created_at: string
	updated_at?: string
}

export interface OrderItem {
	id: string
	order_id: string
	product_name: string
	product_sku?: string
	product_image_url?: string
	quantity: number
	unit_price: number
	monthly_price?: number
	total_price: number
	specs?: string
}

export interface OrderWithItems extends Order {
	items?: OrderItem[]
	creator_name?: string
	assignee_name?: string
}

export interface InsertDeviceData {
	name: string
	type: string
	model: string
	serial_number?: string
	status?: Device['status']
	assigned_to?: string
}

export interface InsertPersonData {
	first_name: string
	last_name: string
	email: string
	phone?: string
	status?: Person['status']
}

export interface InsertOrderData {
	created_by_user_id: string
	assigned_to_person_id?: string
	status?: Order['status']
	payment_method?: string
	subtotal: number
	shipping_cost?: number
	tax_amount?: number
	total: number
	monthly_cost?: number
	shipping_address?: string
	shipping_city?: string
	shipping_state?: string
	shipping_zip?: string
	shipping_country?: string
}

/**
 * Generate a unique ID using crypto.randomUUID()
 * Falls back to timestamp-based ID if crypto is unavailable
 */
function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID()
	}
	// Fallback for environments without crypto.randomUUID
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get scoped query helpers for the current tenant
 *
 * All queries are automatically scoped to the account_id from the tenant context.
 * This ensures no data leakage between tenants.
 *
 * @throws Error if tenant context is not available
 *
 * @example
 * ```typescript
 * app.get('/api/devices', async (c) => {
 *   const queries = scopedQuery(c)
 *   const devices = await queries.devices.list().all()
 *   return c.json(devices)
 * })
 * ```
 */
export function scopedQuery(c: Context) {
	const { accountId } = getTenantContext(c)
	const db = c.env.DB as D1Database

	if (!db) {
		throw new Error('Database not configured')
	}

	return {
		/**
		 * Device queries scoped to current account
		 */
		devices: {
			/**
			 * List all devices for the current account
			 */
			list(): D1PreparedStatement {
				return db.prepare('SELECT * FROM devices WHERE account_id = ? ORDER BY created_at DESC').bind(accountId)
			},

			/**
			 * Get a specific device by ID (scoped to account)
			 */
			get(id: string): D1PreparedStatement {
				return db.prepare('SELECT * FROM devices WHERE id = ? AND account_id = ?').bind(id, accountId)
			},

			/**
			 * Insert a new device (automatically sets account_id)
			 */
			insert(data: InsertDeviceData): D1PreparedStatement {
				const id = generateId()
				const status = data.status || 'available'

				return db
					.prepare(
						`INSERT INTO devices (id, account_id, name, type, model, serial_number, status, assigned_to, created_at)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
					)
					.bind(
						id,
						accountId,
						data.name,
						data.type,
						data.model,
						data.serial_number || null,
						status,
						data.assigned_to || null,
					)
			},

			/**
			 * Update a device (scoped to account)
			 */
			update(id: string, data: Partial<InsertDeviceData>): D1PreparedStatement {
				const setClauses: string[] = []
				const values: unknown[] = []

				if (data.name !== undefined) {
					setClauses.push('name = ?')
					values.push(data.name)
				}
				if (data.type !== undefined) {
					setClauses.push('type = ?')
					values.push(data.type)
				}
				if (data.model !== undefined) {
					setClauses.push('model = ?')
					values.push(data.model)
				}
				if (data.serial_number !== undefined) {
					setClauses.push('serial_number = ?')
					values.push(data.serial_number)
				}
				if (data.status !== undefined) {
					setClauses.push('status = ?')
					values.push(data.status)
				}
				if (data.assigned_to !== undefined) {
					setClauses.push('assigned_to = ?')
					values.push(data.assigned_to)
				}

				setClauses.push("updated_at = datetime('now')")

				return db
					.prepare(`UPDATE devices SET ${setClauses.join(', ')} WHERE id = ? AND account_id = ?`)
					.bind(...values, id, accountId)
			},

			/**
			 * Delete a device (scoped to account)
			 */
			delete(id: string): D1PreparedStatement {
				return db.prepare('DELETE FROM devices WHERE id = ? AND account_id = ?').bind(id, accountId)
			},
		},

		/**
		 * People queries scoped to current account
		 */
		people: {
			/**
			 * List all people for the current account
			 */
			list(): D1PreparedStatement {
				return db.prepare('SELECT * FROM people WHERE account_id = ? ORDER BY last_name, first_name').bind(accountId)
			},

			/**
			 * Get a specific person by ID (scoped to account)
			 */
			get(id: string): D1PreparedStatement {
				return db.prepare('SELECT * FROM people WHERE id = ? AND account_id = ?').bind(id, accountId)
			},

			/**
			 * Insert a new person (automatically sets account_id)
			 */
			insert(data: InsertPersonData): D1PreparedStatement {
				const id = generateId()
				const status = data.status || 'active'

				return db
					.prepare(
						`INSERT INTO people (id, account_id, first_name, last_name, email, phone, status, created_at)
						VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
					)
					.bind(id, accountId, data.first_name, data.last_name, data.email, data.phone || null, status)
			},

			/**
			 * Update a person (scoped to account)
			 */
			update(id: string, data: Partial<InsertPersonData>): D1PreparedStatement {
				const setClauses: string[] = []
				const values: unknown[] = []

				if (data.first_name !== undefined) {
					setClauses.push('first_name = ?')
					values.push(data.first_name)
				}
				if (data.last_name !== undefined) {
					setClauses.push('last_name = ?')
					values.push(data.last_name)
				}
				if (data.email !== undefined) {
					setClauses.push('email = ?')
					values.push(data.email)
				}
				if (data.phone !== undefined) {
					setClauses.push('phone = ?')
					values.push(data.phone)
				}
				if (data.status !== undefined) {
					setClauses.push('status = ?')
					values.push(data.status)
				}

				setClauses.push("updated_at = datetime('now')")

				return db
					.prepare(`UPDATE people SET ${setClauses.join(', ')} WHERE id = ? AND account_id = ?`)
					.bind(...values, id, accountId)
			},

			/**
			 * Delete a person (scoped to account)
			 */
			delete(id: string): D1PreparedStatement {
				return db.prepare('DELETE FROM people WHERE id = ? AND account_id = ?').bind(id, accountId)
			},
		},

		/**
		 * Order queries scoped to current account
		 */
		orders: {
			/**
			 * List all orders for the current account
			 */
			list(): D1PreparedStatement {
				return db.prepare('SELECT * FROM orders WHERE account_id = ? ORDER BY created_at DESC').bind(accountId)
			},

			/**
			 * Get a specific order by ID (scoped to account)
			 */
			get(id: string): D1PreparedStatement {
				return db.prepare('SELECT * FROM orders WHERE id = ? AND account_id = ?').bind(id, accountId)
			},

			/**
			 * Insert a new order (automatically sets account_id)
			 */
			insert(data: InsertOrderData): D1PreparedStatement {
				const id = generateId()
				const status = data.status || 'pending'
				const shipping_cost = data.shipping_cost ?? 0
				const tax_amount = data.tax_amount ?? 0
				const shipping_country = data.shipping_country || 'US'

				return db
					.prepare(
						`INSERT INTO orders (
							id, account_id, created_by_user_id, assigned_to_person_id, status,
							payment_method, subtotal, shipping_cost, tax_amount, total, monthly_cost,
							shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
							created_at
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
					)
					.bind(
						id,
						accountId,
						data.created_by_user_id,
						data.assigned_to_person_id || null,
						status,
						data.payment_method || null,
						data.subtotal,
						shipping_cost,
						tax_amount,
						data.total,
						data.monthly_cost || null,
						data.shipping_address || null,
						data.shipping_city || null,
						data.shipping_state || null,
						data.shipping_zip || null,
						shipping_country,
					)
			},

			/**
			 * Update an order (scoped to account)
			 */
			update(id: string, data: Partial<InsertOrderData>): D1PreparedStatement {
				const setClauses: string[] = []
				const values: unknown[] = []

				if (data.status !== undefined) {
					setClauses.push('status = ?')
					values.push(data.status)
				}
				if (data.payment_method !== undefined) {
					setClauses.push('payment_method = ?')
					values.push(data.payment_method)
				}
				if (data.subtotal !== undefined) {
					setClauses.push('subtotal = ?')
					values.push(data.subtotal)
				}
				if (data.shipping_cost !== undefined) {
					setClauses.push('shipping_cost = ?')
					values.push(data.shipping_cost)
				}
				if (data.tax_amount !== undefined) {
					setClauses.push('tax_amount = ?')
					values.push(data.tax_amount)
				}
				if (data.total !== undefined) {
					setClauses.push('total = ?')
					values.push(data.total)
				}

				setClauses.push("updated_at = datetime('now')")

				return db
					.prepare(`UPDATE orders SET ${setClauses.join(', ')} WHERE id = ? AND account_id = ?`)
					.bind(...values, id, accountId)
			},

			/**
			 * Delete an order (scoped to account)
			 */
			delete(id: string): D1PreparedStatement {
				return db.prepare('DELETE FROM orders WHERE id = ? AND account_id = ?').bind(id, accountId)
			},
		},
	}
}
