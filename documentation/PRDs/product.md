# Equipped Platform - Product Requirements Document

> **Version:** 1.0  
> **Last Updated:** December 2025  
> **Status:** Active Development  
> **Domain:** tryequipped.com

---

## Executive Summary

Equipped is a B2B device procurement and IT asset management platform designed to make technology onboarding "a magical, seamless experience for both employer & employee." As an Apple Authorized Reseller and Premier Apple Partner, Equipped handles the entire device lifecycle—from purchase and provisioning to tracking and retirement.

**Primary Tagline:** "Run your business and we handle the tech."

**Secondary Tagline:** "All things tech, one monthly fee. It's that simple."

**Core Value Proposition:**
1. **Device Procurement** — Purchase, lease, or finance Apple devices through an integrated store
2. **Provisioning & Deployment** — Devices arrive configured and ready on day one
3. **Asset Tracking** — Real-time visibility into your entire fleet
4. **Lifecycle Management** — Upgrades, trade-ins, repairs, and recycling

---

## Target Users

### Primary Personas

| Persona | Role | Pain Points | Goals |
|---------|------|-------------|-------|
| **IT Manager** | Manages company devices & security | Manual setup, asset tracking chaos, no fleet visibility | Automate onboarding, track all devices, enforce security |
| **HR/People Ops** | Onboards new employees | Slow equipment delivery, poor first-day experience | Get devices to new hires on day one |
| **Finance/Procurement** | Controls IT spend | Unpredictable costs, lack of visibility | Predictable monthly costs, spend analytics |
| **Operations Manager** | Oversees logistics | Device recovery from departures, global shipping complexity | Streamlined offboarding, worldwide delivery |

### Platform Roles

#### System-Level: `sys_admin` (Equipped Employees)

Users with email domains `@tryequipped.com`, `@getupgraded.com`, or `@cogzero.com` are automatically system administrators.

| Capability | Description |
|------------|-------------|
| Admin Dashboard | Access to `admin.{ROOT_DOMAIN}` subdomain |
| Feature Flags | Manage feature flags (environment variables or D1-backed) |
| Queue Monitoring | Monitor CloudFlare Queues for background jobs |
| Impersonation | Can view any account as that customer would see it |
| Global Management | Manage all accounts, users, products, brands |
| Cross-Tenant View | View all data across all tenants |

#### Account-Level Roles (Within a Company/Tenant)

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | Account owner (company admin) | Full control: CRUD all resources, manage billing, invite users, delete account. At least one owner required per account. |
| `admin` | Account administrator | Same as owner except cannot delete account or manage billing portal |
| `member` | Regular team member | Read-only access to people, devices, orders. Cannot create/update/delete. |
| `buyer` | Authorized purchaser | Access to orders, invoices, store; no employee assignment access |
| `noaccess` | No platform access | Person exists in the system but cannot log in. Devices can still be assigned to them. |

**Role Hierarchy:** `owner` > `admin` > `member` > `buyer` > `noaccess`

**Important:** A **Person** (employee record) can exist without any `Account::Access` record at all. The `noaccess` role is used when someone *had* access that was revoked, or when explicitly granting "no access" to a User who has access to other accounts.

#### Consultant Pattern (Multi-Account Access)

A single User can have access to multiple Accounts with different roles on each. This enables Apple Consultants to manage multiple client companies.

- `User` is a global entity (not tenant-scoped)
- `Account::Access` links a User to an Account with a specific role
- `User.primary_account` determines the default account context
- Users can switch between accounts they have access to

---

## Brand Ethos

We will be:
- **Responsive, friendly, personal, and helpful**
- **Prompt and reliable** in delivery
- **Transparent** - communication happens in shared channels (Slack)
- **Human-centered** - real humans, not AI, respond to support requests
- **White-glove service** - we're an extension of your IT department

---

## Technology Stack

### Current (Phase 0 - Static Landing)
- **Astro 5** — Static site generator with islands architecture
- **Tailwind CSS v4** — Utility-first CSS (Vite plugin, not PostCSS)
- **React 19** — UI components with Framer Motion animations
- **CloudFlare Workers** — Edge deployment for static assets
- **Biome** — Linting and formatting (replaces ESLint/Prettier)
- **TypeScript** — Type-safe JavaScript throughout

### Planned (Phases 1-4)
- **Hono** — Lightweight API routing on CloudFlare Workers
- **Clerk** — Authentication, SSO, Google Workspace, webhooks
- **CloudFlare D1** — SQLite-compatible edge database
- **CloudFlare Queues** — Background job processing
- **Drizzle ORM** — Type-safe database queries
- **shadcn/ui** — Accessible React component primitives
- **TanStack Table** — Headless data grid for device lists
- **PostHog** — Product analytics and feature flags
- **Sentry** — Error tracking and performance monitoring

---

## External Integrations

| Service | Purpose | Environment |
|---------|---------|-------------|
| **Upgraded** | Order management, fulfillment, embedded store, trade-ins | Prod, Sandbox |
| **Shopify** | Product catalog, inventory sync | Prod, Dev, Staging |
| **Stripe** | Payment processing, billing portal | Prod, Sandbox |
| **Affirm/Klarna** | Buy-now-pay-later, upgrade programs | Prod, Sandbox |
| **Alchemy** | Trade-in valuation, serial/model lookup, FindMy status | Prod, Dev |
| **Spark Shipping** | Drop-shipping, inventory, shipment tracking | Prod, Staging |
| **Addigy** | MDM device sync (macOS, iOS) | API |
| **TD Synnex/Ingram Micro** | Distributor pricing and inventory | API |
| **Google Workspace** | SSO, user directory sync | API |
| **Clerk** | Authentication, user management, webhooks | Prod |
| **Macquarie** | Business leasing applications | Form Integration |
| **PostHog** | Product analytics, session replay | Prod |
| **Sentry** | Error tracking, performance monitoring | Prod |

### Integration Credentials

Credentials are stored securely and vary by environment:

| Integration | Credential Type | Storage | Notes |
|-------------|-----------------|---------|-------|
| **Clerk** | Publishable Key, Secret Key | Environment | Per environment |
| **Stripe** | API Key, Webhook Secret | Environment | Test keys for sandbox |
| **Upgraded** | API Token, Webhook Token | Environment | Sandbox for testing |
| **Shopify** | API Key, Access Token | Environment | Per-store tokens |
| **Addigy** | API Token, Client ID | Environment | Per-org configuration |
| **Alchemy** | API Key | Environment | Rate-limited |
| **Google OAuth** | Client ID, Client Secret | Encrypted | Per ROOT_DOMAIN |
| **PostHog** | Project API Key | Environment | Public key (client-side) |
| **Sentry** | DSN | Environment | Public key (client-side) |

### OAuth 2.0 Provider Capability

Equipped can act as an **OAuth 2.0 Authorization Server** for third-party integrations:

- **Use Case:** The Upgraded platform authenticates users via Equipped OAuth
- **Token Type:** JWT tokens for stateless verification
- **Management:** OAuth applications managed by sys_admins only
- **Endpoints:**
  - `GET /oauth/authorize` — Authorization endpoint
  - `POST /oauth/token` — Token endpoint
  - `POST /oauth/revoke` — Token revocation
  - `GET /oauth/userinfo` — User info endpoint (OpenID Connect)

---

## Development Phases

### Phase 0: Static Landing Page ✅ (Current)
Static marketing site showcasing value proposition, features, and social proof.

### Phase 1: Worker Architecture with Hono
Add Hono-based API routing on CloudFlare Workers.

### Phase 2: Clerk Authentication
Implement sign-up, sign-in, and session management with SSO.

### Phase 3: Cloudflare D1 Database
User and device data persistence with schema migrations.

### Phase 4: API Routes & Dashboard UI
Device CRUD, user management, and authenticated dashboard.

---

## Feature Specifications

The following sections define requirements using Gherkin BDD syntax for clarity and testability.

**Feature Order (reflects customer journey):**
1. Public Website & Marketing — Discover and learn about Equipped
2. Commerce & Purchasing — Buy, lease, or finance devices
3. Identity & Onboarding — Sign up and configure account
4. Fleet Management & Asset Tracking — Track and manage device inventory
5. Device Lifecycle Services — Trade-in, upgrade, repair, recycle
6. Order Management — Track orders and invoices
7. Employee & People Management — Manage employee directory
8. Support & Communication — Get help when needed
9. Settings & Configuration — Configure integrations and billing
10. Sys Admin Dashboard — Internal tools for Equipped staff

