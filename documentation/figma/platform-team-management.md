# Team Management and Multi-Org Flow

## Overview

Equipped implements a comprehensive team (organization) management system enabling users to create, manage, and switch between multiple independent business entities. Each team operates as a separate organizational unit with its own settings, members, billing, and resources while sharing the same user account.

## Flow Name and Purpose

**Multi-Team Organization Management** - Enables flexible organizational structures where a single user can manage multiple independent business entities (teams) with role-based access control, team-scoped resources, and isolated configurations. This is particularly valuable for consultants, agencies, and multi-entity businesses.

## Team Creation and Selection

### Initial Team Creation (First-Time Onboarding)

Users encounter two team creation flows depending on their business model:

#### Standard Team Creation
- **Landing Page**: "Create a team" screen greets new users
- **Welcome Message**: "Welcome to Equipped, [Name]. Set up your team to get started."
- **Fields**:
  - Team name (required): Display name for the organization (e.g., "Acme", "Apple Pros")
  - Team subdomain (required): Unique identifier on Equipped platform (.tryequipped.com domain)
  - Team icon (optional): Visual avatar showing next to team name in UI
- **Form Actions**:
  - Remove icon: Clear previously selected image
  - Replace icon: Upload new image
- **Sign Out Link**: Option to sign out and use different account
- **Account Status**: Shows currently signed-in user email

#### Apple Consultant Specialization
- **Alternative Path**: "Sign up as an ACN instead" link for Apple Consultants Network members
- **ACN-Specific Fields**:
  - Team name (e.g., "Apple Pros")
  - Team subdomain (e.g., "applepros")
  - ACN Profile ID: Required field for ACN verification (e.g., "ABC123")
  - Note: ACN creation flow requires background verification before team gets margin/billing access
- **Additional Instructions**: "Lead other consultants to a contact form/support" and "Verify in the background before they get margin"

### Team Selector UI

Located in the header next to user avatar:
- **Single Team State**: Shows team name (e.g., "Acme") with dropdown indicator - clicking shows only current team in menu
- **Multiple Teams State**: Same visual appearance - dropdown reveals full team switcher with options to:
  - Switch to other owned teams
  - Access team settings for current team
  - Create new team

## Team Member Management

### People Management Interface

Accessible via dropdown menu under "People" option, provides full team member lifecycle management:

#### Member Operations
- **Add Members**: Invite new users to team with role assignment
- **Remove Members**: Revoke access for departing team members
- **Role Assignment**: Define member permissions and access levels
- **Role Types** (inferred from team management scope):
  - Admin: Full team management and settings access
  - Member: Standard access to team resources and operations
  - View-Only: Limited read-only access to team data

#### Member Visibility
- Full roster of current team members
- Member roles and permissions
- Invitation status for pending members
- Email addresses and contact information

## Team Settings and Configuration

### Team Settings Page

Comprehensive configuration panel accessed via dropdown menu:

#### Basic Identity
- **Team Name**: Editable team display name with character limit
- **Team Subdomain**: Unique URL identifier (.tryequipped.com domain)
  - Used for team-specific access URLs
  - Not changeable after initial creation (DNS/routing dependency)
- **Team Icon**: Visual avatar
  - Upload custom image
  - Replace existing icon
  - Appears in header and team listings

#### Business Information
- **EIN** (Employer Identification Number): Optional tax identifier field
- **Legal Company Name**: Official registered business name
- **Registered Business Address**: Physical business location for compliance/billing
- **Connections Section**: Placeholder for integrations with Google, ABM, ACN, or other platforms

#### Destructive Operations
- **Delete Team**: Irreversible team removal with explanation of consequences
- **Confirmation Required**: Warning text prevents accidental deletion
- **Admin-Only Access**: Only team owners can delete teams

#### Persistent Save
- **Save Button**: Commits all changes to team configuration
- Changes apply immediately across all team members' sessions

