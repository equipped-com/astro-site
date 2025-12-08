# Task: Leasing Workflow

## Description

Implement leasing workflow for customers who want predictable monthly payments.

## Acceptance Criteria

- [ ] Leasing option at checkout
- [ ] Lender approval integration (Macquarie)
- [ ] Monthly payment calculation
- [ ] Lease agreement generation
- [ ] Payment tracking and reminders

## Test Criteria

- [ ] Leasing option displays at checkout
- [ ] Approval flow works correctly
- [ ] Monthly payments calculated accurately
- [ ] Agreements generated correctly
- [ ] Payment status tracked

## Dependencies

- integrations/stripe-payments
- integrations/shopify-api

## Features from EQUIPPED.md

> "Leasing: we can help you lease devices so you have a predictable 'monthly/per user' cash flow (may require lender approval)."

## Leasing Partners

- Macquarie (mentioned in EQUIPPED.md)
- Other equipment financing providers

## Workflow

1. Customer selects leasing at checkout
2. Credit application submitted to lender
3. Lender reviews and approves/declines
4. If approved, lease terms presented
5. Customer signs agreement
6. Device shipped, payments begin
7. Monthly payments tracked in dashboard

## Database Changes

New tables:
```sql
CREATE TABLE lease_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    order_id TEXT,
    lender TEXT NOT NULL,
    status TEXT, -- 'pending', 'approved', 'declined'
    amount DECIMAL,
    term_months INTEGER,
    monthly_payment DECIMAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lease_payments (
    id TEXT PRIMARY KEY,
    lease_id TEXT NOT NULL REFERENCES lease_applications(id),
    due_date DATE NOT NULL,
    amount DECIMAL NOT NULL,
    paid_at DATETIME,
    status TEXT -- 'pending', 'paid', 'overdue'
);
```

## Priority

Backlog - alternative payment option

## References

- EQUIPPED.md Capabilities
- Affirm integration (existing per EQUIPPED.md)