---

## 1. Public Website & Marketing

**File:** `tests/features/01-public-website.feature`  
**Scope:** Landing page, navigation, SEO, and conversion flows.

```gherkin
Feature: Public Marketing Website
  As a prospective B2B customer
  I want to learn about Equipped's offerings
  So that I can decide if the service fits my company's needs

  Background:
    Given the website is accessible at "tryequipped.com"
    And page load time is under 2 seconds
    And the brand ethos is "Clarity and Minimalism"

  @REQ-WEB-001 @Landing @SEO
  Scenario: Homepage Communicates Value Proposition
    When I visit the homepage
    Then I should see the tagline "Run your business and we handle the tech"
    And I should see the hero section with Ken Burns animation
    And I should see trusted company logos (Stork Club, Halo, Upgraded, JDI, Pingboard)
    And I should see a prominent "Get Started" CTA button

  @REQ-WEB-002 @Landing @Features
  Scenario: Features Section Displays Core Capabilities
    When I scroll to the "#features" section
    Then I should see 6 feature cards:
      | Feature              | Description                                          |
      | Device Store         | Purchase, lease, or finance Apple devices            |
      | Global Device Delivery | Ship pre-configured devices anywhere               |
      | Zero-Touch Setup     | Devices arrive configured and ready                  |
      | Fleet Tracking       | Real-time visibility into device inventory           |
      | Device Lifecycle     | Manage upgrades, repairs, and trade-ins              |
      | White-Glove Service  | Personalized support as extension of IT              |

  @REQ-WEB-003 @Landing @HowItWorks
  Scenario: How It Works Section Explains Process
    When I scroll to the "#how-it-works" section
    Then I should see 3 numbered steps:
      | Step | Title              | Description                                    |
      | 1    | Add your new hire  | Enter employee details and select device       |
      | 2    | We configure & ship| Set up device with software and security       |
      | 3    | They're ready to work | Employee opens box and starts immediately  |

  @REQ-WEB-004 @Landing @Stats
  Scenario: Stats Section Shows Social Proof Metrics
    When I view the stats section
    Then I should see the following statistics:
      | Metric | Value    |
      | Average onboarding time | 3 days |
      | Companies trust us      | 100+   |
      | Countries shipped to    | 50+    |
      | Support available       | 24/7   |

  @REQ-WEB-005 @Landing @Testimonials
  Scenario: Testimonials Section Shows Customer Quotes
    When I scroll to the testimonials section
    Then I should see at least 3 customer testimonials
    And each testimonial should include:
      | Field   | Required |
      | Quote   | Yes      |
      | Author  | Yes      |
      | Role    | Yes      |
      | Company | Yes      |

  @REQ-WEB-006 @Landing @CTA @Order
  Scenario: MacBook Order Section Promotes Apple Products
    When I scroll to the "#order" section
    Then I should see "Order a MacBook Pro today"
    And I should see device categories (MacBooks, iPads, iPhones, Accessories)
    And I should see a CTA "Try us as your preferred Apple reseller"
    And the CTA should link to the sign-up flow

  @REQ-WEB-007 @Navigation @Responsive
  Scenario: Navigation Adapts to Scroll Position
    Given I am viewing the homepage on desktop
    When I scroll down more than 50 pixels
    Then the navigation bar should have a blurred background
    And the navigation should remain fixed at the top

  @REQ-WEB-008 @Footer @Legal
  Scenario: Footer Contains Required Links
    When I scroll to the footer
    Then I should see links to:
      | Page     | URL                          |
      | Features | #features                    |
      | How it works | #how-it-works            |
      | Contact  | mailto:hello@tryequipped.com |
      | Privacy  | /privacy                     |
      | Terms    | /terms                       |
    And I should see copyright notice with current year
```

---

## 2. Commerce & Purchasing

**File:** `tests/features/02-commerce.feature`
**Scope:** Product discovery, configuration, checkout, and payment options.

```gherkin
Feature: B2B Commerce and Purchasing
  As a business buyer
  I want to easily find, configure, and purchase Apple devices
  So that I can equip my remote team quickly

  Background:
    Given the brand ethos is "Clarity and Minimalism"
    And I am on the "Product Configurator" page
    And I am an Apple Authorized Reseller customer

  @REQ-COM-001 @Shopify @UI
  Scenario: Configure MacBook and Check Inventory
    When I select the following configuration:
      | Model   | MacBook Pro 16-inch |
      | Chip    | M3 Pro              |
      | Memory  | 36GB                |
      | Storage | 1TB                 |
    And I request availability
    # System checks Shopify Storefront API (synced by Spark)
    Then the system should query the Shopify Inventory API
    And the system should query TD Synnex/Ingram Micro for pricing
    And I should see the price formatted in USD
    And I should see "In Stock" or "Ships in 3-5 days" based on inventory data
    And the "Add to Cart" button should be enabled

  @REQ-COM-002 @Products
  Scenario: Browse Available Product Categories
    When I visit the store page
    Then I should see the following product categories:
      | Category    | Examples                           |
      | MacBooks    | MacBook Pro, MacBook Air           |
      | iPads       | iPad Pro, iPad Air, iPad           |
      | iPhones     | iPhone 16 Pro, iPhone 16           |
      | Accessories | Apple Care, monitors, keyboards    |

  @REQ-COM-003 @Cart @Anonymous
  Scenario: Anonymous Cart Persistence
    Given I am not logged in
    When I add a "MacBook Pro 14-inch M3" to my cart
    And I close the browser tab
    And I return to the website
    Then my cart should still contain "MacBook Pro 14-inch M3"
    # Cart persists via localStorage/cookies

  @REQ-COM-004 @Payments @Checkout
  Scenario: Checkout with Multiple Payment Options
    Given I have items in my cart
    When I proceed to checkout
    Then I should see the following payment methods in priority order:
      | Method        | Priority   | Integration       |
      | Credit Card   | Primary    | Stripe Elements   |
      | Stripe Link   | Primary    | Stripe Link       |
      | Affirm/Klarna | Prominent  | BNPL Integration  |
      | Leasing       | Secondary  | Macquarie Form    |

  @REQ-COM-005 @Leasing @Financing
  Scenario: Business Leasing Application Flow
    Given I am at the payment step
    When I select "Business Leasing"
    Then I should be presented with the "Macquarie Leasing Form"
    And I should see a disclaimer "Subject to lender approval"
    And I should see estimated monthly payment
    And the form should capture business information

  @REQ-COM-006 @BNPL @Financing
  Scenario: Affirm/Klarna Upgrade Program Checkout
    Given I am at the payment step
    And my cart total exceeds $1000
    When I select "Affirm" or "Klarna"
    Then I should see monthly payment options
    And I should see "0% APR for qualified buyers" messaging
    And I should be redirected to the BNPL provider for approval

  @REQ-COM-007 @Shipping @Spark
  Scenario: Real-Time Shipping Estimate
    Given I have items in my cart
    When I enter a shipping address
    Then the system should query Spark Shipping API
    And I should see estimated delivery date
    And I should see shipping cost (or "Free shipping" if applicable)
```

---

## 3. Identity & Onboarding

**File:** `tests/features/03-identity.feature`
**Scope:** SSO, organization setup, user management, and role-based access.

