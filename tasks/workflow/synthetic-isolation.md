# Synthetic Test Data Isolation Patterns

## Description

Document patterns and conventions for isolating synthetic test data from production analytics and reporting. Ensures test accounts, devices, and orders don't pollute real business metrics.

## Dependencies

- `workflow/testing-strategy` - Testing strategy must be defined first

## Acceptance Criteria

- [ ] Email domain convention defined (@test.tryequipped.com)
- [ ] Database flag convention defined (is_synthetic column)
- [ ] Subdomain prefix convention defined (test-*)
- [ ] Analytics exclusion patterns documented (PostHog filters)
- [ ] Revenue report exclusion patterns documented
- [ ] Test data creation guidelines provided
- [ ] Cleanup procedures documented
- [ ] Integration with existing testing docs

## Test Criteria

```gherkin
Feature: Synthetic Test Data Isolation
	As a QA engineer
	I want test data to be properly isolated
	So that it doesn't pollute production analytics

	@REQ-WF-006
	Scenario: Create synthetic test account
		Given I am creating a test account
		When I follow the synthetic data guidelines
		Then the account should:
			| Property              | Value                     |
			| Email domain          | @test.tryequipped.com     |
			| is_synthetic flag     | true                      |
			| Subdomain prefix      | test-*                    |
		And the account should be excluded from:
			| System                | Method                    |
			| PostHog analytics     | is_synthetic filter       |
			| Revenue reports       | is_synthetic flag         |
			| Customer counts       | Email domain filter       |
```

## Implementation

### 1. Create Synthetic Data Guidelines

Create `documentation/synthetic-data-guidelines.md`:

```markdown
# Synthetic Test Data Guidelines

## Overview

Synthetic data is used for testing and development. It must be isolated from production analytics to ensure accurate business metrics.

## Conventions

### 1. Email Addresses

**Production users:**
- Real email addresses (@gmail.com, @company.com, etc.)

**Test users:**
- \`@test.tryequipped.com\` domain
- Format: \`test+[purpose]@test.tryequipped.com\`
- Examples:
  - \`test+e2e-auth@test.tryequipped.com\` (E2E tests)
  - \`test+integration@test.tryequipped.com\` (Integration tests)
  - \`test+manual-qa@test.tryequipped.com\` (Manual QA)

**Clerk test mode:**
- Use Clerk's test mode for development
- Email: \`e2e+clerk_test@example.com\`

### 2. Account Subdomains

**Production accounts:**
- Customer chosen subdomain: \`acme.tryequipped.com\`

**Test accounts:**
- Prefix with \`test-\`: \`test-acme.tryequipped.com\`
- Examples:
  - \`test-demo.tryequipped.com\`
  - \`test-e2e.tryequipped.com\`
  - \`test-integration.tryequipped.com\`

### 3. Database Flag

All tables that store user or account data should have an \`is_synthetic\` flag:

\`\`\`sql
CREATE TABLE accounts (
	id TEXT PRIMARY KEY,
	subdomain TEXT UNIQUE NOT NULL,
	email TEXT NOT NULL,
	is_synthetic INTEGER DEFAULT 0,  -- 1 for test data
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL,
	email TEXT NOT NULL,
	is_synthetic INTEGER DEFAULT 0,  -- 1 for test data
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE devices (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL,
	is_synthetic INTEGER DEFAULT 0,  -- Inherited from account
	FOREIGN KEY (account_id) REFERENCES accounts(id)
);
\`\`\`

**Rules:**
- \`is_synthetic = 1\` for ALL test data
- \`is_synthetic = 0\` for production data
- Child records inherit from parent (devices inherit from account)

### 4. Detection Rules

Automatically mark data as synthetic if:

\`\`\`typescript
function isSyntheticEmail(email: string): boolean {
	return email.endsWith('@test.tryequipped.com') ||
	       email.includes('+clerk_test@');
}

function isSyntheticSubdomain(subdomain: string): boolean {
	return subdomain.startsWith('test-');
}

function shouldMarkSynthetic(account: {
	email: string;
	subdomain: string;
}): boolean {
	return isSyntheticEmail(account.email) ||
	       isSyntheticSubdomain(account.subdomain);
}
\`\`\`

---

## Creating Test Data

### For E2E Tests (Playwright)

\`\`\`typescript
// e2e/fixtures/test-accounts.ts
export const TEST_ACCOUNTS = {
	default: {
		email: 'test+e2e-default@test.tryequipped.com',
		password: process.env.E2E_TEST_PASSWORD,
		subdomain: 'test-e2e',
		is_synthetic: true,
	},
	admin: {
		email: 'test+e2e-admin@test.tryequipped.com',
		password: process.env.E2E_TEST_PASSWORD,
		subdomain: 'test-e2e-admin',
		is_synthetic: true,
	},
};

// In test setup
async function createTestAccount(account: typeof TEST_ACCOUNTS.default) {
	await db.insert(accounts).values({
		id: generateId(),
		email: account.email,
		subdomain: account.subdomain,
		is_synthetic: 1,  // ALWAYS mark as synthetic
		created_at: new Date(),
	});
}
\`\`\`

### For Integration Tests (Vitest)

\`\`\`typescript
// test/fixtures/accounts.ts
export function createMockAccount(overrides?: Partial<Account>) {
	return {
		id: \`test-account-\${Date.now()}\`,
		email: 'test+integration@test.tryequipped.com',
		subdomain: 'test-integration',
		is_synthetic: 1,  // ALWAYS 1 for test data
		...overrides,
	};
}

// In test
describe('Device API', () => {
	beforeEach(async () => {
		// Create synthetic test account
		testAccount = await db.insert(accounts).values(
			createMockAccount()
		).returning();
	});

	afterEach(async () => {
		// Cleanup synthetic data
		await db.delete(accounts).where(eq(accounts.is_synthetic, 1));
	});
});
\`\`\`

### For Manual Testing

\`\`\`typescript
// scripts/create-test-account.ts
import { db } from './db';

async function createTestAccount(subdomain: string) {
	const account = await db.insert(accounts).values({
		id: generateId(),
		email: \`test+manual@test.tryequipped.com\`,
		subdomain: \`test-\${subdomain}\`,  // Prefix with test-
		is_synthetic: 1,  // Mark as synthetic
		created_at: new Date(),
	}).returning();

	console.log('Test account created:');
	console.log(\`  Subdomain: https://\${account.subdomain}.tryequipped.com\`);
	console.log(\`  Email: \${account.email}\`);
	console.log('  ⚠️  This is synthetic data - excluded from analytics');

	return account;
}

// Usage
// bun scripts/create-test-account.ts my-test
\`\`\`

---

## Analytics Exclusion

### PostHog Configuration

When PostHog is integrated, exclude synthetic data:

\`\`\`typescript
// lib/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics(user: User) {
	posthog.init(process.env.POSTHOG_KEY, {
		person_profiles: 'identified_only',
		loaded: (ph) => {
			// Exclude synthetic users
			if (user.is_synthetic) {
				ph.opt_out_capturing();
				console.log('[Analytics] Synthetic user - tracking disabled');
			}
		},
	});

	// Set user properties
	posthog.identify(user.id, {
		email: user.email,
		is_synthetic: user.is_synthetic,  // Tag for filtering
	});
}
\`\`\`

**PostHog filter (in dashboard):**
\`\`\`
Properties:
  is_synthetic = false
\`\`\`

### Revenue Reports

Exclude synthetic data from revenue queries:

\`\`\`typescript
// api/reports/revenue.ts
export async function getMonthlyRevenue(month: string) {
	const orders = await db.select({
		total: sum(orders.total_amount),
	})
	.from(orders)
	.innerJoin(accounts, eq(orders.account_id, accounts.id))
	.where(
		and(
			eq(accounts.is_synthetic, 0),  // Exclude test accounts
			sql\`strftime('%Y-%m', orders.created_at) = \${month}\`
		)
	);

	return orders[0].total;
}
\`\`\`

### Customer Count Reports

Exclude synthetic accounts:

\`\`\`typescript
// api/reports/customers.ts
export async function getActiveCustomers() {
	const count = await db.select({
		count: sql<number>\`count(*)\`,
	})
	.from(accounts)
	.where(
		and(
			eq(accounts.is_synthetic, 0),  // Exclude test accounts
			eq(accounts.status, 'active')
		)
	);

	return count[0].count;
}
\`\`\`

---

## Data Cleanup

### Automated Cleanup (Scheduled Worker)

\`\`\`typescript
// workers/cleanup-synthetic-data.ts
export default {
	async scheduled(event: ScheduledEvent, env: Env) {
		// Delete synthetic data older than 30 days
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 30);

		const result = await env.DB.prepare(\`
			DELETE FROM accounts
			WHERE is_synthetic = 1
			  AND created_at < ?
		\`).bind(cutoffDate.toISOString()).run();

		console.log(\`Cleaned up \${result.meta.changes} synthetic accounts\`);
	},
};

// wrangler.toml
# [triggers]
# crons = ["0 2 * * *"]  # Daily at 2 AM
\`\`\`

### Manual Cleanup Script

\`\`\`bash
#!/bin/bash
# scripts/cleanup-test-data.sh

echo "Cleaning up synthetic test data..."

# Delete synthetic accounts and cascade
wrangler d1 execute equipped-db --command="
  DELETE FROM accounts WHERE is_synthetic = 1;
  DELETE FROM users WHERE is_synthetic = 1;
  DELETE FROM devices WHERE is_synthetic = 1;
  DELETE FROM orders WHERE is_synthetic = 1;
"

echo "✓ Cleanup complete"
\`\`\`

### Cleanup in Tests

\`\`\`typescript
// test/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { db } from '../src/lib/db';

beforeAll(async () => {
	// Clean up any leftover test data
	await db.delete(accounts).where(eq(accounts.is_synthetic, 1));
});

afterAll(async () => {
	// Clean up test data after all tests
	await db.delete(accounts).where(eq(accounts.is_synthetic, 1));
});
\`\`\`

---

## Validation

### Check for Synthetic Data Leaks

\`\`\`typescript
// scripts/validate-synthetic-isolation.ts
import { db } from './db';

async function validateSyntheticIsolation() {
	// Check 1: All test emails are marked synthetic
	const unmarkedTestEmails = await db.select()
		.from(accounts)
		.where(
			and(
				like(accounts.email, '%@test.tryequipped.com'),
				eq(accounts.is_synthetic, 0)  // Should be 1
			)
		);

	if (unmarkedTestEmails.length > 0) {
		console.error('❌ Test emails not marked synthetic:');
		console.table(unmarkedTestEmails);
	}

	// Check 2: All test- subdomains are marked synthetic
	const unmarkedTestSubdomains = await db.select()
		.from(accounts)
		.where(
			and(
				like(accounts.subdomain, 'test-%'),
				eq(accounts.is_synthetic, 0)
			)
		);

	if (unmarkedTestSubdomains.length > 0) {
		console.error('❌ Test subdomains not marked synthetic:');
		console.table(unmarkedTestSubdomains);
	}

	// Check 3: No synthetic data in revenue reports
	const syntheticRevenue = await db.select({
		total: sum(orders.total_amount),
	})
	.from(orders)
	.innerJoin(accounts, eq(orders.account_id, accounts.id))
	.where(eq(accounts.is_synthetic, 1));

	if (syntheticRevenue[0].total > 0) {
		console.warn(\`⚠️  Synthetic revenue exists: \${syntheticRevenue[0].total}\`);
		console.warn('   Ensure revenue queries exclude is_synthetic = 1');
	}

	console.log('✓ Synthetic isolation validation complete');
}

// Run validation
validateSyntheticIsolation();
\`\`\`

---

## Summary

### Required Conventions

| Convention       | Rule                              | Example                          |
|------------------|-----------------------------------|----------------------------------|
| Email domain     | @test.tryequipped.com             | test+e2e@test.tryequipped.com    |
| Subdomain prefix | test-*                            | test-e2e.tryequipped.com         |
| Database flag    | is_synthetic = 1                  | All test records                 |

### Exclusion Points

| System           | Method                            |
|------------------|-----------------------------------|
| Analytics        | is_synthetic filter in PostHog    |
| Revenue reports  | WHERE is_synthetic = 0            |
| Customer counts  | WHERE is_synthetic = 0            |
| Marketing emails | Email domain filter               |

### Key Principles

1. **ALWAYS mark test data** with \`is_synthetic = 1\`
2. **ALWAYS use test email domain** (@test.tryequipped.com)
3. **ALWAYS prefix test subdomains** with \`test-\`
4. **NEVER include synthetic data** in production reports
5. **AUTOMATE cleanup** of old test data

---

## References

- PostHog filtering: https://posthog.com/docs/data/filters
- Database schema: migrations/initial-schema.sql
- Test fixtures: test/fixtures/
\`\`\`

### 2. Add Synthetic Flag to Existing Schemas

Update `migrations/add-synthetic-flags.sql`:

```sql
-- Add is_synthetic flag to all tables
-- Run this migration to add synthetic data isolation

