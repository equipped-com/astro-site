# Task: Alchemy API

## Description

Integrate Alchemy APIs for device valuation and lookup.

## Acceptance Criteria

- [ ] Alchemy API credentials configured
- [ ] Trade-in valuation endpoint
- [ ] Serial number lookup
- [ ] FindMy status check for trade-ins
- [ ] Model information lookup

## Test Criteria

- [ ] Can get trade-in value by serial
- [ ] Model lookup returns device info
- [ ] FindMy status checked before trade-in
- [ ] Error handling for invalid serials

## Dependencies

- api/auth-middleware

## Environment Variables

```
ALCHEMY_API_KEY=
ALCHEMY_API_URL=
```

## API Endpoints to Implement

| Endpoint | Description |
|----------|-------------|
| `GET /api/valuation/:serial` | Get trade-in value |
| `GET /api/lookup/:serial` | Look up device by serial |
| `GET /api/findmy/:serial` | Check FindMy lock status |

## Use Cases

1. **Trade-in**: Customer wants to trade device, get value quote
2. **Verification**: Verify device specs before purchase
3. **FindMy Check**: Ensure device isn't locked before resale

## References

- EQUIPPED.md Backend Services (Alchemy APIs)
