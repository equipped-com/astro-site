# Task: Install Clerk SDK

## Description

Install the Clerk React SDK for frontend authentication.

## Acceptance Criteria

- [ ] `@clerk/clerk-react` installed as dependency
- [ ] Clerk environment variables documented
- [ ] TypeScript types available

## Test Criteria

- [ ] `npm install @clerk/clerk-react` succeeds
- [ ] Import statement works: `import { ClerkProvider } from '@clerk/clerk-react'`
- [ ] No TypeScript errors related to Clerk

## Dependencies

None

## Commands

```bash
npm install @clerk/clerk-react
```

## Environment Variables Needed

```
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx  # For worker/API
```

## Files to Modify

- `package.json` (dependency added)

## References

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Environment Variables](https://clerk.com/docs/deployments/clerk-environment-variables)
- PLAN.md Phase 2.2