```gherkin
Feature: B2B Identity and Onboarding
  As a Company Administrator
  I want to secure access via SSO
  So that I can manage who has access to our purchasing and fleet data

  Background:
    Given Clerk is configured as the authentication provider
    And Google Workspace SSO is enabled

  @REQ-ID-001 @SSO @Security @Clerk
  Scenario: Sign Up with Google Workspace
    Given I am a new business customer
    When I click "Sign Up with Google"
    And I authorize the application
    Then a new "Account" (Organization) should be created in the D1 database
    And I should be assigned the "Owner" role on that account
    And my Google Workspace user list should be synced for asset assignment
    And I should receive a welcome email

  @REQ-ID-002 @SSO @Email
  Scenario: Sign Up with Business Email
    Given I am a new business customer
    When I enter my business email "admin@company.com"
    And I complete email verification
    Then a new "Account" should be created
    And I should be prompted to complete my profile (company name, role)
    And I should be assigned the "Owner" role on that account

  @REQ-ID-003 @Roles @AccessControl
  Scenario: Role-Based Access Control
    Given I am an account "Owner"
    When I view the access control settings
    Then I should see the following roles:
      | Role    | Permissions                                           |
      | Owner   | Full access: CRUD all, billing, invites, delete acct  |
      | Admin   | Manage devices, users, orders; no billing/delete acct |
      | Member  | Read-only access to people, devices, orders           |
      | Buyer   | View orders, invoices, store; no employee assignments |

  @REQ-ID-004 @Invite @Team
  Scenario: Invite Team Members with Specific Roles
    Given I am an account "Owner" or "Admin"
    When I invite "finance@company.com" with role "Buyer"
    Then an invitation email should be sent via Clerk
    And "finance@company.com" should only see "Orders" and "Invoices"
    And "finance@company.com" should NOT see "Employee Assignments"
    And "finance@company.com" should NOT see "Settings"

  @REQ-ID-005 @Invite @Lifecycle
  Scenario: Invitation Lifecycle - Accept
    Given I received an invitation to join "Acme Corp" as "Admin"
    When I click the invitation link
    And I sign in or create an account
    Then an Account::Access record should be created linking me to "Acme Corp"
    And my role should be "Admin"
    And the invitation should be marked as accepted
    And I should be redirected to the "Acme Corp" dashboard

  @REQ-ID-006 @Invite @Decline
  Scenario: Invitation Lifecycle - Decline
    Given I received an invitation to join "Acme Corp"
    When I click "Decline" on the invitation
    Then the invitation should be marked as declined
    And I should NOT have access to "Acme Corp"

  @REQ-ID-007 @Invite @Revoke
  Scenario: Invitation Lifecycle - Revoke
    Given I am an account "Owner" or "Admin"
    And an invitation was sent to "pending@example.com"
    When I revoke the invitation
    Then the invitation should be marked as revoked
    And the invitation link should no longer be valid

  @REQ-ID-008 @Invite @Expiry
  Scenario: Invitation Lifecycle - Expiry
    Given an invitation was sent 15 days ago
    When the invitee tries to accept
    Then they should see "This invitation has expired"
    And the invitation should NOT be accepted

  @REQ-ID-009 @Webhook @Sync
  Scenario: User Created Webhook Syncs to Database
    Given Clerk fires a "user.created" webhook event
    When the webhook is received at "/api/auth/webhook"
    Then the user should be created in the D1 "users" table with:
      | Field       | Source                |
      | id          | Clerk user ID         |
      | email       | Clerk email           |
      | first_name  | Clerk firstName       |
      | last_name   | Clerk lastName        |
      | created_at  | Current timestamp     |

  @REQ-ID-010 @Session @JWT
  Scenario: Protected Route Requires Authentication
    Given I am not logged in
    When I try to access "/dashboard"
    Then I should be redirected to "/sign-in"
    And after signing in I should be redirected back to "/dashboard"

  @REQ-ID-011 @MultiAccount @Switch
  Scenario: Switch Between Accounts (Consultant Pattern)
    Given I have access to multiple accounts:
      | Account       | Role   |
      | Acme Corp     | Owner  |
      | Beta Inc      | Admin  |
      | Client Co     | Member |
    And my primary account is "Acme Corp"
    When I click the account switcher
    Then I should see all accounts I have access to
    When I select "Beta Inc"
    Then the tenant context should switch to "Beta Inc"
    And the URL should change to "betainc.tryequipped.com"
    And I should see "Beta Inc" data with "Admin" permissions

  @REQ-ID-012 @MultiAccount @Primary
  Scenario: Set Primary Account
    Given I have access to multiple accounts
    When I go to my user settings
    And I set "Beta Inc" as my primary account
    Then my next login should default to "Beta Inc"
    And `users.primary_account_id` should be updated

  @REQ-ID-013 @GoogleSync @Directory
  Scenario: Sync People from Google Workspace
    Given I am an account "Owner" or "Admin"
    And Google Workspace is connected via OAuth
    When I enable Google Directory sync
    Then the system should fetch users from Google Workspace Admin SDK
    And create Person records for each employee:
      | Google Field      | Person Field   |
      | primaryEmail      | email          |
      | name.givenName    | first_name     |
      | name.familyName   | last_name      |
      | orgUnitPath       | department     |
      | phones[0].value   | phone          |
    And existing Person records should be updated (matched by email)
    And sync should run automatically on a schedule

  @REQ-ID-014 @MDM @Addigy @Setup
  Scenario: Connect Addigy MDM Integration
    Given I am an account "Owner" or "Admin"
    When I start the Addigy integration wizard
    Then I should be guided through these steps:
      | Step | Action                                |
      | 1    | Enter Addigy API credentials          |
      | 2    | Select Addigy policy to sync from     |
      | 3    | Preview devices that will be imported |
      | 4    | Confirm and start sync                |
    And devices from Addigy should appear in my fleet
    And `accounts.device_source` should be set to "addigy"

  @REQ-ID-015 @MDM @Sync
  Scenario: MDM Device Sync
    Given an MDM integration is configured (Addigy or Black Glove)
    When the scheduled sync job runs
    Then devices should be fetched from the MDM API
    And new devices should be created in the devices table
    And existing devices should be updated (matched by serial number)
    And raw API response should be stored for audit purposes
```

---

## 4. Fleet Management & Asset Tracking

**File:** `tests/features/04-fleet-management.feature`
**Scope:** Dashboard, device inventory, valuation, and assignment.

```gherkin
Feature: Fleet Management and Asset Tracking
  As an IT Manager
  I want to track both purchased and existing devices
  So that I can see my total fleet value and assign devices to employees

  Background:
    Given I am logged in via "Google Workspace SSO"
    And I am on the "Fleet Dashboard" page

  @REQ-FLEET-001 @Devices @List
  Scenario: View Device Inventory
    When the dashboard loads
    Then I should see a list of all company devices
    And each device should display:
      | Field        | Required |
      | Name         | Yes      |
      | Type         | Yes      |
      | Model        | Yes      |
      | Serial Number| No       |
      | Status       | Yes      |
      | Assigned To  | No       |
    And I should be able to sort by any column
    And I should be able to filter by status (Active, Pending, Retired)

  @REQ-FLEET-002 @Alchemy @Integration
  Scenario: Add Existing Device by Serial Number
    # Covers adding BYOD or devices bought elsewhere
    When I click "Add Device"
    And I enter serial number "C02XYZ123ABC"
    # System calls Alchemy API for Model Lookup
    Then the system should call the Alchemy Model Lookup API
    And the system should auto-populate device details:
      | Model | MacBook Air M1 |
      | Color | Space Gray     |
      | Year  | 2021           |
    And I should be able to enter purchase date
    And the device should be saved to the "devices" table

  @REQ-FLEET-003 @Alchemy @Valuation
  Scenario: Automatic Fleet Valuation
    Given I have a list of devices in my fleet
    When the dashboard loads
    # System calls Alchemy API for Trade-In Value
    Then the system should fetch real-time trade-in values from Alchemy
    And I should see a "Total Fleet Value" summary card
    And any device with value "$0" should show a "Recycle for Free" badge
    And any device with value "> $0" should show a "Trade-In" button
    And I should see fleet depreciation over time

  @REQ-FLEET-004 @Assignment @GoogleWorkspace
  Scenario: Assign Device to Employee
    Given I have synced my users from "Google Workspace"
    When I select device "MacBook Pro 16 (Asset #001)"
    And I click "Assign"
    And I select user "jane.doe@company.com" from the dropdown
    Then the assignment should be recorded in the "device_assignments" table
    And the status of the device should change to "Deployed"
    And the device card should show "Assigned to: Jane Doe"
    And an audit log entry should be created

  @REQ-FLEET-005 @Lifecycle @Return
  Scenario: Record Device Return from Departing Employee
    Given device "MacBook Pro 16" is assigned to "john.smith@company.com"
    And John Smith is departing the company
    When I select the device
    And I click "Unassign"
    Then the assignment should be marked with "returned_at" timestamp
    And the device status should change to "Available"
    And I should see option to "Schedule Collection" via Equipped logistics

  @REQ-FLEET-006 @Devices @CRUD
  Scenario: Edit Device Details
    Given I am viewing device "MacBook Air M2"
    When I click "Edit"
    And I update the following fields:
      | Field       | New Value        |
      | Name        | Marketing MacBook|
      | Notes       | Primary device   |
    And I click "Save"
    Then the device should be updated in the database
    And I should see a success notification
    And the "updated_at" timestamp should be refreshed

  @REQ-FLEET-007 @Devices @Delete
  Scenario: Retire a Device
    Given I am viewing device "Old iMac 2018"
    When I click "Retire Device"
    And I confirm the action
    Then the device status should change to "Retired"
    And the device should be filtered out of the default view
    And I should see it when I filter by "Retired" status
    And I should see trade-in/recycle options

  @REQ-FLEET-008 @EmptyState @UX
  Scenario: Empty State for New Organization
    Given my organization has no devices
    When I visit the devices page
    Then I should see a friendly empty state illustration
    And I should see "Add your first device" CTA button
    And I should see quick actions:
      | Action                    |
      | Add device by serial      |
      | Order new device          |
      | Import from spreadsheet   |
```