### Team Settings Left Sidebar Navigation

Organized menu structure for team-scoped resources:

1. **Team settings** (currently active)
2. **People** - Member management and invitations
3. **Orders** - Team purchase history and active orders
4. **Proposals** - Quote and proposal management
5. **Delivery addresses** - Saved shipping locations
6. **Payment methods** - Billing and payment information
7. **Billing** - Subscription, invoices, and billing details

## Switching Between Teams

### Team Switcher Dropdown

Accessed via header team selector (displays current team name):

#### Single Team Scenario
When user belongs to only one team:
- Dropdown shows current team only
- No switching options visible
- Still allows access to settings and create new team

#### Multiple Teams Scenario
When user has access to multiple teams:
- Current team highlighted/selected
- Other owned teams listed under "MY OTHER TEAMS" section
- Each team name shown with right arrow indicator
- Quick access to switch without page reload

#### Team Creation Option
- **"Create a new team"** button at bottom of dropdown
- Launches team creation flow
- Allows users to spin up additional organizations without re-authentication

### Navigation Impact
- Switching teams refreshes user context
- All team-scoped resources update to new team
- Navigation maintains user position (if switching to team with same section)
- Orders, settings, and billing data reflect new team

## Team Permissions and Access Control

### Role-Based Access Control (RBAC)

Teams implement hierarchical permission model:

#### Admin Role
- Full team management access
- Settings modification (name, subdomain, business info)
- Member management (add, remove, change roles)
- Billing and payment method management
- Order and proposal creation/modification
- Delete team capability
- Settings interface fully editable

#### Member Role
- Standard operational access
- Create and manage orders
- View team proposals and delivery addresses
- Access payment methods for purchases
- View team billing information
- Cannot modify team settings
- Cannot add/remove members
- Cannot delete team

#### View-Only Role
- Read-only access to team resources
- View orders and proposals
- View team information
- Cannot create orders or make changes
- Cannot access billing or payment methods
- Limited to observation and reporting

### Access Inheritance

- Permissions automatically applied when user joins team
- Role determines available UI sections and actions
- Settings hidden/disabled for non-admin users
- Sensitive operations (delete, member removal) require admin role

## Team-Scoped Resources

All platform resources are isolated at team level:

### Orders
- Team-specific order history
- Purchase management within team context
- Tied to team billing account
- Team members can create and modify (based on role)

### Proposals
- Team-generated quotes and proposals
- Shared with customers under team identity
- Archived at team level

### Delivery Addresses
- Saved shipping locations for team
- Used during checkout for team orders
- Supports multiple locations per team

### Payment Methods
- Team billing payment instruments
- Credit cards, bank accounts, invoicing
- Used for all team transactions
- Admin-only modification

### Billing and Subscriptions
- Team subscription status
- Monthly billing ($X/month model)
- Invoice history
- Billing contact information
- Team-specific pricing and discounts

## Integration with Account Settings and Leasing

### Account vs Team Separation

**User Account** (user-level settings):
- Personal profile information
- Primary email address
- Authentication credentials
- Account security settings
- Accessibility preferences

**Team** (org-level settings):
- Business information and legal name
- Team member roster
- Billing configuration
- Resource management
- Team-specific rules and policies

### Account Settings Access
- Accessible via user avatar menu (separate from team menu)
- Manages personal account across all teams
- Changes apply universally to all user's teams
- Profile image and display name shared across teams

### Leasing Integration

Teams tie directly to equipment leasing operations:
- Orders are team-scoped lease transactions
- Billing charged to team's payment method
- Delivery addresses used for lease fulfillment
- Team members collaborate on equipment provisioning
- Proposals contain team-specific lease terms

## Team Onboarding Flow

### Complete Onboarding Sequence

#### Step 1: Authentication
- User signs up or logs in to Equipped
- Account created with email verification
- User lands on "Existing teams" page if already in teams, or team creation page if new

