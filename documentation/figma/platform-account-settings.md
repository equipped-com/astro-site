# Account Settings & User Preferences Flow

## Flow Overview

The Account Settings & User Preferences flow provides users with comprehensive control over their personal account information, team management, billing, and platform preferences. This flow is accessible from the account dropdown menu in the top-right navigation and serves as the central hub for user profile management across the Equipped platform.

**Primary Purpose:** Enable users to manage their account identity, team configurations, payment methods, billing preferences, and account security settings.

---

## 1. User Profile Management

### Account Dropdown Menu

The account dropdown menu is the primary entry point for accessing account-related features. It displays:

- **User Identity Display**
  - User's full name (e.g., "Leon Quigley")
  - User's email address (e.g., "leon@acme.corp")
  - User avatar (initial-based badge)

- **Primary Actions**
  - "My settings" - Routes to personal account settings
  - "Log out" - Terminates the current session

### User Profile Information

User profile management allows users to maintain their personal identity within the platform:

- **Display Name** - Full name displayed throughout the platform
- **Email Address** - Primary contact email associated with the account
- **User Avatar** - Profile picture or initial-based badge for visual identification
- **Account Email Verification** - Ensures email address is valid and reachable

---

## 2. Account Settings & Preferences

### Personal Settings Page

The personal settings section (accessed via "My settings" in the account dropdown) provides user-level configuration options, including:

- **Profile Customization**
  - Edit full name
  - Update profile avatar/photo
  - Manage display preferences

- **Account Preferences**
  - Theme selection (light/dark mode)
  - Language preference
  - Date and time format preferences
  - Default time zone

- **Email & Communication Settings**
  - Primary email address
  - Secondary email addresses (if applicable)
  - Email visibility within the organization

---

## 3. Notification Preferences

### Notification Configuration

Users can control how and when they receive notifications across the platform:

- **Email Notifications**
  - Team activity summaries
  - Order updates and confirmations
  - Billing and subscription alerts
  - System notifications and announcements

- **Notification Frequency**
  - Real-time alerts
  - Daily digest
  - Weekly summary
  - Disable notifications

- **Notification Topics**
  - Team invitations
  - Equipment assignments
  - Lease reminders
  - Payment confirmations
  - Account security alerts

- **Notification Channels**
  - Email delivery
  - In-app notifications
  - Dashboard notifications

---

## 4. Payment Method Management

### Payment Methods Section (Team-Level)

Located in Team Settings under the "Payment methods" subsection:

- **Add Payment Method**
  - Credit/debit card details
  - Billing name and address
  - Card holder information
  - CVV verification

- **Manage Existing Methods**
  - Set default payment method
  - Update card information
  - Remove expired or unused payment methods
  - View payment method history

- **Payment Method Security**
  - PCI DSS compliance
  - Secure tokenization of card data
  - Automatic expiration alerts

---

## 5. Billing & Subscription Management

### Billing Section (Team-Level)

The Billing subsection in Team Settings provides comprehensive billing controls:

- **Subscription Overview**
  - Current plan tier
  - Billing cycle (monthly)
  - Renewal date
  - Subscription status

- **Invoice Management**
  - View billing history
  - Download invoices as PDF
  - Invoice date and amount
  - Payment status tracking

- **Billing Address**
  - Legal company name
  - Registered business address
  - Tax ID/EIN (for invoicing)

- **Plan Management**
  - Upgrade/downgrade options
  - Cancel subscription
  - Pause subscription
  - View plan features and limits

- **Cost Breakdown**
  - Equipment lease costs
  - Per-device fees
  - Service charges
  - Applied discounts or promos

- **Payment History**
  - Transaction records
  - Payment dates and amounts
  - Failed payment notices
  - Retry payment options

---

## 6. Account Security Options

### Security & Authentication Settings

Users have control over authentication and account security:

- **Password Management**
  - Change password
  - Password strength requirements
  - Password update history

- **Two-Factor Authentication (2FA)**
  - Enable/disable 2FA
  - Authenticator app setup
  - Backup codes generation
  - SMS backup codes

- **Active Sessions**
  - View all logged-in sessions
  - Device information (browser, OS)
  - Session IP addresses and locations
  - Logout from remote sessions

- **Account Recovery**
  - Recovery email address
  - Recovery phone number
  - Account recovery options

- **Connected Apps & Integrations**
  - Authorized third-party applications
  - Scope permissions granted
  - Revoke app access
  - Connected service management

---

## 7. Team Management Integration

### Team Context Switching

The navigation integrates team management with account settings:

- **Team Dropdown Menu**
  - Currently selected team
  - Team icon/avatar
  - Team subdomain (.tryequipped.com)

- **Team Navigation Options**
  - Team settings
  - People (team members)
  - Orders
  - Proposals
  - Delivery addresses
  - Payment methods
  - Billing

- **Multi-Team Support**
  - View all teams user belongs to
  - "My Other Teams" section shows additional teams
  - Quick team switching
  - Create a new team option

