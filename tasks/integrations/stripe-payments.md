# Task: Stripe Payments

## Description

Integrate Stripe for payment processing.

## Acceptance Criteria

- [ ] Stripe SDK configured
- [ ] Checkout session creation
- [ ] Payment webhook handling
- [ ] Payment status in database
- [ ] Support for Stripe Link

## Test Criteria

- [ ] Checkout redirects to Stripe
- [ ] Successful payment recorded
- [ ] Failed payment handled gracefully
- [ ] Webhook signature verified
- [ ] Test mode works correctly

## Dependencies

- api/auth-middleware
- database/run-migrations

## Environment Variables

```
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## API Endpoints to Implement

| Endpoint | Description |
|----------|-------------|
| `POST /api/payments/checkout` | Create checkout session |
| `POST /api/payments/webhook` | Handle Stripe webhooks |
| `GET /api/payments/status/:id` | Get payment status |

## Webhook Events to Handle

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## References

- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- EQUIPPED.md Backend Services