#### Step 2: Team Creation Choice
- **Path A - New User**: Directed to "Create a team" form
- **Path B - Existing User with Invitations**: See "Existing teams" page with pending invitations and "Create a new team" option

#### Step 3: Team Information Entry
Users fill team creation form:
- Team name (e.g., "Acme", "Dunder Mifflin")
- Team subdomain (e.g., "acme", "dundermifflin")
- Team icon upload (optional but recommended)
- ACN Profile ID (if Apple Consultant)

#### Step 4: Verification (ACN Path Only)
- Form submitted with ACN Profile ID
- Background verification triggered in system
- User may receive: "Verify in the background before they get margin"
- Billing access restricted pending verification

#### Step 5: Team Activation
- Team created and activated
- User assigned as Team Admin
- Initial settings configuration available
- Dashboard/main application accessible

#### Step 6: Team Population (Optional)
- Add team members via "People" section
- Send invitations to collaborators
- Assign appropriate roles
- Team ready for operations

#### Step 7: Resource Configuration
- Configure delivery addresses
- Set up payment methods
- Create billing contact info
- Complete onboarding checklist

### Onboarding State Display

**"Existing teams" Landing Page** (when user has teams/invitations):
- Welcome message: "Join or create a new team to get started"
- **Teams you're invited to** section:
  - List of pending team invitations
  - Teams from other users offering membership
  - "Join >" button to accept invitation
  - Examples: Team "A", Team "B"
- **Create a new team** option at bottom
- Sign out link for account switching

### Invitation Workflow

When invited to another's team:

1. Invitation received (email or pending in Equipped)
2. Shows in "Existing teams" page under pending invitations
3. User clicks "Join >" to accept
4. Access immediately granted with invited role
5. Team appears in team switcher dropdown
6. Resources from invited team become available

## Team Lifecycle Management

### Team Creation
- User provides team name, subdomain, icon
- Optional: EIN, legal name, business address (can be filled later)
- Team activated with user as admin
- Team available in switcher immediately

### Active Team Operations
- Members manage resources within team scope
- Settings modified by admins
- Billing accrues against team subscription
- Orders/proposals tied to team identity

### Team Deletion
- Admin initiates "Delete team" from Team Settings
- Warning displayed about consequences
- Irreversible operation
- Prevents accidental deletion through confirmation flow
- All team resources archived or deleted per policy
- Member access immediately revoked

### Team Hibernation (Implied)
- No explicit hibernation mentioned
- Inactive teams accessible via switcher
- Billing continues if team has active subscription
- Team can be reactivated by logging in and switching to it

## Key Design Patterns

### Team Isolation
- Each team operates independently
- No cross-team resource sharing
- Team switcher prevents accidental operations on wrong team
- Settings changes only affect current team

### Progressive Disclosure
- Team creation form minimal (name, subdomain, icon)
- Additional fields (EIN, business address) optional initially
- Full configuration available in Team Settings page
- Members added after team creation

### Accessibility
- Dropdown menu near user avatar for familiarity
- Clear indication of current team
- Quick team switching without page navigation
- "Create new team" prominent in dropdown

### Scalability for Agencies/Consultants
- Support unlimited teams per user
- Each team fully independent
- Easy team switching for multi-client management
- Role-based access prevents privilege escalation
- Team member collaboration within boundaries

## Security Considerations

### Member Removal
- Revokes immediate access to team resources
- User retains account; just loses this team
- No residual access to team data
- Applied immediately across sessions

### Admin-Only Operations
- Team deletion restricted to admins
- Settings modification admin-only
- Member management restricted to admins
- Payment method changes admin-only

### Team-Scoped Billing
- Each team has independent billing
- No cross-team billing
- Team admins manage their own payment methods
- Prevents unauthorized spending on shared accounts

### ACN Verification
- Additional background verification for Apple Consultants
- Billing access restricted pending verification
- Prevents fraud in ACN channel
- Clear communication of verification status
