# Task: Update Footer Links

## Description

Update footer links to point to internal pages instead of external tryequipped.com URLs.

## Acceptance Criteria

- [ ] Privacy link points to `/privacy`
- [ ] Terms link points to `/terms`
- [ ] Sign in/Sign up links point to internal routes
- [ ] Any other external links updated
- [ ] All links tested and working

## Test Criteria

- [ ] Click Privacy -> navigates to `/privacy`
- [ ] Click Terms -> navigates to `/terms`
- [ ] No 404 errors on footer links
- [ ] Mobile footer links work

## Dependencies

- static-pages/privacy-page
- static-pages/terms-page

## Files to Modify

- `src/pages/index.astro` (footer section)

## Links to Update

Find and replace in footer:

```html
<!-- Old -->
<a href="https://tryequipped.com/privacy">Privacy</a>
<a href="https://tryequipped.com/terms">Terms</a>

<!-- New -->
<a href="/privacy">Privacy</a>
<a href="/terms">Terms</a>
```

## References

- PLAN.md Phase 6.3
