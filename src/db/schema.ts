/**
 * Drizzle ORM Schema for Equipped Platform
 *
 * Multi-tenant architecture with Account-scoped data isolation.
 * Users are global (Clerk identity), People are tenant-scoped (employees).
 */
import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ============================================
// GLOBAL ENTITIES (not tenant-scoped)
// ============================================

/**
 * Users table (synced from Clerk via webhook)
 * A User is a login identity, can access multiple Accounts
 */
export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(), // Clerk user ID
		email: text('email').notNull().unique(),
		firstName: text('first_name'),
		lastName: text('last_name'),
		avatarUrl: text('avatar_url'),
		primaryAccountId: text('primary_account_id'), // Default account context
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [index('idx_users_email').on(table.email), index('idx_users_primary_account').on(table.primaryAccountId)],
)

/**
 * Brands table (global)
 * Managed exclusively by sys_admins
 */
export const brands = sqliteTable(
	'brands',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		slug: text('slug').notNull().unique(),
		logoUrl: text('logo_url'),
		isActive: integer('is_active', { mode: 'boolean' }).default(true),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [index('idx_brands_slug').on(table.slug), index('idx_brands_is_active').on(table.isActive)],
)

/**
 * Products table (global)
 * Managed exclusively by sys_admins
 */
export const products = sqliteTable(
	'products',
	{
		id: text('id').primaryKey(),
		brandId: text('brand_id')
			.notNull()
			.references(() => brands.id),
		name: text('name').notNull(),
		modelIdentifier: text('model_identifier'),
		modelNumber: text('model_number'),
		sku: text('sku').unique(),
		productType: text('product_type').notNull(), // laptop, desktop, tablet, phone, accessory, display
		description: text('description'),
		specs: text('specs'), // JSON: {cpu, memory, storage, display, etc}
		msrp: real('msrp'),
		imageUrl: text('image_url'),
		isActive: integer('is_active', { mode: 'boolean' }).default(true),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_products_brand').on(table.brandId),
		index('idx_products_sku').on(table.sku),
		index('idx_products_type').on(table.productType),
		index('idx_products_is_active').on(table.isActive),
	],
)

/**
 * Inventory items table (global)
 * Tracks specific stocked units with serial numbers
 */
export const inventoryItems = sqliteTable(
	'inventory_items',
	{
		id: text('id').primaryKey(),
		productId: text('product_id')
			.notNull()
			.references(() => products.id),
		serialNumber: text('serial_number').unique(),
		condition: text('condition').notNull().default('new'), // new, like_new, good, fair, refurbished
		status: text('status').notNull().default('available'), // available, reserved, sold, allocated
		purchaseCost: real('purchase_cost'),
		salePrice: real('sale_price'),
		notes: text('notes'),
		warehouseLocation: text('warehouse_location'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_inventory_product').on(table.productId),
		index('idx_inventory_status').on(table.status),
		index('idx_inventory_condition').on(table.condition),
		index('idx_inventory_serial').on(table.serialNumber),
	],
)

// ============================================
// TENANT ENTITIES
// ============================================

/**
 * Accounts table (organizations/tenants)
 */
export const accounts = sqliteTable(
	'accounts',
	{
		id: text('id').primaryKey(),
		shortName: text('short_name').notNull().unique(), // Subdomain: {short_name}.tryequipped.com
		name: text('name').notNull(), // Display name
		billingEmail: text('billing_email'),
		address: text('address'),
		logoUrl: text('logo_url'),
		stripeCustomerId: text('stripe_customer_id'),
		upgradedStoreId: text('upgraded_store_id'), // Upgraded integration
		upgradedCustomerId: text('upgraded_customer_id'),
		deviceSource: text('device_source').default('database'), // 'database', 'addigy', 'blackglove'
		isSynthetic: integer('is_synthetic', { mode: 'boolean' }).default(false), // Test accounts excluded from analytics
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_accounts_short_name').on(table.shortName),
		index('idx_accounts_stripe_customer').on(table.stripeCustomerId),
	],
)

/**
 * Account access (role assignments - links Users to Accounts)
 */
export const accountAccess = sqliteTable(
	'account_access',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('member'), // owner, admin, member, buyer, noaccess
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		uniqueIndex('idx_account_access_unique').on(table.accountId, table.userId),
		index('idx_account_access_account').on(table.accountId),
		index('idx_account_access_user').on(table.userId),
	],
)

