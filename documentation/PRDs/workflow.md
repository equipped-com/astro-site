# Task Workflow & Automation - PRD

**Version**: 1.0
**Last Updated**: December 2025
**Status**: Planning
**Type**: Process Improvement (NOT Product Features)

## Executive Summary

This PRD defines the **process** for how we prepare, generate, execute, and validate product requirements and tasks. This is separate from product feature PRDs.

**Scope:**
- PRD preparation and scoping guidelines
- Automated task generation from PRDs
- Task dependency management and validation
- Testing strategy guidelines (unit/integration/E2E)
- Rollback and recovery procedures
- Synthetic data isolation patterns

**Out of Scope:**
- Product features (those belong in main PRD.md)
- User-facing functionality
- Business requirements

## Problem Statement

Currently we lack standardized processes for:
1. **PRD Preparation**: No checklist for scoping and researching PRDs before implementation
2. **Task Generation**: Manual process to extract tasks from PRD requirements
3. **Testing Strategy**: Unclear when to write unit vs integration vs E2E tests
4. **Dependency Tracking**: Tasks depend on others but validation is manual
5. **Rollback**: No documented recovery process when tasks fail
6. **Synthetic Data**: Test data can leak into production analytics

## Requirements

### REQ-WF-001: PRD Preparation Checklist
```gherkin
Feature: PRD Preparation Guidelines
  As a product manager or engineer
  I want a standardized checklist for preparing PRDs
  So that PRDs are well-scoped before implementation starts

  Scenario: PRD Preparation Checklist
    Given I am preparing a new PRD
    When I follow the preparation checklist
    Then I should have:
      | Item                          | Required |
      | Problem statement             | Yes      |
      | Target personas               | Yes      |
      | Success metrics               | Yes      |
      | Technical feasibility research| Yes      |
      | Dependency analysis           | Yes      |
      | Test strategy defined         | Yes      |
      | Rollback plan                 | Yes      |
```

### REQ-WF-002: Automated Task Generation
```gherkin
Feature: Task Generation from PRD
  As an engineer
  I want to automatically generate tasks from PRD requirements
  So that I don't manually extract requirements into task files

  Scenario: Generate tasks from Gherkin scenarios
    Given I have a PRD with Gherkin requirements
    When I run the task generation script
    Then tasks should be created in tasks/{epic}/{task}.md
    And tasks/index.yml should be updated
    And dependencies should be inferred from requirements
```

### REQ-WF-003: Task Dependency Validation
```gherkin
Feature: Task Dependency Management
  As an engineer
  I want automated dependency validation
  So that I know which tasks are ready to work on

  Scenario: Validate task is ready
    Given a task has dependencies listed
    When I check task readiness
    Then the system should verify all dependencies are complete
    And show which dependencies are blocking
```

### REQ-WF-004: Testing Strategy Guidelines
```gherkin
Feature: Testing Strategy Decision Tree
  As a developer
  I want clear guidelines on when to write which type of test
  So that I test appropriately without over-testing or under-testing

  Scenario: Decide test type for a feature
    Given I am implementing a feature
    When I consult the testing decision tree
    Then I should know:
      | Question                          | Answer Leads To      |
      | Is this a UI component?           | Component test       |
      | Is this business logic?           | Unit test            |
      | Is this an API endpoint?          | Integration test     |
      | Is this a critical user flow?     | E2E test             |
      | Is this a bug fix?                | Regression test      |
```

### REQ-WF-005: Rollback Procedures
```gherkin
Feature: Rollback and Recovery
  As a developer
  I want documented rollback procedures
  So that I can safely revert failed changes

  Scenario: Rollback a failed task
    Given a task implementation caused production issues
    When I need to rollback
    Then I should have documented steps for:
      | Step                          | Action                    |
      | Identify failing commit       | git bisect / task hash    |
      | Revert database migrations    | Rollback SQL scripts      |
      | Restore previous deploy       | CloudFlare rollback       |
      | Mark task as incomplete       | Update tasks/index.yml    |
```

