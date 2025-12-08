# Task: Employee Groups

## Description

Create employee groups (Engineers, Sales, etc.) for organizing device assignments and access.

## Acceptance Criteria

- [ ] Create/edit/delete groups
- [ ] Assign employees to groups
- [ ] View devices by group
- [ ] Group-based access policies
- [ ] Default device types per group

## Test Criteria

- [ ] Can create new group
- [ ] Can add employees to group
- [ ] Device list filterable by group
- [ ] Group deletion handles members correctly

## Dependencies

- devices/device-assignment
- api/device-crud

## Features from EQUIPPED.md

> "Create employee groups (Engineers, Sales etc)"
> "Manage hardware, software and services accessible or required by employee groups"

## Database Changes

New tables:
```sql
CREATE TABLE employee_groups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES employee_groups(id),
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Priority

Backlog - enhances device management organization

## References

- EQUIPPED.md UX Flows (Customer's frontend)