/**
 * Account invitations (tracks invitation lifecycle)
 * Manages pending invitations to join an account with a specific role
 */
export const accountInvitations = sqliteTable(
	'account_invitations',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: text('role').notNull().default('member'), // owner, admin, member, buyer, noaccess
		invitedByUserId: text('invited_by_user_id')
			.notNull()
			.references(() => users.id),
		sentAt: text('sent_at').default(sql`CURRENT_TIMESTAMP`),
		acceptedAt: text('accepted_at'),
		declinedAt: text('declined_at'),
		revokedAt: text('revoked_at'),
		expiresAt: text('expires_at').notNull(),
	},
	table => [
		uniqueIndex('idx_invitations_account_email').on(table.accountId, table.email),
		index('idx_invitations_email').on(table.email),
		index('idx_invitations_account').on(table.accountId),
	],
)

/**
 * People table (employees/staff in an account)
 * A Person may or may not have platform login access
 */
export const people = sqliteTable(
	'people',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		accountAccessId: text('account_access_id').references(() => accountAccess.id), // OPTIONAL: links to User
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		email: text('email'), // Work email (may differ from User email)
		phone: text('phone'),
		title: text('title'), // Job title
		department: text('department'),
		location: text('location'), // Office location
		startDate: text('start_date'),
		endDate: text('end_date'), // NULL if still employed
		status: text('status').default('active'), // active, onboarding, offboarding, departed
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_people_account').on(table.accountId),
		index('idx_people_email').on(table.email),
		index('idx_people_status').on(table.status),
	],
)

// ============================================
// DEVICE MANAGEMENT
// ============================================

/**
 * Devices table
 */
export const devices = sqliteTable(
	'devices',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: text('type').notNull(), // macbook, ipad, iphone, monitor, accessory
		model: text('model'),
		serialNumber: text('serial_number').unique(),
		status: text('status').default('available'), // available, deployed, pending, retired
		assignedToPersonId: text('assigned_to_person_id').references(() => people.id),
		purchaseDate: text('purchase_date'),
		purchasePrice: real('purchase_price'),
		tradeInValue: real('trade_in_value'),
		warrantyExpires: text('warranty_expires'),
		notes: text('notes'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_devices_account').on(table.accountId),
		index('idx_devices_status').on(table.status),
		index('idx_devices_serial').on(table.serialNumber),
		index('idx_devices_assigned_to').on(table.assignedToPersonId),
	],
)

/**
 * Device assignment history
 */
export const deviceAssignments = sqliteTable(
	'device_assignments',
	{
		id: text('id').primaryKey(),
		deviceId: text('device_id')
			.notNull()
			.references(() => devices.id, { onDelete: 'cascade' }),
		personId: text('person_id')
			.notNull()
			.references(() => people.id),
		assignedByUserId: text('assigned_by_user_id').references(() => users.id),
		assignedAt: text('assigned_at').default(sql`CURRENT_TIMESTAMP`),
		returnedAt: text('returned_at'),
		notes: text('notes'),
	},
	table => [index('idx_assignments_device').on(table.deviceId), index('idx_assignments_person').on(table.personId)],
)

// ============================================
// COMMERCE & ORDERS
// ============================================

/**
 * Orders table
 */
