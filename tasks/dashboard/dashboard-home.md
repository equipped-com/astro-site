# Task: Dashboard Home Page

## Description

Create the dashboard home/landing page that users see after login.

## Acceptance Criteria

- [ ] `src/pages/dashboard/index.astro` created
- [ ] Uses DashboardLayout
- [ ] Shows welcome message with user name
- [ ] Quick stats cards (device count, etc.)
- [ ] Quick actions (Add device, View orders)
- [ ] Redirects to dashboard/devices or shows overview

## Test Criteria

- [ ] Page loads for authenticated users
- [ ] Unauthenticated users redirected to sign-in
- [ ] User's name displayed correctly
- [ ] Stats load from API
- [ ] Quick action buttons work

## Dependencies

- dashboard/dashboard-layout
- auth/clerk-provider

## Files to Create

- `src/pages/dashboard/index.astro`
- `src/components/dashboard/WelcomeCard.tsx`
- `src/components/dashboard/QuickStats.tsx`

## References

- PLAN.md Phase 5.1