### REQ-WF-006: Synthetic Data Isolation
```gherkin
Feature: Synthetic Test Data Isolation
  As a QA engineer
  I want test data to be properly isolated
  So that it doesn't pollute production analytics

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

### REQ-WF-007: Environment Variable Management
```gherkin
Feature: Unified Environment Variable Strategy
  As a developer
  I want consistent environment variable handling across all test frameworks
  So that tests have access to required configuration without manual setup

  Scenario: Environment variables loaded in Vitest
    Given I am running unit tests with Vitest
    When Vitest initializes
    Then it should load ALL environment variables from .env.test
    And variables should include Clerk, Stripe, and other service credentials
    And both PUBLIC_ and non-PUBLIC_ prefixed variables should be available

  Scenario: Environment variables loaded in Playwright
    Given I am running E2E tests with Playwright
    When Playwright initializes
    Then it should load environment variables from .env.test using dotenv
    And CLERK_PUBLISHABLE_KEY should be available for @clerk/testing
    And CLERK_SECRET_KEY should be available for @clerk/testing

  Scenario: Environment variables in Astro
    Given I am running the Astro dev server
    When Astro loads
    Then it should natively load .env.local for development
    And PUBLIC_ prefixed variables should be exposed to client-side code
    And non-PUBLIC_ variables should only be available server-side

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

## Task Breakdown

Generate tasks for each workflow area:

1. **workflow/prd-preparation** - Create PRD preparation checklist and template
2. **workflow/task-generation** - Build script to extract tasks from PRD Gherkin scenarios
3. **workflow/dependency-validation** - Enhance existing validation script
4. **workflow/testing-strategy** - Document decision tree for test types
5. **workflow/rollback-procedures** - Create runbook for rollback scenarios
6. **workflow/synthetic-isolation** - Document patterns for test data isolation
7. **workflow/env-var-strategy** - Implement unified environment variable configuration

## Success Metrics

| Metric                          | Target      |
|---------------------------------|-------------|
| PRD preparation time            | < 2 hours   |
| Task generation automation      | 90% auto    |
| Dependency validation coverage  | 100%        |
| Test type decision accuracy     | > 95%       |
| Rollback procedure documentation| Complete    |
| Synthetic data leak incidents   | 0           |

## Technical Implementation Notes

### Environment Variable Strategy

**Framework-Specific Behavior:**

1. **Astro** (via Vite)
   - Natively loads `.env`, `.env.local`, `.env.[mode]` files
   - `PUBLIC_` prefix exposes variables to client-side code
   - No dotenv package needed

2. **Vitest** (via Vite)
   - Inherits Vite's .env loading
   - By default only loads `VITE_*` prefixed variables
   - Configure `env: loadEnv('test', process.cwd(), '')` to load ALL variables
   - Uses `.env.test` when mode is 'test'

3. **Playwright**
   - Does NOT auto-load .env files
   - Requires explicit `dotenv.config()` in `playwright.config.ts`
   - dotenv should be a devDependency (not runtime dependency)

4. **Clerk Testing** (@clerk/testing)
   - Requires `CLERK_PUBLISHABLE_KEY` (without PUBLIC_ prefix)
   - Requires `CLERK_SECRET_KEY`
   - Both needed for `clerkSetup()` function

**File Structure:**
```
.env.example      # Template with documentation
.env.local        # Development (gitignored, both PUBLIC_ and non-prefixed Clerk keys)
.env.test         # Test environment (gitignored, all test credentials)
.gitignore        # Excludes .env.* except .env.example
```

## References

- Existing script: `scripts/validate-task-dependencies.js`
- Task index: `tasks/index.yml`
- Product PRD: `documentation/PRDs/product.md`
- Testing docs: `documentation/e2e-testing-with-clerk.md`
- Astro env docs: https://docs.astro.build/en/guides/environment-variables/
- Vitest env docs: https://vitest.dev/guide/features
- Vite env docs: https://vite.dev/guide/env-and-mode
- Playwright env guide: https://www.browserstack.com/guide/playwright-env-variables
- Clerk testing docs: https://clerk.com/docs/testing/playwright/overview
