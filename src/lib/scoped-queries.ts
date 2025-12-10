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
	created_by_user_id?: string
	assigned_to_person_id?: string
	status?: Order['status']
	payment_method?: string
	order_number?: string
	subtotal?: number
	shipping_cost?: number
	tax_amount?: number
	total?: number
	monthly_cost?: number
	shipping_address?: string
	shipping_city?: string
	shipping_state?: string
	shipping_zip?: string
	shipping_country?: string
	total_amount?: number
	currency?: string
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
				const columns: string[] = ['id', 'account_id']
				const values: unknown[] = [id, accountId]

				if (data.order_number !== undefined) {
					columns.push('order_number')
					values.push(data.order_number)
				}

				const status = data.status || 'pending'
				columns.push('status')
				values.push(status)

				if (data.created_by_user_id !== undefined) {
					columns.push('created_by_user_id')
					values.push(data.created_by_user_id)
				}

				if (data.assigned_to_person_id !== undefined) {
					columns.push('assigned_to_person_id')
					values.push(data.assigned_to_person_id)
				}

				if (data.payment_method !== undefined) {
					columns.push('payment_method')
					values.push(data.payment_method)
				}

				if (data.subtotal !== undefined) {
					columns.push('subtotal')
					values.push(data.subtotal)
				}

				if (data.shipping_cost !== undefined) {
					columns.push('shipping_cost')
					values.push(data.shipping_cost)
				}

				if (data.tax_amount !== undefined) {
					columns.push('tax_amount')
					values.push(data.tax_amount)
				}

				if (data.total !== undefined) {
					columns.push('total')
					values.push(data.total)
				}

				if (data.total_amount !== undefined) {
					columns.push('total_amount')
					values.push(data.total_amount)
				}

				if (data.monthly_cost !== undefined) {
					columns.push('monthly_cost')
					values.push(data.monthly_cost)
				}

				if (data.shipping_address !== undefined) {
					columns.push('shipping_address')
					values.push(data.shipping_address)
				}

				if (data.shipping_city !== undefined) {
					columns.push('shipping_city')
					values.push(data.shipping_city)
				}

				if (data.shipping_state !== undefined) {
					columns.push('shipping_state')
					values.push(data.shipping_state)
				}

				if (data.shipping_zip !== undefined) {
					columns.push('shipping_zip')
					values.push(data.shipping_zip)
				}

				if (data.shipping_country !== undefined) {
					columns.push('shipping_country')
					values.push(data.shipping_country)
				}

				if (data.currency !== undefined) {
					columns.push('currency')
					values.push(data.currency)
				}

				columns.push('created_at')

				const placeholders = columns.map((_, i) => (i === columns.length - 1 ? "datetime('now')" : '?')).join(', ')
				const query = `INSERT INTO orders (${columns.join(', ')}) VALUES (${placeholders})`

				return db.prepare(query).bind(...values)
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
