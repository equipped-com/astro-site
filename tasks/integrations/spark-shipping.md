# Task: Spark Shipping

## Description

Integrate Spark Shipping for drop-shipping and logistics.

## Acceptance Criteria

- [ ] Spark Shipping API configured
- [ ] Inventory sync endpoint
- [ ] Order fulfillment trigger
- [ ] Shipment tracking integration
- [ ] Pricing sync

## Test Criteria

- [ ] Inventory levels sync correctly
- [ ] Orders trigger fulfillment
- [ ] Tracking numbers received
- [ ] Pricing updates reflected

## Dependencies

- api/auth-middleware
- integrations/shopify-api

## Environment Variables

```
SPARK_API_KEY=
SPARK_API_URL=
```

## API Endpoints to Implement

| Endpoint | Description |
|----------|-------------|
| `GET /api/shipping/inventory` | Get current inventory |
| `POST /api/shipping/fulfill` | Trigger order fulfillment |
| `GET /api/shipping/track/:order` | Get tracking info |

## Integration Flow

1. Order placed in Shopify
2. Webhook triggers Spark fulfillment
3. Spark ships and provides tracking
4. Tracking synced to customer dashboard

## References

- EQUIPPED.md Backend Services (Spark Shipping)