export const orders = sqliteTable(
	'orders',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		createdByUserId: text('created_by_user_id')
			.notNull()
			.references(() => users.id),
		assignedToPersonId: text('assigned_to_person_id').references(() => people.id),
		status: text('status').default('pending'), // pending, pending_leasing_approval, processing, shipped, delivered, cancelled, returned
		paymentMethod: text('payment_method'), // card, leasing, bank_transfer, purchase_order
		subtotal: real('subtotal').notNull(),
		shippingCost: real('shipping_cost').default(0),
		taxAmount: real('tax_amount').default(0),
		total: real('total').notNull(),
		monthlyCost: real('monthly_cost'), // For leasing orders
		shippingAddress: text('shipping_address'),
		shippingCity: text('shipping_city'),
		shippingState: text('shipping_state'),
		shippingZip: text('shipping_zip'),
		shippingCountry: text('shipping_country').default('US'),
		trackingNumber: text('tracking_number'),
		carrier: text('carrier'),
		estimatedDelivery: text('estimated_delivery'),
		deliveredAt: text('delivered_at'),
		isSynthetic: integer('is_synthetic', { mode: 'boolean' }).default(false),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_orders_account').on(table.accountId),
		index('idx_orders_status').on(table.status),
		index('idx_orders_created_by').on(table.createdByUserId),
	],
)

/**
 * Order line items
 */
export const orderItems = sqliteTable('order_items', {
	id: text('id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	productName: text('product_name').notNull(),
	productSku: text('product_sku'),
	productImageUrl: text('product_image_url'),
	quantity: integer('quantity').default(1),
	unitPrice: real('unit_price').notNull(),
	monthlyPrice: real('monthly_price'), // For leasing
	totalPrice: real('total_price').notNull(),
	specs: text('specs'), // JSON: {cpu, memory, storage, color}
})

// ============================================
// LEASING (Macquarie Integration)
// ============================================

/**
 * Lease applications
 */
export const leaseApplications = sqliteTable(
	'lease_applications',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		orderId: text('order_id').references(() => orders.id),
		status: text('status').default('pending'), // pending, approved, declined, expired
		companyLegalName: text('company_legal_name').notNull(),
		companyEin: text('company_ein'),
		contactName: text('contact_name').notNull(),
		contactEmail: text('contact_email').notNull(),
		registeredAddress: text('registered_address'),
		bankVerificationMethod: text('bank_verification_method'), // plaid, upload
		macquarieReference: text('macquarie_reference'),
		decisionReason: text('decision_reason'),
		submittedAt: text('submitted_at').default(sql`CURRENT_TIMESTAMP`),
		decidedAt: text('decided_at'),
	},
	table => [index('idx_lease_apps_account').on(table.accountId), index('idx_lease_apps_status').on(table.status)],
)

/**
 * Lease agreements (after approval)
 */
export const leaseAgreements = sqliteTable(
	'lease_agreements',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		applicationId: text('application_id')
			.notNull()
			.references(() => leaseApplications.id),
		leaseTermMonths: integer('lease_term_months').notNull(), // 24 or 36
		monthlyPayment: real('monthly_payment').notNull(),
		totalValue: real('total_value').notNull(),
		buyoutAmount: real('buyout_amount'),
		startDate: text('start_date').notNull(),
		endDate: text('end_date').notNull(),
		signedAt: text('signed_at'),
		signerName: text('signer_name'),
		agreementPdfUrl: text('agreement_pdf_url'),
		status: text('status').default('active'), // active, completed, terminated_early
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_lease_agreements_account').on(table.accountId),
		index('idx_lease_agreements_status').on(table.status),
	],
)

/**
 * Lease payments
 */
export const leasePayments = sqliteTable('lease_payments', {
	id: text('id').primaryKey(),
	agreementId: text('agreement_id')
		.notNull()
		.references(() => leaseAgreements.id, { onDelete: 'cascade' }),
	scheduledDate: text('scheduled_date').notNull(),
	amount: real('amount').notNull(),
	status: text('status').default('scheduled'), // scheduled, processed, failed, refunded
	processedAt: text('processed_at'),
	referenceNumber: text('reference_number'),
	failureReason: text('failure_reason'),
})

// ============================================
// PROPOSALS (B2B)
// ============================================

/**
 * Proposals table
 */