---

## 5. Device Lifecycle Services

**File:** `tests/features/05-device-lifecycle.feature`
**Scope:** Repairs, trade-ins, recycling, and upgrades.

```gherkin
Feature: Device Lifecycle Services
  As an IT Manager
  I want to manage device repairs, trade-ins, and upgrades
  So that I can maintain my fleet efficiently and recover value

  Background:
    Given I am logged in as an organization admin
    And I am on the Fleet Dashboard

  @REQ-LIFE-001 @TradeIn @Alchemy
  Scenario: Request Trade-In Quote for Device
    Given I have device "MacBook Pro 2022" in my fleet
    And the device has trade-in value "> $0"
    When I click "Trade-In" on the device
    Then the system should display current Alchemy trade-in value
    And I should see condition questions:
      | Question                           |
      | Does the device power on?          |
      | Is the screen in good condition?   |
      | Are there any cosmetic damages?    |
    And I should be able to submit a trade-in request

  @REQ-LIFE-002 @Recycle @Sustainability
  Scenario: Request Free Recycling for Zero-Value Device
    Given I have device "MacBook Air 2015" in my fleet
    And the device trade-in value is "$0"
    When I click "Recycle for Free"
    Then I should see eco-friendly recycling messaging
    And I should be able to schedule a pickup
    And I should receive a certificate of data destruction

  @REQ-LIFE-003 @Repair @Support
  Scenario: Request Device Repair
    Given I have device "MacBook Pro with cracked screen"
    When I click "Request Repair"
    Then I should see repair options:
      | Option           | Description                    |
      | Apple Repair     | Apple Authorized Service       |
      | Express Replace  | Get a replacement while fixed  |
    And I should be able to describe the issue
    And a support ticket should be created

  @REQ-LIFE-004 @Upgrade @Financing
  Scenario: Upgrade Device with Credit
    Given I have device "MacBook Air M1" eligible for upgrade
    And the device has trade-in value of "$450"
    When I click "Upgrade"
    Then I should see new device options
    And the trade-in value should be shown as credit
    And I should see net price after credit
    And I should be able to apply financing options

  @REQ-LIFE-005 @Wipe @Security
  Scenario: Request Secure Data Wipe
    Given I have a device being returned from a departing employee
    When I request data wipe
    Then I should see wipe options:
      | Option              | Description                         |
      | Standard Wipe       | Factory reset                       |
      | Secure Wipe         | DoD 5220.22-M compliant             |
      | Certified Wipe      | With destruction certificate        |
    And the wipe status should be tracked in the system
```

---

## 6. Order Management

**File:** `tests/features/06-orders.feature`
**Scope:** Order tracking, history, and shipment status.

```gherkin
Feature: Order Management
  As a Buyer or Admin
  I want to track my orders and shipments
  So that I know when devices will arrive

  Background:
    Given I am logged in with at least "Buyer" role
    And I am on the Orders page

  @REQ-ORD-001 @Orders @List
  Scenario: View Order History
    When I visit the orders page
    Then I should see a list of all orders
    And each order should display:
      | Field          | Required |
      | Order Number   | Yes      |
      | Date           | Yes      |
      | Items          | Yes      |
      | Total          | Yes      |
      | Status         | Yes      |
      | Tracking       | If shipped |

  @REQ-ORD-002 @Tracking @Spark
  Scenario: Track Shipment Status
    Given I have an order with status "Shipped"
    When I click on the order
    Then the system should query Spark Shipping API
    And I should see shipment tracking information:
      | Field            | Example                |
      | Carrier          | FedEx                  |
      | Tracking Number  | 123456789              |
      | Current Status   | In Transit             |
      | Estimated Arrival| December 15, 2024      |
    And I should see a tracking map (if available)

  @REQ-ORD-003 @Orders @Details
  Scenario: View Order Details
    When I click on order "#EQ-2024-001"
    Then I should see full order details:
      | Section          | Contents                      |
      | Items            | Device list with specs        |
      | Billing          | Payment method, total         |
      | Shipping         | Address, recipient            |
      | Timeline         | Order placed, shipped, etc.   |
    And I should be able to download invoice as PDF

  @REQ-ORD-004 @Invoices @Finance
  Scenario: View and Download Invoices
    When I click "Invoices" tab
    Then I should see all invoices for my organization
    And I should be able to filter by date range
    And I should be able to download individual invoices
    And I should be able to download monthly statements
```

---

## 7. Employee & People Management

**File:** `tests/features/07-people.feature`
**Scope:** Employee directory, groups, and onboarding/offboarding.

```gherkin
Feature: Employee and People Management
  As an HR or IT Administrator
  I want to manage employees and their device assignments
  So that I can streamline onboarding and offboarding

  Background:
    Given I am logged in as an organization admin
    And Google Workspace integration is enabled

  @REQ-PPL-001 @Directory @Sync
  Scenario: Sync Employees from Google Workspace
    When I go to Settings > Integrations
    And I click "Sync Google Workspace Users"
    Then the system should fetch users from Google Workspace API
    And new employees should be added to the directory
    And departed employees should be marked as inactive
    And I should see last sync timestamp

  @REQ-PPL-002 @Directory @View
  Scenario: View Employee Directory
    When I visit the People page
    Then I should see a list of all employees
    And each employee should display:
      | Field          | Required |
      | Name           | Yes      |
      | Email          | Yes      |
      | Department     | If available |
      | Devices        | Count    |
      | Status         | Yes (Active/Inactive) |

  @REQ-PPL-003 @Groups @Teams
  Scenario: Create Employee Groups
    When I click "Create Group"
    And I enter group name "Engineering"
    And I add employees to the group
    Then the group should be saved
    And I should be able to assign default device configurations to groups
    And I should be able to view all devices assigned to the group

  @REQ-PPL-004 @Onboarding @Workflow
  Scenario: Onboard New Employee with Device
    Given I have a new employee "alice@company.com" starting Monday
    When I click "Onboard New Hire"
    And I enter employee details:
      | Field       | Value              |
      | Name        | Alice Smith        |
      | Email       | alice@company.com  |
      | Start Date  | Next Monday        |
      | Role        | Software Engineer  |
    And I select device package "Engineering Standard"
    Then a device order should be created
    And the device should be configured with engineering software
    And shipping should be scheduled for delivery by start date
    And Alice should receive welcome email with tracking

  @REQ-PPL-005 @Offboarding @Workflow
  Scenario: Offboard Departing Employee
    Given employee "bob@company.com" is departing
    When I click "Offboard Employee"
    And I enter last day date
    Then I should see all devices assigned to Bob
    And I should be able to schedule device collection
    And I should be able to request secure data wipe
    And Bob's account access should be revoked on last day
```

---

## 8. Support & Communication

**File:** `tests/features/08-support.feature`
**Scope:** Multi-channel support, help requests, and SLA.

