# Task: Device List View

## Description

Create the main device list view with table/grid display.

## Acceptance Criteria

- [ ] `src/pages/dashboard/devices.astro` created
- [ ] Device table with columns: Name, Type, Model, Status, Assigned To
- [ ] Sortable columns
- [ ] Filter by status (active, pending, retired)
- [ ] Search by name/serial number
- [ ] Pagination or infinite scroll

## Test Criteria

- [ ] Table displays device data from API
- [ ] Sorting works on all columns
- [ ] Filter reduces displayed results
- [ ] Search finds matching devices
- [ ] Empty state shows when no devices
- [ ] Loading state while fetching

## Dependencies

- api/device-crud
- dashboard/dashboard-layout
- dashboard/loading-states
- dashboard/empty-states

## Files to Create

- `src/pages/dashboard/devices.astro`
- `src/components/dashboard/DeviceList.tsx`
- `src/components/dashboard/DeviceTable.tsx`

## Table Columns

| Column | Field | Sortable | Filterable |
|--------|-------|----------|------------|
| Name | `name` | Yes | Search |
| Type | `type` | Yes | Dropdown |
| Model | `model` | Yes | - |
| Status | `status` | Yes | Dropdown |
| Assigned To | `assigned_to` | Yes | Search |
| Actions | - | No | - |

## References

- [TanStack Table](https://tanstack.com/table/latest)
- [shadcn Data Table](https://ui.shadcn.com/docs/components/data-table)
- PLAN.md Phase 5.3