export const proposals = sqliteTable(
	'proposals',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		createdByUserId: text('created_by_user_id')
			.notNull()
			.references(() => users.id),
		title: text('title').notNull(),
		status: text('status').default('draft'), // draft, sent, viewed, approved, declined, expired, converted
		recipientEmail: text('recipient_email'),
		recipientName: text('recipient_name'),
		shareToken: text('share_token').unique(), // For public share link
		expiresAt: text('expires_at'),
		approvedAt: text('approved_at'),
		convertedToOrderId: text('converted_to_order_id').references(() => orders.id),
		subtotal: real('subtotal'),
		notes: text('notes'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_proposals_account').on(table.accountId),
		index('idx_proposals_status').on(table.status),
		index('idx_proposals_share_token').on(table.shareToken),
	],
)

/**
 * Proposal line items
 */
export const proposalItems = sqliteTable('proposal_items', {
	id: text('id').primaryKey(),
	proposalId: text('proposal_id')
		.notNull()
		.references(() => proposals.id, { onDelete: 'cascade' }),
	productName: text('product_name').notNull(),
	productSku: text('product_sku'),
	quantity: integer('quantity').default(1),
	unitPrice: real('unit_price').notNull(),
	monthlyPrice: real('monthly_price'),
	specs: text('specs'),
})

// ============================================
// TRADE-IN
// ============================================

/**
 * Trade-ins table
 */
export const tradeIns = sqliteTable(
	'trade_ins',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		deviceId: text('device_id').references(() => devices.id),
		orderId: text('order_id').references(() => orders.id), // Applied to this order
		deviceModel: text('device_model').notNull(),
		deviceSerial: text('device_serial'),
		condition: text('condition'), // excellent, good, fair, poor
		estimatedValue: real('estimated_value'),
		finalValue: real('final_value'),
		status: text('status').default('pending'), // pending, label_sent, received, inspected, credited, rejected
		returnLabelUrl: text('return_label_url'),
		trackingNumber: text('tracking_number'),
		inspectedAt: text('inspected_at'),
		creditedAt: text('credited_at'),
		notes: text('notes'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [index('idx_trade_ins_account').on(table.accountId), index('idx_trade_ins_status').on(table.status)],
)

// ============================================
// PAYMENTS (Stripe Integration)
// ============================================

/**
 * Payments table
 * Tracks all payment transactions processed through Stripe
 */
export const payments = sqliteTable(
	'payments',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id')
			.notNull()
			.references(() => accounts.id, { onDelete: 'cascade' }),
		orderId: text('order_id').references(() => orders.id),
		stripeSessionId: text('stripe_session_id').unique(),
		stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
		stripeCustomerId: text('stripe_customer_id'),
		status: text('status').default('pending'), // pending, processing, succeeded, failed, canceled, refunded, partially_refunded
		amount: integer('amount').notNull(), // Amount in cents
		currency: text('currency').default('usd'),
		customerEmail: text('customer_email'),
		failureReason: text('failure_reason'),
		metadata: text('metadata'), // JSON string for additional data
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_payments_account').on(table.accountId),
		index('idx_payments_order').on(table.orderId),
		index('idx_payments_status').on(table.status),
		index('idx_payments_stripe_session').on(table.stripeSessionId),
		index('idx_payments_stripe_intent').on(table.stripePaymentIntentId),
	],
)

// ============================================
// AUDIT & COMPLIANCE
// ============================================

/**
 * Audit log table
 */
export const auditLog = sqliteTable(
	'audit_log',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').references(() => accounts.id),
		userId: text('user_id').references(() => users.id),
		action: text('action').notNull(), // create, update, delete, view, export
		entityType: text('entity_type').notNull(), // device, order, user, person, etc.
		entityId: text('entity_id').notNull(),
		changes: text('changes'), // JSON diff
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	},
	table => [
		index('idx_audit_account').on(table.accountId),
		index('idx_audit_user').on(table.userId),
		index('idx_audit_entity').on(table.entityType, table.entityId),
		index('idx_audit_created').on(table.createdAt),
	],
)

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Brand = typeof brands.$inferSelect
export type NewBrand = typeof brands.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type InventoryItem = typeof inventoryItems.$inferSelect
export type NewInventoryItem = typeof inventoryItems.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type AccountAccess = typeof accountAccess.$inferSelect
export type NewAccountAccess = typeof accountAccess.$inferInsert

