# Task: SuperAdmin Panel

## Description

Create admin panel for Equipped staff to manage customers and their data.

## Acceptance Criteria

- [ ] Separate admin authentication
- [ ] Customer list view and management
- [ ] Customer's managers view/edit
- [ ] Customer's employees view/edit
- [ ] Customer's devices view/edit
- [ ] Impersonation capability (support)

## Test Criteria

- [ ] Admin login separate from customer
- [ ] Can view all customers
- [ ] Can edit customer data
- [ ] Audit log of admin actions
- [ ] Impersonation works correctly

## Dependencies

- auth/clerk-provider
- api/auth-middleware

## Features from EQUIPPED.md

> "SuperAdmin's frontend:
> - See and edit a list of customers
> - See and edit a list of customer's managers who has access to the system
> - See and edit a list of customer's employees
> - See and edit a list of customer's hardware (with connections)"

## Security Considerations

- Role-based access control (RBAC)
- Admin actions audit logged
- Impersonation requires approval
- Data access limited by role

## Database Changes

New tables/columns:
```sql
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    clerk_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'super_admin', 'support', 'viewer'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL REFERENCES admin_users(id),
    action TEXT NOT NULL,
    target_type TEXT, -- 'customer', 'device', 'user'
    target_id TEXT,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Priority

Backlog - internal tool for Equipped staff

## References

- EQUIPPED.md UX Flows (SuperAdmin's frontend)
