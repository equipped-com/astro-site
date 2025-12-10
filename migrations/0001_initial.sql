-- ============================================
-- GLOBAL ENTITIES (not tenant-scoped)
-- ============================================

-- Users table (synced from Clerk via webhook)
-- A User is a login identity, can access multiple Accounts
CREATE TABLE users (
	id TEXT PRIMARY KEY,                    -- Clerk user ID
	email TEXT NOT NULL UNIQUE,
	first_name TEXT,
	last_name TEXT,
	avatar_url TEXT,
	primary_account_id TEXT,                -- Default account context
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TENANT ENTITIES
-- ============================================

-- Accounts table (organizations/tenants)
CREATE TABLE accounts (
	id TEXT PRIMARY KEY,
	short_name TEXT NOT NULL UNIQUE,        -- Subdomain: {short_name}.tryequipped.com
	name TEXT NOT NULL,                     -- Display name
	billing_email TEXT,
	address TEXT,
	logo_url TEXT,
	stripe_customer_id TEXT,
	upgraded_store_id TEXT,                 -- Upgraded integration
	upgraded_customer_id TEXT,
	device_source TEXT DEFAULT 'database',  -- 'database', 'addigy', 'blackglove'
	is_synthetic BOOLEAN DEFAULT FALSE,     -- Test accounts excluded from analytics
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Account access (role assignments - links Users to Accounts)
CREATE TABLE account_access (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role TEXT NOT NULL DEFAULT 'member',    -- owner, admin, member, buyer, noaccess
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(account_id, user_id)
);

-- People table (employees/staff in an account)
-- A Person may or may not have platform login access
CREATE TABLE people (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	account_access_id TEXT REFERENCES account_access(id), -- OPTIONAL: links to User
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	email TEXT,                             -- Work email (may differ from User email)
	phone TEXT,
	title TEXT,                             -- Job title
	department TEXT,
	location TEXT,                          -- Office location
	start_date DATE,
	end_date DATE,                          -- NULL if still employed
	status TEXT DEFAULT 'active',           -- active, onboarding, offboarding, departed
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DEVICE MANAGEMENT
-- ============================================

-- Devices table
CREATE TABLE devices (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	type TEXT NOT NULL,                     -- macbook, ipad, iphone, monitor, accessory
	model TEXT,
	serial_number TEXT,
	status TEXT DEFAULT 'available',        -- available, deployed, pending, retired
	assigned_to_person_id TEXT REFERENCES people(id),
	purchase_date DATE,
	purchase_price DECIMAL(10,2),
	trade_in_value DECIMAL(10,2),
	warranty_expires DATE,
	notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(serial_number)
);

-- Device assignment history
CREATE TABLE device_assignments (
	id TEXT PRIMARY KEY,
	device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
	person_id TEXT NOT NULL REFERENCES people(id),
	assigned_by_user_id TEXT REFERENCES users(id),
	assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	returned_at DATETIME,
	notes TEXT
);

-- ============================================
-- COMMERCE & ORDERS
-- ============================================

-- Orders table
CREATE TABLE orders (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	created_by_user_id TEXT NOT NULL REFERENCES users(id),
	assigned_to_person_id TEXT REFERENCES people(id),
	status TEXT DEFAULT 'pending',          -- pending, pending_leasing_approval, processing, shipped, delivered, cancelled, returned
	payment_method TEXT,                    -- card, leasing, bank_transfer, purchase_order
	subtotal DECIMAL(10,2) NOT NULL,
	shipping_cost DECIMAL(10,2) DEFAULT 0,
	tax_amount DECIMAL(10,2) DEFAULT 0,
	total DECIMAL(10,2) NOT NULL,
	monthly_cost DECIMAL(10,2),             -- For leasing orders
	shipping_address TEXT,
	shipping_city TEXT,
	shipping_state TEXT,
	shipping_zip TEXT,
	shipping_country TEXT DEFAULT 'US',
	tracking_number TEXT,
	carrier TEXT,
	estimated_delivery DATE,
	delivered_at DATETIME,
	is_synthetic BOOLEAN DEFAULT FALSE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order line items
CREATE TABLE order_items (
	id TEXT PRIMARY KEY,
	order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	product_name TEXT NOT NULL,
	product_sku TEXT,
	product_image_url TEXT,
	quantity INTEGER DEFAULT 1,
	unit_price DECIMAL(10,2) NOT NULL,
	monthly_price DECIMAL(10,2),            -- For leasing
	total_price DECIMAL(10,2) NOT NULL,
	specs TEXT                              -- JSON: {cpu, memory, storage, color}
);

-- ============================================
-- LEASING (Macquarie Integration)
-- ============================================

-- Lease applications
CREATE TABLE lease_applications (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	order_id TEXT REFERENCES orders(id),
	status TEXT DEFAULT 'pending',          -- pending, approved, declined, expired
	company_legal_name TEXT NOT NULL,
	company_ein TEXT,
	contact_name TEXT NOT NULL,
	contact_email TEXT NOT NULL,
	registered_address TEXT,
	bank_verification_method TEXT,          -- plaid, upload
	macquarie_reference TEXT,
	decision_reason TEXT,
	submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	decided_at DATETIME
);

-- Lease agreements (after approval)
CREATE TABLE lease_agreements (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	application_id TEXT NOT NULL REFERENCES lease_applications(id),
	lease_term_months INTEGER NOT NULL,     -- 24 or 36
	monthly_payment DECIMAL(10,2) NOT NULL,
	total_value DECIMAL(10,2) NOT NULL,
	buyout_amount DECIMAL(10,2),
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	signed_at DATETIME,
	signer_name TEXT,
	agreement_pdf_url TEXT,
	status TEXT DEFAULT 'active',           -- active, completed, terminated_early
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lease payments
CREATE TABLE lease_payments (
	id TEXT PRIMARY KEY,
	agreement_id TEXT NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
	scheduled_date DATE NOT NULL,
	amount DECIMAL(10,2) NOT NULL,
	status TEXT DEFAULT 'scheduled',        -- scheduled, processed, failed, refunded
	processed_at DATETIME,
	reference_number TEXT,
	failure_reason TEXT
);

-- ============================================
-- PROPOSALS (B2B)
-- ============================================

CREATE TABLE proposals (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	created_by_user_id TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL,
	status TEXT DEFAULT 'draft',            -- draft, sent, viewed, approved, declined, expired, converted
	recipient_email TEXT,
	recipient_name TEXT,
	share_token TEXT UNIQUE,                -- For public share link
	expires_at DATETIME,
	approved_at DATETIME,
	converted_to_order_id TEXT REFERENCES orders(id),
	subtotal DECIMAL(10,2),
	notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proposal_items (
	id TEXT PRIMARY KEY,
	proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
	product_name TEXT NOT NULL,
	product_sku TEXT,
	quantity INTEGER DEFAULT 1,
	unit_price DECIMAL(10,2) NOT NULL,
	monthly_price DECIMAL(10,2),
	specs TEXT
);

-- ============================================
-- TRADE-IN
-- ============================================

CREATE TABLE trade_ins (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	device_id TEXT REFERENCES devices(id),
	order_id TEXT REFERENCES orders(id),    -- Applied to this order
	device_model TEXT NOT NULL,
	device_serial TEXT,
	condition TEXT,                         -- excellent, good, fair, poor
	estimated_value DECIMAL(10,2),
	final_value DECIMAL(10,2),
	status TEXT DEFAULT 'pending',          -- pending, label_sent, received, inspected, credited, rejected
	return_label_url TEXT,
	tracking_number TEXT,
	inspected_at DATETIME,
	credited_at DATETIME,
	notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAYMENTS (Stripe Integration)
-- ============================================

-- Payments table
-- Tracks all payment transactions processed through Stripe
CREATE TABLE payments (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	order_id TEXT REFERENCES orders(id),
	stripe_session_id TEXT UNIQUE,
	stripe_payment_intent_id TEXT UNIQUE,
	stripe_customer_id TEXT,
	status TEXT DEFAULT 'pending',          -- pending, processing, succeeded, failed, canceled, refunded, partially_refunded
	amount INTEGER NOT NULL,                -- Amount in cents
	currency TEXT DEFAULT 'usd',
	customer_email TEXT,
	failure_reason TEXT,
	metadata TEXT,                          -- JSON string for additional data
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT & COMPLIANCE
-- ============================================

CREATE TABLE audit_log (
	id TEXT PRIMARY KEY,
	account_id TEXT REFERENCES accounts(id),
	user_id TEXT REFERENCES users(id),
	action TEXT NOT NULL,                   -- create, update, delete, view, export
	entity_type TEXT NOT NULL,              -- device, order, user, person, etc.
	entity_id TEXT NOT NULL,
	changes TEXT,                           -- JSON diff
	ip_address TEXT,
	user_agent TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_primary_account ON users(primary_account_id);

-- Accounts
CREATE INDEX idx_accounts_short_name ON accounts(short_name);
CREATE INDEX idx_accounts_stripe_customer ON accounts(stripe_customer_id);

-- Account Access
CREATE INDEX idx_account_access_account ON account_access(account_id);
CREATE INDEX idx_account_access_user ON account_access(user_id);

-- People
CREATE INDEX idx_people_account ON people(account_id);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_status ON people(status);

-- Devices
CREATE INDEX idx_devices_account ON devices(account_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_serial ON devices(serial_number);
CREATE INDEX idx_devices_assigned_to ON devices(assigned_to_person_id);

-- Device Assignments
CREATE INDEX idx_assignments_device ON device_assignments(device_id);
CREATE INDEX idx_assignments_person ON device_assignments(person_id);

-- Orders
CREATE INDEX idx_orders_account ON orders(account_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by_user_id);

-- Lease Applications
CREATE INDEX idx_lease_apps_account ON lease_applications(account_id);
CREATE INDEX idx_lease_apps_status ON lease_applications(status);

-- Lease Agreements
CREATE INDEX idx_lease_agreements_account ON lease_agreements(account_id);
CREATE INDEX idx_lease_agreements_status ON lease_agreements(status);

-- Proposals
CREATE INDEX idx_proposals_account ON proposals(account_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_share_token ON proposals(share_token);

-- Trade-ins
CREATE INDEX idx_trade_ins_account ON trade_ins(account_id);
CREATE INDEX idx_trade_ins_status ON trade_ins(status);

-- Payments
CREATE INDEX idx_payments_account ON payments(account_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Audit Log
CREATE INDEX idx_audit_account ON audit_log(account_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
