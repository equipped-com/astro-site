# Environment Variable Management Strategy

## Description

Implement a unified environment variable configuration strategy across Astro, Vitest, Playwright, and Clerk testing. Ensures consistent .env file handling and proper variable availability in all testing contexts.

## Dependencies

- `workflow/testing-strategy` - Testing strategy must be defined first
- `testing/setup-vitest` - Vitest must be configured
- `testing/setup-playwright` - Playwright must be set up
- `testing/clerk-e2e-integration` - Clerk E2E testing integration

## Acceptance Criteria

- [x] Create `.env.test` file with test-specific environment variables
- [x] Configure Vitest to load ALL environment variables (not just VITE_* prefixed)
- [x] Configure Playwright to load .env.test using dotenv
- [x] Move dotenv from runtime dependency to devDependency
- [x] Add both PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_PUBLISHABLE_KEY to .env files
- [x] Update .env.example with documentation for dual Clerk keys
- [x] Document framework-specific environment variable behavior
- [x] Add environment variable strategy to workflow PRD

## Test Criteria

```gherkin
Feature: Unified Environment Variable Strategy
	As a developer
	I want consistent environment variable handling across all test frameworks
	So that tests have access to required configuration without manual setup

	@REQ-WF-007
	Scenario: Environment variables loaded in Vitest
		Given I am running unit tests with Vitest
		When Vitest initializes
		Then it should load ALL environment variables from .env.test
		And variables should include Clerk, Stripe, and other service credentials
		And both PUBLIC_ and non-PUBLIC_ prefixed variables should be available

	@REQ-WF-007
	Scenario: Environment variables loaded in Playwright
		Given I am running E2E tests with Playwright
		When Playwright initializes
		Then it should load environment variables from .env.test using dotenv
		And CLERK_PUBLISHABLE_KEY should be available for @clerk/testing
		And CLERK_SECRET_KEY should be available for @clerk/testing

	@REQ-WF-007
	Scenario: Environment variables in Astro
		Given I am running the Astro dev server
		When Astro loads
		Then it should natively load .env.local for development
		And PUBLIC_ prefixed variables should be exposed to client-side code
		And non-PUBLIC_ variables should only be available server-side

	@REQ-WF-007
	Scenario: Dual Clerk keys for compatibility
		Given I need Clerk authentication in tests
		When I configure environment variables
		Then .env files should include both:
			| Variable                      | Purpose                           |
			| PUBLIC_CLERK_PUBLISHABLE_KEY  | Astro client-side access          |
			| CLERK_PUBLISHABLE_KEY         | @clerk/testing E2E setup          |
			| CLERK_SECRET_KEY              | Server-side and test authentication |
		And both publishable keys should have the same value
```

## Implementation

### 1. Create .env.test File

Create `.env.test` with test-specific configuration:

```bash
# Test Environment Variables
# Loaded automatically by Vitest and Playwright during test runs

# Clerk Authentication (Test Instance)
# Both versions needed: PUBLIC_ prefix for Astro client-side, non-prefixed for @clerk/testing
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_test

# E2E Testing
E2E_TEST_PASSWORD=test-password-123

# Sentry (disabled in tests)
PUBLIC_SENTRY_DSN=
PUBLIC_APP_VERSION=1.0.0-test

# Stripe (test mode)
STRIPE_API_KEY=sk_test_mock
STRIPE_PUBLISHABLE_API_KEY=pk_test_mock
STRIPE_WEBHOOK_SECRET=whsec_test

# Shopify (test/mock)
SHOPIFY_ACCESS_TOKEN=test_token
SHOPIFY_DOMAIN=test.myshopify.com
SHOPIFY_CLIENT_SECRET=test_secret
SHOPIFY_STORE_NAME=test

# Alchemy (test/mock)
ALCHEMY_BASE_URI=https://api.test.alchemy-connect.com/trading/v1
ALCHEMY_CLIENT_SECRET=test-secret
ALCHEMY_PROGRAM_ID=test-program-id
```

### 2. Configure Vitest to Load All Environment Variables

Update `vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react'
import { getViteConfig } from 'astro/config'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Load ALL environment variables from .env files (not just VITE_* prefixed)
// This ensures Clerk, Stripe, and other test vars are available in tests
const testEnv = loadEnv('test', process.cwd(), '')

export default defineConfig(
	getViteConfig({
		plugins: [react()],
		test: {
			env: testEnv,
			globals: true,
			environment: 'happy-dom',
			setupFiles: ['./src/test/setup.ts', './src/test/dom-setup.ts'],
			// ... rest of config
		},
	}),
)
```

**Key Changes:**
- Import `loadEnv` from 'vite'
- Call `loadEnv('test', process.cwd(), '')` to load ALL variables (empty string prefix)
- Pass loaded env to `test.env` configuration

### 3. Configure Playwright to Load .env.test

Update `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Load .env.test for E2E tests (Playwright doesn't auto-load .env files)
// This makes CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY available for @clerk/testing
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
	testDir: './e2e',
	globalSetup: './e2e/clerk-global-setup',
	// ... rest of config
})
```

