# Task: Fleet Management

## Description

Implement fleet management features including asset valuation and depreciation tracking.

## Acceptance Criteria

- [ ] Asset valuation calculation
- [ ] Depreciation tracking over time
- [ ] Fleet overview dashboard
- [ ] Value reports and export
- [ ] Asset lifecycle visualization

## Test Criteria

- [ ] Valuation calculates correctly based on device age/condition
- [ ] Depreciation updates automatically
- [ ] Reports generate accurately
- [ ] Dashboard shows fleet totals

## Dependencies

- devices/device-list
- api/device-crud

## Features from EQUIPPED.md

> "Fleet management: we can help you manage your fleet of devices. Including showing asset valuation and depreciation."

## Database Changes

May need new table or columns:
- `devices.purchase_price`
- `devices.current_value`
- `devices.depreciation_rate`
- `asset_valuations` table for historical tracking

## Priority

Backlog - implement after core device management

## References

- EQUIPPED.md Capabilities (In progress/PoC)