ALTER TABLE accounts ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN is_synthetic INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN is_synthetic INTEGER DEFAULT 0;

-- Create index for efficient filtering
CREATE INDEX idx_accounts_synthetic ON accounts(is_synthetic);
CREATE INDEX idx_users_synthetic ON users(is_synthetic);

-- Mark existing test data
UPDATE accounts SET is_synthetic = 1
WHERE email LIKE '%@test.tryequipped.com'
   OR subdomain LIKE 'test-%';

UPDATE users SET is_synthetic = 1
WHERE email LIKE '%@test.tryequipped.com';
```

### 3. Update Testing Documentation

Add to `documentation/e2e-testing-with-clerk.md`:

```markdown
## Synthetic Data Isolation

All E2E test accounts MUST use synthetic data conventions:

- Email: \`test+e2e@test.tryequipped.com\`
- Subdomain: \`test-e2e.tryequipped.com\`
- Database flag: \`is_synthetic = 1\`

See `documentation/synthetic-data-guidelines.md` for full details.
```

## Files to Create/Modify

**Create:**
- `documentation/synthetic-data-guidelines.md` - Complete isolation guide
- `migrations/add-synthetic-flags.sql` - Add is_synthetic columns
- `scripts/validate-synthetic-isolation.ts` - Validation script
- `scripts/cleanup-test-data.sh` - Cleanup script

**Modify:**
- `documentation/e2e-testing-with-clerk.md` - Add synthetic data reference

## Notes

- Synthetic data isolation prevents skewed business metrics
- Automated validation catches accidental data leaks
- Cleanup procedures prevent test data buildup

## References

- documentation/PRDs/workflow.md (REQ-WF-006)
- documentation/e2e-testing-with-clerk.md (E2E test setup)
- tasks/testing/setup-vitest.md (Integration test fixtures)
