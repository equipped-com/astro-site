-- Migration: Add is_synthetic flags for test data isolation
-- Date: 2025-12-12
-- Description: Add is_synthetic column to all tables to isolate test data from production analytics

-- Add is_synthetic flag to all tables
ALTER TABLE accounts ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN is_synthetic INTEGER DEFAULT 0;

-- Create indexes for efficient filtering
CREATE INDEX idx_accounts_synthetic ON accounts(is_synthetic);
CREATE INDEX idx_users_synthetic ON users(is_synthetic);

-- Mark existing test data as synthetic
UPDATE accounts SET is_synthetic = 1
WHERE email LIKE '%@test.tryequipped.com'
   OR subdomain LIKE 'test-%';

UPDATE users SET is_synthetic = 1
WHERE email LIKE '%@test.tryequipped.com';
