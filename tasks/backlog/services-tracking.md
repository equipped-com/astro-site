# Task: Services Tracking

## Description

Track SaaS services (Slack, Google Suite, 1Password) connected to devices and employees.

## Acceptance Criteria

- [ ] Service catalog (available services)
- [ ] Track services per device/employee
- [ ] Security checks (2FA enabled)
- [ ] Service provisioning tracking
- [ ] Offboarding checklist integration

## Test Criteria

- [ ] Can add services to tracking
- [ ] Service assignments display correctly
- [ ] Security status checks work
- [ ] Reports generate for audits

## Dependencies

- devices/device-list
- backlog/employee-groups

## Features from EQUIPPED.md

> "See a list of services (Slack, Google Suite) connected to devices"
> "See checks on services (Slack and Google 2FA)"

## Service Integrations to Consider

- Google Workspace (API available per EQUIPPED.md)
- Slack
- 1Password (partnership exists)
- Other SaaS via OAuth

## Database Changes

New tables:
```sql
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT, -- 'communication', 'security', 'productivity'
    icon_url TEXT
);

CREATE TABLE employee_services (
    id TEXT PRIMARY KEY,
    employee_email TEXT NOT NULL,
    service_id TEXT NOT NULL REFERENCES services(id),
    status TEXT, -- 'active', 'pending', 'disabled'
    mfa_enabled BOOLEAN,
    last_verified DATETIME
);
```

## Priority

Backlog - compliance and security feature

## References

- EQUIPPED.md Partnerships (Google, 1Password)
- EQUIPPED.md UX Flows