**Key Changes:**
- Import dotenv
- Use ES module workaround for __dirname (fileURLToPath)
- Call `dotenv.config()` with explicit path to .env.test

### 4. Move dotenv to devDependencies

Update `package.json`:

```bash
# Remove from runtime dependencies
bun remove dotenv

# Add as dev dependency
bun add -d dotenv
```

**Rationale:**
- Astro natively supports .env via Vite (no dotenv needed in runtime)
- Vitest uses Vite's loadEnv (no dotenv needed)
- Only Playwright needs dotenv, which is a dev/test tool

### 5. Update .env.example

Update `.env.example` to document dual Clerk keys:

```bash
# Clerk Authentication
# Note: CLERK_PUBLISHABLE_KEY appears twice:
#   - PUBLIC_ prefix: Exposed to Astro client-side code
#   - No prefix: Required by @clerk/testing for E2E tests
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx  # Client-side (PUBLIC_ prefix for Astro)
CLERK_PUBLISHABLE_KEY=pk_test_xxx         # Required by @clerk/testing (same value as above)
CLERK_SECRET_KEY=sk_test_xxx              # Server-side only
CLERK_WEBHOOK_SECRET=whsec_xxx            # Webhook signature verification

# E2E Testing
E2E_TEST_PASSWORD=your-test-password      # Password for e2e+clerk_test@example.com test user

# Sentry Error Tracking
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx  # Client-side Sentry DSN
PUBLIC_APP_VERSION=1.0.0                     # App version for release tracking
```

### 6. Update .env.local

Add the non-prefixed CLERK_PUBLISHABLE_KEY to `.env.local`:

```bash
# Clerk Authentication
# Both versions needed: PUBLIC_ prefix for Astro client-side, non-prefixed for @clerk/testing
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

## Framework-Specific Behavior

### Astro (via Vite)

- **Native .env support**: Loads `.env`, `.env.local`, `.env.[mode]` files automatically
- **PUBLIC_ prefix**: Variables with `PUBLIC_` prefix are exposed to client-side code
- **No dotenv needed**: Vite handles .env loading
- **Files loaded** (in order of precedence):
  1. `.env.local` (development, highest priority)
  2. `.env.production` or `.env.development` (based on mode)
  3. `.env` (base config, lowest priority)

### Vitest (via Vite)

- **Inherits Vite's .env loading**: Same as Astro
- **Default behavior**: Only loads `VITE_*` prefixed variables
- **Override**: Use `loadEnv(mode, cwd, '')` to load ALL variables
- **Mode**: Defaults to 'test' when running tests
- **File used**: `.env.test` (mode-specific file)

### Playwright

- **No auto-loading**: Does NOT automatically load .env files
- **Manual configuration**: Requires `dotenv.config()` in `playwright.config.ts`
- **Explicit path**: Must specify path to `.env.test`
- **ES modules**: Requires `fileURLToPath` workaround for `__dirname`

### Clerk Testing (@clerk/testing)

- **Requires non-prefixed keys**: Expects `CLERK_PUBLISHABLE_KEY` (not `PUBLIC_CLERK_PUBLISHABLE_KEY`)
- **Also requires**: `CLERK_SECRET_KEY`
- **Used in**: `clerkSetup()` function in global setup
- **Solution**: Define both prefixed and non-prefixed versions with same value

## File Structure

```
.env.example      # Template with documentation
.env.local        # Development (gitignored)
.env.test         # Test environment (gitignored)
.gitignore        # Excludes .env.* except .env.example
vitest.config.ts  # Configured to load ALL env vars
playwright.config.ts  # Configured to load .env.test via dotenv
package.json      # dotenv as devDependency
```

## Files to Create/Modify

**Create:**
- `.env.test` - Test-specific environment variables

**Modify:**
- `vitest.config.ts` - Add `loadEnv()` to load all environment variables
- `playwright.config.ts` - Add `dotenv.config()` to load .env.test
- `.env.example` - Document dual Clerk key requirement
- `.env.local` - Add non-prefixed CLERK_PUBLISHABLE_KEY
- `package.json` - Move dotenv to devDependencies (via bun commands)

## Validation

Run tests to verify environment variables are loaded:

```bash
# Vitest should have access to all env vars
bun run test -- src/lib/sentry.test.ts

# Playwright should have access to Clerk keys
bun run test:e2e -- e2e/clerk-integration.spec.ts
```

## Notes

- This strategy eliminates the need for manual `dotenv.config()` in test files
- All frameworks now have consistent access to environment variables
- Clerk testing works correctly with both prefixed and non-prefixed keys
- The solution follows each framework's best practices

## References

- documentation/PRDs/workflow.md (REQ-WF-007)
- Astro env docs: https://docs.astro.build/en/guides/environment-variables/
- Vitest env docs: https://vitest.dev/guide/features
- Vite env docs: https://vite.dev/guide/env-and-mode
- Playwright env guide: https://www.browserstack.com/guide/playwright-env-variables
- Clerk testing docs: https://clerk.com/docs/testing/playwright/overview
