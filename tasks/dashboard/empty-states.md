# Task: Empty States

## Description

Create empty state components for when there's no data to display.

## Acceptance Criteria

- [ ] Generic empty state component
- [ ] "No devices yet" state with illustration
- [ ] Call-to-action button (Add device)
- [ ] Friendly, encouraging messaging
- [ ] Consistent styling with dashboard

## Test Criteria

- [ ] Empty state shows when device list is empty
- [ ] CTA button navigates to correct action
- [ ] Illustration/icon displays correctly
- [ ] Message is clear and actionable

## Dependencies

- dashboard/dashboard-layout

## Files to Create

- `src/components/dashboard/EmptyState.tsx`

## Usage

```tsx
<EmptyState
  icon={<Laptop className="w-16 h-16" />}
  title="No devices yet"
  description="Add your first device to start tracking your fleet"
  action={{
    label: "Add Device",
    onClick: () => setShowAddModal(true)
  }}
/>
```

## References

- [serafimcloud Empty State](https://21st.dev/serafimcloud/empty-state)
- PLAN.md Phase 5.3