```gherkin
Feature: Human-Centered Support
  As a customer
  I want to reach support via my preferred channel
  So that I can get help quickly without automated responses

  Background:
    Given I am a logged-in customer
    And "real humans (not AI)" is the support policy

  @REQ-SUP-001 @Channels @MultiChannel
  Scenario: Access Multiple Support Channels
    When I click "Get Help" in the dashboard
    Then I should see the following support options:
      | Channel   | Availability |
      | Slack     | Real-time    |
      | iMessage  | Real-time    |
      | WhatsApp  | Real-time    |
      | Email     | 24 hours     |
      | Phone     | Business hrs |

  @REQ-SUP-002 @Slack @Integration
  Scenario: Connect Slack for Transparent Support
    When I go to Settings > Integrations
    And I connect my Slack workspace
    Then a dedicated support channel should be created
    And all support communications should be visible to my team
    And I should receive notifications in Slack

  @REQ-SUP-003 @Response @SLA
  Scenario: Support Response Time Expectations
    When I submit a support request
    Then I should receive acknowledgment within 15 minutes during business hours
    And I should see estimated response time
    And urgent requests should be prioritized

  @REQ-SUP-004 @Help @Self-Service
  Scenario: Access Help Documentation
    When I click "Help Center"
    Then I should see categorized help articles
    And I should be able to search for answers
    And I should see video tutorials for common tasks
```

---

## 9. Settings & Configuration

**File:** `tests/features/09-settings.feature`
**Scope:** Organization settings, integrations, and billing.

```gherkin
Feature: Settings and Configuration
  As a Super Admin
  I want to configure my organization settings
  So that Equipped works seamlessly with my existing tools

  Background:
    Given I am logged in as "Super Admin"
    And I am on the Settings page

  @REQ-SET-001 @Organization @Profile
  Scenario: Update Organization Profile
    When I click "Organization"
    Then I should be able to update:
      | Field           | Example                |
      | Company Name    | Acme Corporation       |
      | Billing Email   | billing@acme.com       |
      | Address         | 123 Main St, SF, CA    |
      | Logo            | Upload company logo    |

  @REQ-SET-002 @Integrations @SSO
  Scenario: Configure SSO Settings
    When I click "Security"
    Then I should see SSO configuration options:
      | Provider         | Status     |
      | Google Workspace | Connected  |
      | Okta             | Available  |
      | Azure AD         | Available  |
    And I should be able to enforce SSO for all users

  @REQ-SET-003 @Integrations @MDM
  Scenario: Connect MDM Provider
    When I click "Integrations"
    Then I should see MDM integration options:
      | Provider    | Description                    |
      | Addigy      | Mac-focused MDM                |
      | Jamf        | Apple device management        |
      | Mosyle      | Apple Business Manager         |
    And connecting MDM should enable software visibility on devices

  @REQ-SET-004 @Billing @Subscription
  Scenario: View and Manage Billing
    When I click "Billing"
    Then I should see:
      | Section          | Contents                    |
      | Current Plan     | Plan name, price            |
      | Payment Method   | Card on file                |
      | Billing History  | Past invoices               |
      | Usage            | Devices managed, users      |
    And I should be able to update payment method
    And I should be able to download invoices

  @REQ-SET-005 @Team @Users
  Scenario: Manage Team Access
    When I click "Team"
    Then I should see all team members with roles
    And I should be able to:
      | Action           | Available To     |
      | Invite user      | Super Admin      |
      | Change role      | Super Admin      |
      | Remove user      | Super Admin      |
      | Reset password   | Super Admin      |
```

---

## 10. Sys Admin Dashboard (Internal - Equipped Staff Only)

**File:** `tests/features/10-sysadmin.feature`
**Scope:** Internal staff tools for managing all customers (sys_admin access required).

```gherkin
Feature: Equipped Sys Admin Dashboard
  As an Equipped internal staff member (sys_admin)
  I want to manage all customers and their data
  So that I can provide white-glove support

  Background:
    Given I am logged in with email domain "@tryequipped.com" (or @getupgraded.com, @cogzero.com)
    And I have sys_admin privileges
    And I am on the admin subdomain "admin.tryequipped.com"

  @REQ-SA-001 @Customers @List
  Scenario: View All Customers
    When I visit the customer list
    Then I should see all customer organizations
    And I should be able to search by company name or email
    And I should see:
      | Column          | Sortable |
      | Company Name    | Yes      |
      | Primary Contact | Yes      |
      | Device Count    | Yes      |
      | Last Order      | Yes      |
      | Status          | Yes      |

  @REQ-SA-002 @Customers @Impersonate
  Scenario: Access Customer Account (Impersonation)
    When I select customer "Acme Corp"
    And I click "View as Customer"
    Then I should see their dashboard as they would see it
    And I should see an "Admin Mode" banner
    And all actions should be logged for audit

  @REQ-SA-003 @Devices @Global
  Scenario: View All Devices Across Customers
    When I visit the global devices view
    Then I should see all devices across all customers
    And I should be able to filter by customer
    And I should be able to export device data

  @REQ-SA-004 @Orders @Global
  Scenario: Manage All Orders
    When I visit the global orders view
    Then I should see all orders across all customers
    And I should be able to update order status
    And I should be able to add tracking information
    And I should be able to process refunds
```

---

## Database Schema

The following schema supports all platform features:

### Entity Relationship Overview

#### Core Identity Models

- **Person** = An employee/staff/contractor record in an organization. May or may not have platform login access.
- **User** = A global login identity (synced from Clerk). Can access multiple accounts.
- **Account::Access** = Links a User to an Account with a role. Optional for Person records.
- **Account::Invitation** = Pending invitation to join an account with a specific role.

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │◄──────│  Account::Access │──────►│   Account    │
│  (global)    │       │   (role link)    │       │  (tenant)    │
└──────────────┘       └──────────────────┘       └──────────────┘
                               ▲                         │
                               │ optional                ├──────────────────┐
                       ┌───────┴──────┐                  │                  │
                       │    Person    │◄─────────────────┘                  │
                       │ (employee)   │    belongs to account               │
                       └──────────────┘                                     │
                                                                            ▼
                                                                 ┌──────────────────────┐
                                                                 │ Account::Invitation  │
                                                                 │ (pending invites)    │
                                                                 └──────────────────────┘
```

A Person can exist **without** an Account::Access (and thus no User). This allows:
- Tracking employees who don't need platform login
- Assigning devices to people before they have login access
- Maintaining an employee directory separate from platform users

#### Product Catalog & Inventory Models (Global)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    Brand     │──────►│   Product    │──────►│  Inventory Item  │
│  (global)    │       │  (global)    │       │  (stocked item)  │
└──────────────┘       └──────────────┘       └──────────────────┘
      │                       │                        │
      │ e.g., Apple           │ e.g., MacBook Pro      │ Serial: C02X...
      │                       │ 14" M3 Pro             │ Condition: new
      └───────────────────────┴────────────────────────┘
                                                       │
                              ┌─────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │     Device       │
                    │ (tenant-scoped)  │◄─── Assigned to Person
                    └──────────────────┘
```

- **Brand** = Manufacturer (e.g., Apple, Samsung). Managed by sys_admins only.
- **Product** = Catalog item (e.g., "MacBook Pro 14-inch M3 Pro"). Includes specs, MSRP, images.
- **Inventory Item** = A specific stocked unit with optional serial number. Can be new or used.
- **Device** = A device owned/managed by a tenant. May or may not link to a Product.

