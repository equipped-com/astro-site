# Audit: Dynamic Astro Routes

## Priority: HIGH

## Prerequisites

**READ FIRST:**
- `documentation/dynamic-routing-decision.md` - The chosen approach and rationale
- `bugs/order-details-static-routes` - Reference implementation

This task depends on:
1. `bugs/dynamic-routing-poc` - Establishes the correct pattern
2. `bugs/order-details-static-routes` - First implementation of the pattern

## Purpose

This is an **AUDIT task**, not an implementation task. The goal is to:
1. Find all dynamic routes that need fixing
2. Create individual fix tasks for each one
3. NOT fix them directly in this task

## The Rule

**Astro routes (`[param].astro`) are for STATIC content only:**
- Landing pages, blog posts, documentation, legal pages
- Content that exists at build time and rarely changes

**React components are for DYNAMIC content:**
- Orders, people, devices, proposals
- Any data created at runtime after deployment

## Audit Process

### Step 1: Find All Dynamic Route Files

```bash
# Find all [param].astro files in dashboard
find src/pages/dashboard -name "\\[*\\].astro"

# Check which ones use getStaticPaths with mock data
find src/pages/dashboard -name "\\[*\\].astro" -exec grep -l "getStaticPaths" {} \\;
```

### Step 2: Classify Each Route

For each file found, determine:
- **Route path**: e.g., `/dashboard/orders/[id]`
- **Data type**: What dynamic data does it display?
- **Severity**: How broken is it? (404s on new records = HIGH)
- **Complexity**: How much work to fix? (LOW/MEDIUM/HIGH)

### Step 3: Create Fix Tasks

For EACH route that needs fixing, create a new task file:

**File:** `tasks/bugs/fix-{route-name}-dynamic-route.md`

**Template:**
```markdown
# Fix: {Route Name} Dynamic Route

## Priority: {HIGH/MEDIUM/LOW}

## Prerequisites

**READ FIRST:** `documentation/dynamic-routing-decision.md`

**Reference Implementation:** See `bugs/order-details-static-routes` for the pattern.

## Problem

The {route} page at `src/pages/dashboard/{path}/[id].astro` uses static
`getStaticPaths` for dynamic data.

## Current File

`src/pages/dashboard/{path}/[id].astro`

## Solution

Follow the pattern established in `documentation/dynamic-routing-decision.md`:

1. {Step 1 based on chosen approach}
2. {Step 2}
3. {Step 3}

## Acceptance Criteria

{Copy from decision doc, adapted for this route}

## Dependencies

- bugs/order-details-static-routes (reference implementation)
```

### Step 4: Update tasks/index.yml

Add each new task to the `bugs` epic with proper dependencies:

```yaml
- id: fix-{route-name}-dynamic-route
  name: Fix {Route Name} Dynamic Route
  file: bugs/fix-{route-name}-dynamic-route.md
  done: false
  complexity: {low/medium/high}
  depends_on:
    - bugs/order-details-static-routes
```

## Acceptance Criteria

```gherkin
Feature: Audit Dynamic Routes

  Scenario: Complete audit of all dynamic routes
    Given I run the audit commands
    When I find all [param].astro files with getStaticPaths
    Then I document each one that needs fixing

  Scenario: Create fix tasks for each route
    Given I have identified routes that need fixing
    When I create task files for each one
    Then each task file follows the template above
    And each task references the decision document
    And each task references the order-details fix as pattern

  Scenario: Update task index
    Given I have created fix task files
    When I update tasks/index.yml
    Then each new task is added to the bugs epic
    And each new task depends on order-details-static-routes
    And complexity is set appropriately
```

## Output Checklist

This task is complete when:

- [ ] Ran audit commands and documented all findings
- [ ] Created individual task files for each route needing fix
- [ ] Updated `tasks/index.yml` with all new tasks
- [ ] Each task references `documentation/dynamic-routing-decision.md`
- [ ] Each task references `bugs/order-details-static-routes` as pattern
- [ ] Committed all new task files

## Known Routes to Check

| Route | File | Status |
|-------|------|--------|
| `/dashboard/orders/[id]` | `src/pages/dashboard/orders/[id].astro` | KNOWN BAD - separate task exists |
| `/dashboard/people/[id]` | Check if exists | TBD |
| `/dashboard/devices/[id]` | Check if exists | TBD |
| `/dashboard/proposals/[id]` | Check if exists | TBD |
| `/admin/**` | Check for dynamic routes | TBD |

## Notes

- Do NOT fix routes in this task - only audit and create tasks
- Keep task scope small - one task per route
- All fix tasks should have consistent structure
- The order-details fix is the reference - other fixes should follow the same pattern
