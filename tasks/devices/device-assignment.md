# Task: Device Assignment

## Description

Create UI and API integration for assigning devices to employees.

## Acceptance Criteria

- [ ] Assign button on device row/details
- [ ] Assignment modal with employee email/name
- [ ] Unassign option
- [ ] Assignment recorded in history
- [ ] Email notification (optional, future)

## Test Criteria

- [ ] Can assign device to employee
- [ ] Can unassign (return device)
- [ ] Assignment shows in device details
- [ ] History updated with assignment/return
- [ ] Cannot assign already-assigned device without unassigning

## Dependencies

- api/device-crud
- devices/device-list

## Files to Create

- `src/components/dashboard/AssignDeviceModal.tsx`

## Assignment Flow

1. User clicks "Assign" on device
2. Modal opens with employee email/name fields
3. Submit calls `POST /api/devices/:id/assign`
4. Device `assigned_to` updated
5. New record in `device_assignments` table
6. UI updates to show assignment

## API Endpoint

```
POST /api/devices/:id/assign
Body: { assigned_to_email: string, assigned_to_name?: string }
Response: { assignment: DeviceAssignment }
```

## References

- PLAN.md Phase 4.2
- EQUIPPED.md - assign devices to employees