### Team Settings Page

When accessed from the team dropdown, users can manage team-specific settings:

- **Team Identification**
  - Team name (editable)
  - Team subdomain (customizable)
  - Team icon/logo upload

- **Team Legal Information**
  - EIN (Employer Identification Number)
  - Legal company name
  - Registered business address
  - Business registration details

- **Team Connections**
  - Third-party integrations (Google, ABM, ACN, etc.)
  - Integration status
  - Connected service configuration

- **Team Deletion**
  - Delete team option with confirmation
  - Warning about consequences
  - Data retention information

### People Management

The "People" section allows users to manage team membership:

- **Team Members List**
  - Member names and roles
  - Email addresses
  - Join date
  - Permission levels

- **Add Team Members**
  - Invite by email
  - Set member roles
  - Grant specific permissions
  - Bulk invitations

- **Member Roles & Permissions**
  - Owner
  - Admin
  - Manager
  - User
  - Viewer
  - Custom roles

- **Remove Members**
  - Revoke team access
  - Archive member accounts
  - Transfer ownership

---

## 8. Related Functional Areas

### Integration with Authentication Flow

Account settings integrate seamlessly with the authentication system:

- **Sign-Out Flow**
  - Available from account dropdown
  - Clears session tokens
  - Redirects to login page
  - Maintains security across sessions

- **Multi-Workspace Support**
  - Switch between teams without re-authenticating
  - Maintain session across team context
  - Role-based access control per team

### Orders & Delivery Management

Team settings connect to order and logistics management:

- **Delivery Addresses**
  - Multiple addresses per team
  - Set default delivery location
  - Update address information
  - Archive old addresses

- **Orders Subsection**
  - View team order history
  - Track current orders
  - Access order details and invoices

### Integration with Billing System

Billing and payment settings integrate with the ordering system:

- **Invoice Auto-Generation**
  - Monthly invoicing based on active leases
  - Automatic payment processing
  - Failed payment notifications
  - Payment retry logic

---

## 9. Data Management & Export Options

### Data Export & Privacy

Users have control over their data:

- **Data Portability**
  - Export personal account data
  - Export team data (for team owners)
  - Format: PDF, CSV where applicable
  - GDPR compliance

- **Data Retention**
  - Data stored during active subscription
  - Data retention post-deletion
  - Permanent deletion requests
  - Compliance certifications

### Account Deletion & Deactivation

Users can manage account lifecycle:

- **Deactivate Account**
  - Temporary account suspension
  - Reactivation option
  - Preserves data

- **Delete Account**
  - Permanent account deletion
  - Data deletion confirmation
  - Irreversible action warning
  - Data export before deletion

- **Team Deletion**
  - Delete team workspace
  - Impact on team members
  - Asset reassignment options
  - Confirmation requirements

---

## User Flow Diagram

```
Account Dropdown
├── User Profile Display
│   ├── Name
│   ├── Email
│   └── Avatar
├── My settings
│   ├── Profile Management
│   ├── Preferences
│   └── Notification Settings
└── Log out

Team Dropdown
├── Current Team Display
└── Team Navigation Menu
    ├── Team settings
    │   ├── Team Identification
    │   ├── Legal Information
    │   ├── Connections/Integrations
    │   └── Delete Team
    ├── People (Team Members)
    │   ├── View Members
    │   ├── Add Members
    │   ├── Manage Roles
    │   └── Remove Members
    ├── Orders
    ├── Proposals
    ├── Delivery addresses
    │   └── Manage Addresses
    ├── Payment methods
    │   ├── Add Payment Method
    │   ├── Set Default
    │   └── Remove Method
    ├── Billing
    │   ├── Subscription Overview
    │   ├── Invoice Management
    │   ├── Plan Management
    │   └── Payment History
    └── Create a new team
```

---

## Key Design Principles

1. **User Control** - Users have granular control over all account-related settings and preferences

2. **Clarity** - Settings are organized logically with clear labels and explanations

3. **Safety** - Destructive actions (delete team, delete account) require confirmation and warnings

4. **Multi-Tenancy** - Seamless team switching without losing context or requiring re-authentication

5. **Security** - Authentication, 2FA, and session management are integrated throughout

6. **Transparency** - Clear display of billing, subscriptions, and associated costs

7. **Accessibility** - Account settings and team settings are easily discoverable from the main navigation

---

## Access Points

- **Account Dropdown** (top-right navigation) - User profile and personal settings
- **Team Dropdown** (top-right navigation) - Team management and billing
- **Direct URL** - `/settings` for personal account settings
- **Team Settings URL** - `/team/settings` for current team configuration

---

## Related Documentation

- **Authentication Flow** - User sign-in, sign-up, and session management
- **Team Management Flow** - Team creation, member management, role-based access
- **Billing & Subscription System** - Payment processing, invoice generation, plan tiers
- **Notification System** - Email delivery, notification preferences, alert logic
- **Integration Management** - Third-party service connections and permissions