```sql
-- Users table (synced from Clerk via webhook) - GLOBAL, not tenant-scoped
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- Clerk user ID
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    primary_account_id TEXT REFERENCES accounts(id),  -- Default account context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organizations/Accounts table (tenant)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    short_name TEXT NOT NULL UNIQUE,      -- Subdomain: {short_name}.tryequipped.com
    name TEXT NOT NULL,
    billing_email TEXT,
    address TEXT,
    logo_url TEXT,
    stripe_customer_id TEXT,              -- Stripe customer ID
    upgraded_store_id TEXT,               -- Upgraded store ID
    upgraded_customer_id TEXT,            -- Upgraded customer ID
    device_source TEXT DEFAULT 'database', -- 'database', 'addigy', 'blackglove'
    is_synthetic BOOLEAN DEFAULT FALSE,   -- True for test accounts (excluded from analytics)
    acn_profile_id TEXT,                  -- Apple Consultant Network profile ID
    acn_profile_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Account access (role assignments - links Users to Accounts)
CREATE TABLE account_access (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, buyer, noaccess
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, user_id)
);

-- People table (employees/staff in an account) - tenant-scoped
-- A Person may or may not have platform login access
CREATE TABLE people (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    account_access_id TEXT REFERENCES account_access(id),  -- OPTIONAL: links to User via Access
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,                     -- Work email (may differ from User email)
    phone TEXT,
    title TEXT,                     -- Job title
    department TEXT,
    location TEXT,                  -- Office location
    start_date DATE,
    end_date DATE,                  -- NULL if still employed
    status TEXT DEFAULT 'active',   -- active, onboarding, offboarding, departed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- 'macbook', 'ipad', 'iphone', 'monitor', 'accessory'
    model TEXT,
    serial_number TEXT UNIQUE,
    status TEXT DEFAULT 'active',  -- 'active', 'pending', 'deployed', 'retired'
    assigned_to_person_id TEXT REFERENCES people(id),  -- Links to Person, not email
    purchase_date DATE,
    trade_in_value DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Device assignments/history
CREATE TABLE device_assignments (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id),
    person_id TEXT NOT NULL REFERENCES people(id),  -- Assigned to Person
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME
);

-- Orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    total DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    tracking_number TEXT,
    carrier TEXT,
    is_synthetic BOOLEAN DEFAULT FALSE,  -- True for test orders (excluded from financials)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Audit log for compliance
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,     -- device, order, user, etc.
    entity_id TEXT NOT NULL,
    details TEXT,                  -- JSON blob of changes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Account invitations (pending invites to join an account)
CREATE TABLE account_invitations (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member, buyer
    invited_by_user_id TEXT NOT NULL REFERENCES users(id),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    declined_at DATETIME,
    revoked_at DATETIME,
    expires_at DATETIME,           -- Invitation expires after 14 days
    UNIQUE(account_id, email)      -- One active invite per email per account
);

-- Product catalog (global - managed by sys_admins)
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,     -- e.g., 'Apple', 'Samsung'
    slug TEXT NOT NULL UNIQUE,     -- e.g., 'apple'
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL REFERENCES brands(id),
    name TEXT NOT NULL,            -- e.g., 'MacBook Pro 14"'
    model_identifier TEXT,         -- e.g., 'MacBookPro18,3'
    model_number TEXT,             -- e.g., 'MKGR3LL/A'
    sku TEXT UNIQUE,
    product_type TEXT NOT NULL,    -- laptop, desktop, tablet, phone, accessory, display
    description TEXT,
    specs TEXT,                    -- JSON: { "processor": "M3 Pro", "memory": "18GB", ... }
    msrp DECIMAL(10,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory (stocked items - both new and used)
CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    serial_number TEXT UNIQUE,     -- Required for used items, optional for new
    condition TEXT NOT NULL DEFAULT 'new',  -- new, like_new, good, fair, refurbished
    status TEXT NOT NULL DEFAULT 'available',  -- available, reserved, sold, allocated
    purchase_cost DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    notes TEXT,
    warehouse_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_devices_account ON devices(account_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_assignments_device ON device_assignments(device_id);
CREATE INDEX idx_orders_account ON orders(account_id);
CREATE INDEX idx_audit_account ON audit_log(account_id);
CREATE INDEX idx_invitations_email ON account_invitations(email);
CREATE INDEX idx_inventory_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_products_brand ON products(brand_id);
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2 seconds | Lighthouse, RUM |
| Time to First Device | < 5 minutes | Analytics |
| Onboarding Completion | > 80% | Funnel tracking |
| Monthly Active Users | > 30% of accounts | PostHog |
| Support Response Time | < 15 minutes | Helpdesk metrics |
| Device Tracking Accuracy | 100% | Audit log |

---

## Open Questions

1. **Device Types** - Confirm supported types: MacBook, iPad, iPhone, Monitor, Accessory. Add Windows laptops?
2. **MDM Integration** - Which providers to prioritize: Addigy, Jamf, Mosyle?
3. **Seed Data** - Include demo devices for new organization onboarding?
4. **Webhook Security** - Implement Clerk webhook signature verification
5. **Rate Limiting** - Define API rate limits per organization tier
6. **Internationalization** - Support for non-USD currencies, multiple languages?

---

## 11. Marketing & Brand Assets

**File:** `tests/features/11-marketing.feature`
**Scope:** Marketing material generation, brand assets, and design system.

```gherkin
Feature: Marketing and Brand Assets
  As a Marketing Manager
  I want consistent brand assets and marketing materials
  So that we maintain brand identity across all channels

  Background:
    Given the brand ethos is "Clarity and Minimalism"
    And the primary color palette uses oklch color system

  @REQ-MKT-001 @Brand @DesignSystem
  Scenario: Design System Documentation
    When I access the design system documentation
    Then I should see the following components:
      | Component        | Variants                           |
      | Colors           | Primary, Secondary, Muted, Accent  |
      | Typography       | Headings, Body, Captions           |
      | Spacing          | 4px grid system                    |
      | Border Radius    | sm, md, lg, full                   |
      | Shadows          | sm, md, lg, xl                     |
    And I should see interactive component examples
    And I should see copy-paste code snippets

  @REQ-MKT-002 @Assets @Logos
  Scenario: Brand Asset Library
    When I access the brand asset library
    Then I should see the following assets available for download:
      | Asset              | Formats              |
      | Logo (Full)        | SVG, PNG, PDF        |
      | Logo (Mark only)   | SVG, PNG, PDF        |
      | Logo (Dark mode)   | SVG, PNG, PDF        |
      | Favicon            | ICO, SVG, PNG        |
      | Social avatars     | PNG (various sizes)  |
      | OG Image template  | PNG, Figma           |
    And each asset should have usage guidelines

  @REQ-MKT-003 @Marketing @LandingPages
  Scenario: Landing Page Variants for Campaigns
    When I create a marketing campaign
    Then I should be able to generate landing pages with:
      | Parameter         | Options                                |
      | UTM Source        | google, linkedin, facebook, email      |
      | UTM Campaign      | leasing, financing, asset-management   |
      | Hero Message      | Customizable per campaign              |
      | CTA               | Customizable text and destination      |
    And all pages should track UTM parameters to PostHog

  @REQ-MKT-004 @Email @Templates
  Scenario: Email Marketing Templates
    When I access email templates
    Then I should see templates for:
      | Template Type       | Purpose                             |
      | Welcome             | New user onboarding                 |
      | Order Confirmation  | Purchase confirmation               |
      | Shipping Update     | Tracking notifications              |
      | Device Reminder     | Return/upgrade prompts              |
      | Newsletter          | Monthly updates                     |
    And all templates should use consistent branding
    And templates should be mobile-responsive

  @REQ-MKT-005 @Social @Assets
  Scenario: Social Media Asset Generation
    When I request social media assets
    Then I should be able to generate:
      | Platform       | Sizes                    |
      | LinkedIn       | 1200x627, 1080x1080      |
      | Twitter/X      | 1200x675, 800x418        |
      | Facebook       | 1200x630, 1080x1080      |
      | Instagram      | 1080x1080, 1080x1350     |
    And assets should include product imagery
    And assets should maintain brand consistency
