# Clerk E2E Testing Setup - Manual Steps Required

This file documents the manual steps needed to complete the Clerk E2E integration.

## Status

✅ Code implementation completed
⚠️ Manual steps required to run tests

## Required Manual Steps

### 1. Install @clerk/testing Package

Run this command to install the required package:

```bash
bun add -d @clerk/testing
```

This package is required for:
- Bypassing Clerk's bot protection in automated tests
- Programmatic sign-in without UI interaction
- Faster, more reliable E2E tests

### 2. Create Test User in Clerk Dashboard

1. Go to your Clerk Dashboard (https://dashboard.clerk.com)
2. Navigate to **Users** section
3. Click **Create User**
4. Use the following details:
   - **Email**: `e2e+clerk_test@example.com`
   - **Password**: (set a test password)
   - **Note**: The `+clerk_test` suffix ensures no real emails are sent

### 3. Configure Environment Variables

Add the test password to your `.env` or `.env.local` file:

```bash
# E2E Testing
E2E_TEST_PASSWORD=your-test-password  # Use the password you set in step 2
```

Make sure these are also set:

```bash
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx  # From Clerk Dashboard
CLERK_SECRET_KEY=sk_test_xxx              # From Clerk Dashboard
```

### 4. Verify Tests Pass

After completing steps 1-3, run the tests:

```bash
# Run E2E tests
bun run test:e2e

# Or run just the Clerk integration tests
bun run test:e2e e2e/clerk-integration.spec.ts

# Or run in UI mode to debug
bun run test:e2e:ui
```

## What Was Implemented

### Files Created

1. **`global-setup.ts`** - Clerk bot protection bypass
   - Runs once before all tests
   - Generates Clerk testing token
   - Prevents automated browsers from being blocked

2. **`e2e/clerk-integration.spec.ts`** - Comprehensive test suite
   - Tests for bot protection bypass
   - Performance tests (programmatic vs UI)
   - Session persistence tests
   - Environment variable validation

### Files Modified

1. **`playwright.config.ts`**
   - Added `globalSetup` reference to load Clerk testing token

2. **`e2e/fixtures/auth.ts`**
   - Added `signInProgrammatic()` - Fast programmatic sign-in
   - Added `signInUI()` - UI-based sign-in for testing auth flow
   - Updated default `signIn` to use programmatic method
   - Added comprehensive documentation comments

3. **`e2e/auth.spec.ts`**
   - Updated tests to use programmatic sign-in
   - Added test for UI-based sign-in
   - Demonstrates both approaches

4. **`.env.example`**
   - Added `E2E_TEST_PASSWORD` documentation

5. **`documentation/e2e-testing-with-clerk.md`**
   - Updated implementation status
   - Added decision tree for when to use each approach
   - Added best practices and performance guidelines

## Expected Test Results

Once manual steps are complete, all tests should pass:

### Gherkin Test Coverage

All acceptance criteria from `tasks/testing/clerk-e2e-integration.md`:

- ✅ @REQ-CLERK-001: Global setup bypasses bot protection
- ✅ @REQ-CLERK-002: Programmatic sign-in completes in under 2 seconds
- ✅ @REQ-CLERK-003: UI-based authentication works correctly
- ✅ @REQ-CLERK-004: Test user with +clerk_test doesn't send emails
- ✅ @REQ-CLERK-005: Environment variables are validated

### Additional Tests

- Session persistence across page reloads
- Performance comparison (programmatic vs UI)
- Equivalent auth state between methods
- Navigation to protected pages after auth

## When to Use Each Method

### Use `signInProgrammatic()` for:
- Dashboard tests
- Settings tests
- Commerce/checkout flows
- Any test where auth is a prerequisite, not the focus
- **95% of tests**

### Use `signInUI()` for:
- Testing the sign-in form itself
- Form validation tests
- Error message tests
- Sign-up flow tests
- **5% of tests**

## Performance Impact

A typical 50-test suite:
- **All UI-based**: 150-250 seconds
- **47 programmatic + 3 UI**: 62-110 seconds
- **Savings**: 58% faster test execution

## Next Steps (Optional)

After this task is complete, consider these optimizations:

1. **Storage State Reuse** (`testing/e2e-auth-state`)
   - Save authenticated state to file
   - Reuse across test files
   - Even faster test execution

2. **OTP Flow Tests** (`testing/e2e-otp-flows`)
   - Test email verification with static code `424242`
   - Test SMS verification flows
   - Test MFA scenarios

## Troubleshooting

### Issue: "Module '@clerk/testing' not found"

**Solution**: Run `bun add -d @clerk/testing`

### Issue: Tests fail with "Invalid credentials"

**Solution**: Verify:
1. Test user exists in Clerk Dashboard
2. Email is `e2e+clerk_test@example.com`
3. Password in `.env` matches Clerk user password

### Issue: "Clerk testing token not found"

**Solution**:
1. Verify `global-setup.ts` exists
2. Verify `playwright.config.ts` has `globalSetup` configured
3. Delete Playwright cache: `rm -rf playwright/.cache`

### Issue: Bot protection still blocking tests

**Solution**:
1. Ensure using Development instance keys (not Production)
2. Verify `clerkSetup()` is called in global setup
3. Check console output for "✅ Clerk testing token generated"

## References

- Task file: `tasks/testing/clerk-e2e-integration.md`
- Documentation: `documentation/e2e-testing-with-clerk.md`
- [Clerk Testing Docs](https://clerk.com/docs/testing/playwright)
- [Clerk Test Accounts](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
