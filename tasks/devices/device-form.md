# Task: Device Form

## Description

Create modal form for adding and editing devices.

## Acceptance Criteria

- [ ] Modal dialog component
- [ ] Form fields: Name, Type, Model, Serial Number, Purchase Date
- [ ] Type dropdown: MacBook, iPad, iPhone, Monitor, Accessory
- [ ] Validation (name required, type required)
- [ ] Submit creates/updates device via API
- [ ] Success toast notification
- [ ] Error handling

## Test Criteria

- [ ] Modal opens on "Add Device" click
- [ ] Form validates required fields
- [ ] Submit sends correct data to API
- [ ] Modal closes on success
- [ ] Error displayed on failure
- [ ] Edit mode pre-fills existing data

## Dependencies

- api/device-crud
- dashboard/dashboard-layout

## Files to Create

- `src/components/dashboard/DeviceFormModal.tsx`
- `src/components/dashboard/DeviceForm.tsx`

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | Yes | min 1 char |
| Type | select | Yes | enum values |
| Model | text | No | - |
| Serial Number | text | No | - |
| Purchase Date | date | No | valid date |
| Status | select | No | default: active |

## Device Types

```typescript
const deviceTypes = [
  { value: 'macbook', label: 'MacBook' },
  { value: 'ipad', label: 'iPad' },
  { value: 'iphone', label: 'iPhone' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'accessory', label: 'Accessory' },
]
```

## References

- [React Hook Form](https://react-hook-form.com/)
- [shadcn Form](https://ui.shadcn.com/docs/components/form)
- [shadcn Dialog](https://ui.shadcn.com/docs/components/dialog)
- PLAN.md Phase 5.3