```

---

## 12. UI Styles & Design Tokens

**File:** `tests/features/12-design-tokens.feature`
**Scope:** CSS custom properties, Tailwind configuration, component styling.

```gherkin
Feature: UI Styles and Design Tokens
  As a Frontend Developer
  I want consistent design tokens
  So that the UI is cohesive across all pages and components

  Background:
    Given Tailwind CSS v4 is configured with Vite plugin
    And shadcn/ui semantics are used for theming

  @REQ-UI-001 @Tokens @Colors
  Scenario: Color Token System
    When I access the CSS custom properties
    Then I should see the following color tokens:
      | Token                  | Usage                         |
      | --background           | Page background               |
      | --foreground           | Primary text                  |
      | --muted                | Muted backgrounds             |
      | --muted-foreground     | Secondary text                |
      | --primary              | Primary actions               |
      | --primary-foreground   | Text on primary               |
      | --secondary            | Secondary actions             |
      | --accent               | Accent/highlight              |
      | --destructive          | Error/danger states           |
      | --border               | Border colors                 |
      | --ring                 | Focus rings                   |
    And colors should use oklch color space
    And dark mode variants should be defined

  @REQ-UI-002 @Tokens @Typography
  Scenario: Typography System
    When I review typography tokens
    Then I should see:
      | Element    | Font         | Size   | Weight    |
      | h1         | System/Inter | 2.5rem | Bold      |
      | h2         | System/Inter | 2rem   | Semibold  |
      | h3         | System/Inter | 1.5rem | Semibold  |
      | body       | System/Inter | 1rem   | Normal    |
      | small      | System/Inter | 0.875rem | Normal  |
    And line heights should ensure readability

  @REQ-UI-003 @Components @Variants
  Scenario: Component Variant System
    When I use a Button component
    Then I should have access to variants:
      | Variant    | Use Case                           |
      | default    | Primary actions                    |
      | secondary  | Secondary actions                  |
      | outline    | Tertiary actions                   |
      | ghost      | Subtle actions                     |
      | destructive| Dangerous actions                  |
      | link       | Inline text links                  |
    And sizes: sm, md, lg
    And states: default, hover, focus, disabled, loading

  @REQ-UI-004 @Responsive @Breakpoints
  Scenario: Responsive Breakpoints
    When I review responsive design tokens
    Then I should see breakpoints:
      | Breakpoint | Width   | Usage              |
      | sm         | 640px   | Mobile landscape   |
      | md         | 768px   | Tablet             |
      | lg         | 1024px  | Desktop            |
      | xl         | 1280px  | Large desktop      |
      | 2xl        | 1536px  | Extra large        |
    And all components should be responsive

  @REQ-UI-005 @Animation @Motion
  Scenario: Animation and Motion Tokens
    When I review animation settings
    Then I should see:
      | Token              | Value   | Usage                  |
      | --duration-fast    | 150ms   | Micro-interactions     |
      | --duration-normal  | 300ms   | Standard transitions   |
      | --duration-slow    | 500ms   | Page transitions       |
      | --easing-default   | ease-out| Default easing         |
    And animations should respect prefers-reduced-motion
