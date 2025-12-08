# Task: Device Details View

## Description

Create detailed view for individual device showing all information and history.

## Acceptance Criteria

- [ ] Device details page or modal
- [ ] All device fields displayed
- [ ] Assignment history timeline
- [ ] Edit button opens form modal
- [ ] Delete button with confirmation
- [ ] Back navigation

## Test Criteria

- [ ] Shows correct device data
- [ ] Assignment history loads correctly
- [ ] Edit opens pre-filled form
- [ ] Delete confirmation prevents accidental deletion
- [ ] 404 for non-existent device

## Dependencies

- api/device-crud
- devices/device-list
- devices/device-form

## Files to Create

- `src/pages/dashboard/devices/[id].astro` (optional)
- `src/components/dashboard/DeviceDetails.tsx`
- `src/components/dashboard/AssignmentHistory.tsx`

## Display Sections

1. **Header**: Name, Type icon, Status badge
2. **Details Card**: Model, Serial, Purchase Date, Created/Updated
3. **Current Assignment**: Assigned to, Since date
4. **Assignment History**: Timeline of past assignments
5. **Actions**: Edit, Assign, Retire, Delete

## References

- PLAN.md Phase 5.3
