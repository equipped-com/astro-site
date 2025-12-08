# Task: Create Clerk Application

## Description

Create a new Clerk application in the Clerk dashboard and configure sign-in methods.

## Acceptance Criteria

- [ ] Clerk account created (if not exists)
- [ ] New application created in Clerk dashboard
- [ ] Sign-in methods configured (email + Google OAuth recommended)
- [ ] Publishable key obtained
- [ ] Secret key obtained
- [ ] Redirect URLs configured for local dev and production

## Test Criteria

- [ ] Can access Clerk dashboard
- [ ] Keys work when used in code
- [ ] Sign-in flow accessible via Clerk hosted UI

## Dependencies

None (dashboard task)

## Configuration Steps

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com/)
2. Create new application or select existing
3. Configure Authentication:
   - Enable Email
   - Enable Google OAuth (optional but recommended)
4. Get API keys from "API Keys" section
5. Configure URLs in "Paths" section:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

## Environment Variables to Set

Add to `.env` (local) and CloudFlare dashboard (production):

```
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

## References

- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Clerk Sign-in Methods](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options)
- PLAN.md Phase 2.1
