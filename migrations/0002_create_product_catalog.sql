-- ============================================
-- GLOBAL PRODUCT CATALOG
-- ============================================
-- These tables are global (not tenant-scoped) and managed exclusively by sys_admins.
-- Inventory is shared across all tenants.

-- Brands table (global)
CREATE TABLE brands (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	slug TEXT NOT NULL UNIQUE,
	logo_url TEXT,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table (global)
CREATE TABLE products (
	id TEXT PRIMARY KEY,
	brand_id TEXT NOT NULL REFERENCES brands(id),
	name TEXT NOT NULL,
	model_identifier TEXT,
	model_number TEXT,
	sku TEXT UNIQUE,
	product_type TEXT NOT NULL,
	description TEXT,
	specs TEXT,                             -- JSON: {cpu, memory, storage, display, etc}
	msrp DECIMAL(10,2),
	image_url TEXT,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table (global)
CREATE TABLE inventory_items (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL REFERENCES products(id),
	serial_number TEXT UNIQUE,
	condition TEXT NOT NULL DEFAULT 'new',
	status TEXT NOT NULL DEFAULT 'available',
	purchase_cost DECIMAL(10,2),
	sale_price DECIMAL(10,2),
	notes TEXT,
	warehouse_location TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Brands indexes
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_is_active ON brands(is_active);

-- Products indexes
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Inventory items indexes
CREATE INDEX idx_inventory_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_condition ON inventory_items(condition);
CREATE INDEX idx_inventory_serial ON inventory_items(serial_number);
