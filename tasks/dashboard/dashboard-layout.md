# Task: Dashboard Layout

## Description

Create the main dashboard layout with header and sidebar structure.

## Acceptance Criteria

- [ ] `DashboardLayout.astro` created
- [ ] Header with logo and user menu
- [ ] Sidebar placeholder area
- [ ] Main content area
- [ ] Responsive design (sidebar collapses on mobile)
- [ ] Dark theme matching landing page

## Test Criteria

- [ ] Layout renders without errors
- [ ] Sidebar visible on desktop
- [ ] Sidebar hidden/collapsed on mobile
- [ ] User menu shows signed-in user
- [ ] Navigation works between sections

## Dependencies

- auth/clerk-provider

## Files to Create

- `src/layouts/DashboardLayout.astro`
- `src/components/dashboard/DashboardHeader.tsx`

## Structure

```
┌─────────────────────────────────────────┐
│ Header (logo, breadcrumb, user menu)    │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │   Main Content Area           │
│         │                               │
│         │                               │
└─────────┴───────────────────────────────┘
```

## References

- [Aceternity Sidebar](https://21st.dev/aceternity/sidebar/default)
- PLAN.md Phase 5.1
