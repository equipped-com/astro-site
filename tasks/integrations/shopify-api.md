# Task: Shopify Store API

## Description

Integrate with Shopify Store API for product catalog and orders.

## Acceptance Criteria

- [ ] Shopify API credentials configured
- [ ] Product catalog fetch endpoint
- [ ] Order creation endpoint
- [ ] Order status sync
- [ ] Product inventory check

## Test Criteria

- [ ] Can fetch products from Shopify
- [ ] Can create orders via API
- [ ] Order webhook updates local status
- [ ] Inventory levels accurate

## Dependencies

- api/auth-middleware
- database/run-migrations

## Environment Variables

```
SHOPIFY_STORE_DOMAIN=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_ACCESS_TOKEN=
```

## API Endpoints to Implement

| Endpoint | Description |
|----------|-------------|
| `GET /api/store/products` | List available products |
| `GET /api/store/products/:id` | Get product details |
| `POST /api/store/orders` | Create new order |
| `GET /api/store/orders` | List user's orders |

## References

- [Shopify Admin API](https://shopify.dev/docs/api/admin-rest)
- EQUIPPED.md Backend Services
