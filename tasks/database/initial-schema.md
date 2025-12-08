# Task: Initial Database Schema

## Description

Create the initial database schema with tables for users, devices, and device assignments.

## Acceptance Criteria

- [ ] `migrations/` directory created
- [ ] `migrations/0001_initial.sql` created with schema
- [ ] `users` table with Clerk user sync fields
- [ ] `devices` table with device tracking fields
- [ ] `device_assignments` table for assignment history
- [ ] Proper indexes on foreign keys

## Test Criteria

- [ ] SQL syntax is valid (no errors on execution)
- [ ] All tables created successfully
- [ ] Indexes created on user_id, device_id columns
- [ ] Can insert/query test data

## Dependencies

- database/create-d1-database

## Schema

```sql
-- Users table (synced from Clerk via webhook)
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Clerk user ID
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- 'macbook', 'ipad', 'iphone', 'monitor', 'accessory'
    model TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'active',  -- 'active', 'pending', 'retired'
    assigned_to TEXT,              -- Employee name/email
    purchase_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Device assignments/history
CREATE TABLE device_assignments (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id),
    assigned_to_email TEXT NOT NULL,
    assigned_to_name TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_assignments_device ON device_assignments(device_id);
```

## Files to Create

- `migrations/0001_initial.sql`

## References

- [D1 SQL Reference](https://developers.cloudflare.com/d1/platform/sql-reference/)
- PLAN.md Phase 3.2