```

---

## 13. Infrastructure & DNS

**File:** `tests/features/13-infrastructure.feature`
**Scope:** DNS configuration, CDN, SSL, and domain management.

```gherkin
Feature: Infrastructure and DNS Configuration
  As a DevOps Engineer
  I want proper DNS and infrastructure setup
  So that the platform is accessible and secure

  Background:
    Given the primary domain is "tryequipped.com"
    And CloudFlare is the DNS provider and CDN

  @REQ-INFRA-001 @DNS @Records
  Scenario: Required DNS Records
    When I configure DNS for the platform
    Then I should have the following records:
      | Type  | Name           | Value/Target                    | Purpose              |
      | A     | @              | CloudFlare Workers IP           | Root domain          |
      | CNAME | www            | tryequipped.com                 | WWW redirect         |
      | CNAME | admin          | tryequipped.com                 | Admin subdomain      |
      | CNAME | webhooks       | tryequipped.com                 | Webhook handlers     |
      | CNAME | *.accounts     | tryequipped.com                 | Tenant subdomains    |
      | TXT   | @              | Verification records            | Domain verification  |
      | MX    | @              | Mail provider                   | Email delivery       |
    And all records should have appropriate TTLs

  @REQ-INFRA-002 @SSL @Certificates
  Scenario: SSL Certificate Configuration
    When I review SSL configuration
    Then:
      | Requirement            | Status      |
      | Full (strict) mode     | Enabled     |
      | HSTS                   | Enabled     |
      | TLS 1.2+               | Required    |
      | Certificate coverage   | Wildcard    |
      | Auto-renewal           | Enabled     |

  @REQ-INFRA-003 @Subdomains @Routing
  Scenario: Subdomain Routing Configuration
    When I configure subdomain routing
    Then I should have:
      | Subdomain Pattern | Handler                    |
      | (root)            | Static landing page        |
      | www               | Redirect to root           |
      | admin             | Admin dashboard (sys_admin)|
      | webhooks          | Webhook endpoints          |
      | {tenant}          | Tenant dashboard           |
    And reserved subdomains should return 404:
      | Reserved    |
      | api         |
      | app         |
      | billing     |
      | cdn         |
      | help        |
      | shop        |
      | store       |
      | support     |

  @REQ-INFRA-004 @Headers @Security
  Scenario: Security Headers Configuration
    When I review response headers
    Then the following headers should be set:
      | Header                        | Value                          |
      | Strict-Transport-Security     | max-age=31536000; includeSubDomains |
      | X-Content-Type-Options        | nosniff                        |
      | X-Frame-Options               | DENY                           |
      | Content-Security-Policy       | Appropriate CSP                |
      | Referrer-Policy               | strict-origin-when-cross-origin|
      | Permissions-Policy            | Restrictive policy             |

  @REQ-INFRA-005 @CDN @Caching
  Scenario: CDN and Caching Configuration
    When I review caching rules
    Then:
      | Path Pattern      | Cache TTL  | Cache-Control            |
      | /assets/*         | 1 year     | public, immutable        |
      | /_astro/*         | 1 year     | public, immutable        |
      | /api/*            | 0          | no-store                 |
      | /*.html           | 0          | no-cache, must-revalidate|
      | /                 | 1 hour     | public, s-maxage=3600    |
```

---

## 14. Monitoring & Observability

**File:** `tests/features/14-monitoring.feature`
**Scope:** Uptime monitoring, alerting, logging, and health checks.

```gherkin
Feature: Monitoring and Observability
  As a Platform Operator
  I want comprehensive monitoring
  So that I can ensure uptime and quickly diagnose issues

  Background:
    Given multiple monitoring systems are configured
    And alerting is set up for on-call rotation

  @REQ-MON-001 @Uptime @Endpoints
  Scenario: Uptime Monitoring Endpoints
    When I configure uptime monitors
    Then I should monitor the following endpoints:
      | Endpoint              | Frequency | Alert Threshold |
      | https://tryequipped.com | 1 min   | 2 failures      |
      | https://tryequipped.com/api/health | 1 min | 2 failures |
      | https://admin.tryequipped.com | 5 min | 3 failures    |
      | https://webhooks.tryequipped.com | 5 min | 3 failures |
    And I should receive alerts via:
      | Channel   | Urgency   |
      | Slack     | All       |
      | PagerDuty | Critical  |
      | Email     | All       |

  @REQ-MON-002 @Health @API
  Scenario: Health Check API Endpoint
    When I call GET /api/health
    Then I should receive:
      | Field       | Value                |
      | status      | "healthy" or "degraded" |
      | version     | Current deploy version |
      | timestamp   | Current ISO timestamp  |
      | checks.db   | "ok" or error message  |
      | checks.auth | "ok" or error message  |
    And response time should be < 100ms
    And status code should be 200 (healthy) or 503 (unhealthy)

  @REQ-MON-003 @Metrics @Dashboard
  Scenario: Observability Dashboard
    When I access the monitoring dashboard
    Then I should see:
      | Metric                  | Visualization   |
      | Request rate            | Time series     |
      | Response time (p50/p95/p99) | Time series |
      | Error rate              | Time series     |
      | Active users            | Counter         |
      | API calls by endpoint   | Bar chart       |
      | Database query time     | Histogram       |

  @REQ-MON-004 @Errors @Tracking
  Scenario: Error Tracking and Alerting
    When an unhandled error occurs
    Then the error should be:
      | Action                  | Tool/Channel    |
      | Captured with context   | Sentry          |
      | Grouped by type         | Sentry          |
      | Alerted if new          | Slack           |
      | Linked to user session  | PostHog         |
    And I should see stack trace, user context, and request details

  @REQ-MON-005 @Logging @Structured
  Scenario: Structured Logging
    When I review application logs
    Then logs should include:
      | Field          | Always Present |
      | timestamp      | Yes            |
      | level          | Yes            |
      | message        | Yes            |
      | request_id     | If request     |
      | user_id        | If authenticated |
      | account_id     | If in tenant   |
      | duration_ms    | If request     |
    And logs should be queryable in log aggregator
```

---

## 15. End-to-End Testing & Synthetic Transactions

**File:** `tests/features/15-e2e-testing.feature`
**Scope:** Full flow testing, synthetic transactions, and test data isolation.

```gherkin
Feature: End-to-End Testing and Synthetic Transactions
  As a QA Engineer
  I want to run end-to-end tests including synthetic transactions
  So that I can verify the entire platform works correctly in production

  Background:
    Given synthetic test accounts are isolated from production data
    And synthetic transactions are marked and excluded from analytics

  @REQ-E2E-001 @TestAccounts @Isolation
  Scenario: Test Account Isolation
    When I create a synthetic test account
    Then the account should:
      | Property              | Behavior                              |
      | Email domain          | Use @test.tryequipped.com             |
      | Account.is_synthetic  | true                                  |
      | Subdomain             | Use test-* prefix                     |
      | Feature flags         | Have all features enabled             |
    And the account should be excluded from:
      | System             | Exclusion Method                       |
      | PostHog analytics  | Filter by is_synthetic property        |
      | Revenue reporting  | Filter by is_synthetic flag            |
      | Customer counts    | Filter by email domain                 |
      | Marketing lists    | Exclude test domain                    |

  @REQ-E2E-002 @Synthetic @Orders
  Scenario: Synthetic Order Transactions
    Given I am using a synthetic test account
    When I place a test order
    Then the order should:
      | Property              | Value                              |
      | Order.is_synthetic    | true                               |
      | Payment               | Use Stripe test mode               |
      | Fulfillment           | Skipped or mocked                  |
      | Shipping              | No actual shipment                 |
    And the order should be excluded from:
      | System             | Exclusion Method                   |
      | Financial reports  | is_synthetic filter                |
      | Inventory counts   | Marked as test                     |
      | Order metrics      | Filtered in dashboards             |

  @REQ-E2E-003 @Synthetic @Webhooks
  Scenario: Test Webhook Handling
    Given I am testing webhook integrations
    When I trigger synthetic webhook events
    Then:
      | Webhook Type     | Behavior                           |
      | Stripe           | Use test mode events               |
      | Clerk            | Mark as synthetic in metadata      |
      | Upgraded         | Use sandbox environment            |
    And synthetic webhooks should not affect production data

  @REQ-E2E-004 @E2E @FlowTests
  Scenario Outline: Critical User Flow Tests
    Given I am running end-to-end tests
    When I execute the "<flow>" test
    Then all steps should complete successfully
    And test should complete within <timeout> seconds

    Examples:
      | flow                           | timeout |
      | User signup                    | 30      |
      | Google SSO login               | 30      |
      | Add device by serial           | 20      |
      | Assign device to employee      | 15      |
      | Browse product catalog         | 20      |
      | Add to cart and checkout       | 60      |
      | View order tracking            | 15      |
      | Invite team member             | 20      |
      | Accept invitation              | 20      |

  @REQ-E2E-005 @Synthetic @Cleanup
  Scenario: Synthetic Data Cleanup
    When the scheduled cleanup job runs
    Then synthetic test data older than 7 days should be:
      | Data Type        | Action                             |
      | Test accounts    | Soft deleted                       |
      | Test orders      | Hard deleted                       |
      | Test devices     | Hard deleted                       |
      | Test users       | Anonymized                         |
    And cleanup should be logged for audit

  @REQ-E2E-006 @Synthetic @Markers
  Scenario: Synthetic Transaction Markers
    When processing any request from a synthetic account
    Then the request should be marked with:
      | Header/Property       | Value                   |
      | X-Synthetic-Request   | true                    |
      | user.is_synthetic     | true (in PostHog)       |
      | event.is_test         | true (in analytics)     |
    And downstream services should check for markers

  @REQ-E2E-007 @LiveSite @SmokeTests
  Scenario: Production Smoke Tests
    When I run hourly smoke tests on production
    Then the following should be verified:
      | Test                    | Success Criteria         |
      | Homepage loads          | Status 200, < 2s         |
      | API health check        | Status 200, healthy      |
      | Static assets load      | Status 200               |
      | Auth pages accessible   | Status 200               |
      | Database connectivity   | Query returns            |
    And failures should trigger immediate alerts

  @REQ-E2E-008 @Synthetic @Environment
  Scenario: Test Environment Configuration
    When configuring synthetic testing
    Then the following should be isolated:
      | Component          | Production        | Synthetic            |
      | Stripe             | Live keys         | Test keys            |
      | Clerk              | Prod instance     | Prod (marked users)  |
      | Database           | Same D1           | is_synthetic filter  |
      | Email              | Production        | Intercepted/mocked   |
      | Shipping API       | Live              | Mocked responses     |
```

---

## 16. Multi-Tenancy Architecture

**File:** `tests/features/16-multi-tenancy.feature`
**Scope:** Tenant isolation, subdomain routing, and data segregation.

```gherkin
Feature: Multi-Tenancy Architecture
  As a Platform Architect
  I want proper tenant isolation
  So that customer data is secure and separated

  Background:
    Given the platform uses subdomain-based multi-tenancy
    And each Account represents a tenant

  @REQ-MT-001 @Subdomains @Routing
  Scenario: Subdomain-Based Tenant Resolution
    When a request comes to "{tenant}.tryequipped.com"
    Then the system should:
      | Step                    | Action                           |
      | Extract subdomain       | Parse from Host header           |
      | Validate subdomain      | Check against reserved list      |
      | Lookup account          | Query by short_name              |
      | Set tenant context      | Apply to all queries             |
    And if tenant not found, return 404

  @REQ-MT-002 @Data @Isolation
  Scenario: Tenant Data Isolation
    When querying tenant-scoped data
    Then the following models should be isolated:
      | Model               | Isolation Key           |
      | Person              | account_id              |
      | Device              | account_id              |
      | Integration         | account_id              |
      | Account::Access     | account_id              |
      | Account::Invitation | account_id              |
      | Order               | account_id              |
    And cross-tenant queries should be impossible without sys_admin

  @REQ-MT-003 @Global @Models
  Scenario: Global (Non-Tenant) Data Access
    When accessing global data
    Then the following should be accessible across tenants:
      | Model          | Access Level                           |
      | User           | Global (linked to accounts)            |
      | Brand          | Global (read-only for tenants)         |
      | Product        | Global (read-only for tenants)         |
      | Inventory Item | Global (stocked items for purchase)    |
    And only sys_admins can modify global models

  @REQ-MT-004 @Reserved @Subdomains
  Scenario: Reserved Subdomain Protection
    When a request comes for a reserved subdomain
    Then the following should NOT resolve to tenant:
      | Subdomain   | Behavior              |
      | www         | Redirect to root      |
      | admin       | Admin dashboard       |
      | webhooks    | Webhook handlers      |
      | api         | 404 (reserved)        |
      | app         | 404 (reserved)        |
      | billing     | 404 (reserved)        |
      | cdn         | 404 (reserved)        |
      | help        | 404 (reserved)        |
      | shop        | 404 (reserved)        |
      | store       | 404 (reserved)        |
      | support     | 404 (reserved)        |
```

---

## References

- **Figma Designs:** [Platform Design](https://www.figma.com/design/XEiUSo8vmtPFAeJU2DpFmF/Platform?node-id=466-8685)
- **Figma Prototype:** [Interactive Prototype](https://www.figma.com/proto/XEiUSo8vmtPFAeJU2DpFmF/Platform?page-id=466%3A8685)
- **Clerk Documentation:** [clerk.com/docs](https://clerk.com/docs)
- **Hono Documentation:** [hono.dev/docs](https://hono.dev/docs)
- **CloudFlare D1:** [developers.cloudflare.com/d1](https://developers.cloudflare.com/d1)
- **shadcn/ui:** [ui.shadcn.com](https://ui.shadcn.com)
- **21st.dev Components:** [21st.dev](https://21st.dev)
- **PostHog Analytics:** [posthog.com/docs](https://posthog.com/docs)
- **Stripe Testing:** [stripe.com/docs/testing](https://stripe.com/docs/testing)

---

*Document created: December 2024*
*Last Updated: December 2025*
*Purpose: Comprehensive Product Requirements for Equipped Platform*