export type AccountInvitation = typeof accountInvitations.$inferSelect
export type NewAccountInvitation = typeof accountInvitations.$inferInsert

export type Person = typeof people.$inferSelect
export type NewPerson = typeof people.$inferInsert

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert

export type DeviceAssignment = typeof deviceAssignments.$inferSelect
export type NewDeviceAssignment = typeof deviceAssignments.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type LeaseApplication = typeof leaseApplications.$inferSelect
export type NewLeaseApplication = typeof leaseApplications.$inferInsert

export type LeaseAgreement = typeof leaseAgreements.$inferSelect
export type NewLeaseAgreement = typeof leaseAgreements.$inferInsert

export type LeasePayment = typeof leasePayments.$inferSelect
export type NewLeasePayment = typeof leasePayments.$inferInsert

export type Proposal = typeof proposals.$inferSelect
export type NewProposal = typeof proposals.$inferInsert

export type ProposalItem = typeof proposalItems.$inferSelect
export type NewProposalItem = typeof proposalItems.$inferInsert

export type TradeIn = typeof tradeIns.$inferSelect
export type NewTradeIn = typeof tradeIns.$inferInsert

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert

export type AuditLogEntry = typeof auditLog.$inferSelect
export type NewAuditLogEntry = typeof auditLog.$inferInsert

// ============================================
// ROLE ENUM
// ============================================

export const ACCOUNT_ROLES = ['owner', 'admin', 'member', 'buyer', 'noaccess'] as const
export type AccountRole = (typeof ACCOUNT_ROLES)[number]

// ============================================
// STATUS ENUMS
// ============================================

export const PERSON_STATUSES = ['active', 'onboarding', 'offboarding', 'departed'] as const
export type PersonStatus = (typeof PERSON_STATUSES)[number]

export const DEVICE_STATUSES = ['available', 'deployed', 'pending', 'retired'] as const
export type DeviceStatus = (typeof DEVICE_STATUSES)[number]

export const DEVICE_TYPES = ['macbook', 'ipad', 'iphone', 'monitor', 'accessory'] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]

export const ORDER_STATUSES = [
	'pending',
	'pending_leasing_approval',
	'processing',
	'shipped',
	'delivered',
	'cancelled',
	'returned',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_METHODS = ['card', 'leasing', 'bank_transfer', 'purchase_order'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const LEASE_APPLICATION_STATUSES = ['pending', 'approved', 'declined', 'expired'] as const
export type LeaseApplicationStatus = (typeof LEASE_APPLICATION_STATUSES)[number]

export const LEASE_AGREEMENT_STATUSES = ['active', 'completed', 'terminated_early'] as const
export type LeaseAgreementStatus = (typeof LEASE_AGREEMENT_STATUSES)[number]

export const PROPOSAL_STATUSES = ['draft', 'sent', 'viewed', 'approved', 'declined', 'expired', 'converted'] as const
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export const TRADE_IN_STATUSES = ['pending', 'label_sent', 'received', 'inspected', 'credited', 'rejected'] as const
export type TradeInStatus = (typeof TRADE_IN_STATUSES)[number]

export const TRADE_IN_CONDITIONS = ['excellent', 'good', 'fair', 'poor'] as const
export type TradeInCondition = (typeof TRADE_IN_CONDITIONS)[number]

export const PAYMENT_STATUSES = [
	'pending',
	'processing',
	'succeeded',
	'failed',
	'canceled',
	'refunded',
	'partially_refunded',
] as const
export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number]

export const AUDIT_ACTIONS = ['create', 'update', 'delete', 'view', 'export'] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]
