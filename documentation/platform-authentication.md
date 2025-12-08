# Platform Authentication & Onboarding Flow

## Overview

The Equipped platform uses a modern, multi-option authentication system designed to streamline account creation and sign-in. The flow prioritizes OAuth integration (Google and Microsoft) while providing a traditional email-based fallback option. All new accounts require email verification before full platform access.

---

## Sign Up Journey

### Initial Sign Up Screen

**Purpose:** Allow users to create a new account using their preferred authentication method.

**Tagline:** "Sign up to Equipped - And discover a better way to manage your team's equipment."

**Available Options:**

1. **Continue with Google**
   - Primary OAuth provider
   - One-click account creation for Google account holders
   - Retrieves name and email from Google profile

2. **Continue with Microsoft**
   - Alternative OAuth provider for Microsoft/Office 365 users
   - Seamless integration for enterprise users

3. **Continue with Email** (Fallback Option)
   - Traditional email/password registration
   - For users without Google or Microsoft accounts
   - Requires manual entry of:
     - Full Name
     - Work Email Address

**Legal Compliance:**
- Terms and Conditions acceptance required
- Privacy Policy acknowledgment required
- Links provided at bottom of form for review

**Form Fields (Email Path):**
```
Name                    [Text input]
Work email              [Text input]
[Continue with email]   [Primary button]
```

### Sign Up Behavior

**OAuth Flow (Google/Microsoft):**
1. User clicks "Continue with Google" or "Continue with Microsoft"
2. Redirected to OAuth provider's authentication screen
3. User selects existing account or creates new one at provider
4. Account selection screen appears (see Google Account Selection below)
5. Email verification sent to selected email address

**Email Registration Flow:**
1. User enters name and work email
2. System validates email format and uniqueness
3. User proceeds to Email Verification step

---

## Sign In Options

### Email/Password Sign In

**Availability:** Available for accounts created via email registration

**Requirements:**
- Work email address
- Account password (set during initial email verification flow)

**Process:**
1. User enters email address
2. User enters password
3. System validates credentials
4. If account requires re-verification, email code is sent
5. User is directed to verification code entry if needed

### Google Sign In

**Flow:** "Sign in with Google" button

**Account Selection Screen:**
- Displays previously linked Google accounts with user avatars and email addresses
- Shows initials (first letter of first name) in colored circle
- Option to "Use another account" for new Google account sign-in

**Data Shared with Equipped:**
- Name
- Email address
- Language preference
- Profile picture

**Consent Display:**
```
"To continue, Google will share your name, email address,
language preference, and profile picture with Equipped.
Before using this app, you can review Equipped's
privacy policy and terms of service."
```

**Location:** Google's consent dialog shown during sign-in

### Multiple Google Accounts

**Scenario:** User has multiple Google accounts linked

**Presentation:**
- Each account shown with initials badge, name, and email
- Most recent or primary account displayed first
- Quick selection for account switching
- "Use another account" option to add new Google account

**Example Display:**
```
Leon Quigley                    [L badge]
leon@acme.corp

Leon Quigley                    [L badge]
leonq@gmail.com

[Use another account icon] Use another account
```

---

## Email Verification Process

### Verification Code Generation

**Trigger:**
- New account created via email registration
- User attempts to sign in to an account needing re-verification
- User requests verification code resend

**Email Delivery:**
- Temporary verification code sent to user's work email
- Code format: 6-digit numeric code (e.g., "123456")
- Delivery includes:
  - One-click magic link for immediate login
  - Temporary code for manual entry
  - Security notice about ignoring email if unauthorized

### Verification Code Entry Screen

**Purpose:** Confirm email ownership and activate account

**Screen Title:** "Enter the code sent to your email"

**Display Information:**
- Confirmation message: "We just sent a temporary verification code to [email@domain.com]"
- Change email link: "Change" (allows user to provide different email)

**Input Field:**
```
Verification code       [Text input - accepts 6 digits]
[Continue]              [Primary button]
```

**User Actions:**
- Enter 6-digit code received in email
- Click "Continue" to verify
- Click "Change" to use different email address

### Email Content

**Email Subject:** "Log in to Equipped"

**Email Body Contents:**
1. Primary CTA: "Click here to log in with this magic link"
2. Secondary option: "Or, copy and paste this temporary verification code: [CODE]"
3. Security footer: "If you didn't try to login, you can safely ignore this email."

**Security Considerations:**
- Magic link expires after single use or time limit
- Code is temporary and single-use
- No sensitive information in email body
- Clear security guidance for unexpected emails

---

## OAuth Integration (Google)

### Account Selection & Linking

**When Multiple Accounts Exist:**
- User sees list of previously connected Google accounts
- Option to select different account or add new one
- Account switching doesn't create duplicate profiles

**New Account via OAuth:**
1. User clicks "Continue with Google"
2. Google account selection/sign-in
3. Profile data pulled from Google (name, email, picture)
4. Email verification code sent to Google account email
5. Code entry required to complete setup

**Subsequent Sign-Ins:**
1. User clicks "Continue with Google"
2. Google account selection shown
3. Automatic sign-in or verification code sent
4. Redirected to dashboard upon verification

### Data Privacy

**What Google Shares:**
- Full name (from profile)
- Email address (primary account email)
- Language preference
- Profile picture/avatar

**Data Usage:**
- Name used for account display and team communications
- Email for notifications and password recovery
- Picture for user avatar in interface

**What Equipped Does Not Access:**
- Password (OAuth handles authentication)
- Calendar or Drive data
- Contacts or other sensitive data

---

## Password Recovery Flow

### Initiating Recovery

**Access Point:** "Forgot password?" link on sign-in screen

**Process:**
1. User clicks "Forgot password?"
2. Enters email address associated with account
3. System sends password recovery email

### Recovery Email

**Delivery:** Sent to account email address

**Email Contents:**
1. Password reset link (one-time use)
2. Temporary recovery code (6-digit)
3. Security notice about unauthorized attempts

### Recovery Code Entry

**Screen:**
```
Reset your password
[Enter recovery code]   [Text input]
[Continue]              [Primary button]
```

**Next Step:** User creates new password

### Password Reset

**Requirements:**
- At least 8 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not same as previous passwords (if enforced)

---

## Session Management

### Session Creation

**Trigger Events:**
- Successful email verification
- Successful OAuth sign-in
- Successful password entry

**Session Duration:**
- Active session: 30 days (default, subject to configuration)
- Inactivity timeout: 14 days without browser activity
- Multi-device sessions: Allowed with independent timeouts

### Session Security

**HTTPS Only:**
- Secure cookie flags set
- HttpOnly flag prevents JavaScript access
- SameSite cookie policy prevents CSRF

**Session Data:**
- User ID
- Account permissions level
- Team affiliations
- OAuth provider (if applicable)

### Multi-Device Sign In

**Behavior:**
- Users can sign in from multiple devices simultaneously
- Each device maintains independent session
- Sign out on one device doesn't affect others
- No limit on concurrent sessions (subject to plan)

---

## Logout

### Sign Out Process

**Trigger:** User clicks "Sign out" in account menu

**Steps:**
1. Session token revoked on server
2. Local session data cleared
3. User redirected to sign-in screen
4. Browser cookies cleared

### Post-Logout Behavior

**Access Restrictions:**
- Dashboard and workspace pages redirect to sign-in
- API tokens become invalid
- Previous session cannot be resumed

**Next Sign-In:**
- User must enter credentials again
- OAuth sign-in shows account selection
- No session data persists

---

## Error States & Validation

### Email Validation

**Invalid Format:**
- Message: "Please enter a valid email address"
- Example: "missing @ symbol or invalid domain"
- Inline error display below email field

**Email Already Registered:**
- Message: "An account with this email already exists. Sign in instead?"
- Suggestion: Direct to sign-in page
- Recovery option: Password reset

**Unverified Email Domain:**
- Message: "Please use a work email address (not personal email)"
- Example: Rejects gmail.com, outlook.com for certain organizations
- Shows accepted domains or contact admin

### Code Validation

**Invalid Code:**
- Message: "Verification code is incorrect or has expired"
- Action: Prompt to request new code
- Retry attempts: Typically 3-5 before temporary lockout

**Expired Code:**
- Time limit: Usually 10-15 minutes
- Message: "Code expired. We sent a new one to your email"
- Resend option: Automatic or manual

**Code Format Error:**
- Message: "Please enter a 6-digit code"
- Error shown: As user types (e.g., non-numeric characters rejected)

### OAuth Errors

**Account Not Found:**
- Message: "No account linked to this Google account"
- Action: Offer to create new account with same email
- Recovery: Sign up with email instead

**Permission Denied:**
- Message: "Sign in cancelled. Please try again."
- Reason: User denied OAuth permissions at provider
- Action: Return to sign-in screen

**OAuth Provider Down:**
- Message: "Unable to connect to Google. Please try again or use email sign-in"
- Fallback: Offer email/password option
- Retry button: Explicit retry or auto-retry after 30 seconds

### Network Errors

**Timeout:**
- Message: "Connection timeout. Please check your internet and try again"
- Timeout threshold: 30 seconds
- Retry logic: User clicks "Try again"

**Server Error (5xx):**
- Message: "Something went wrong on our end. Please try again later"
- Error ID: Unique identifier for support tickets
- Automatic retry: Not recommended without user action

---

## Account Setup & Team Management Integration

### Post-Verification Redirect

**After Email Verification:**
- User redirected to Account Setup screen
- No forced immediate team creation
- Option to complete profile or skip to dashboard

### Account Setup Screen

**Fields:**
- Full name (pre-filled from registration or OAuth)
- Avatar/profile picture upload
- Job title
- Department (optional)
- Phone number (optional)
- Time zone detection

**Completion:**
- Save button persists profile data
- User can skip and update later
- Redirects to dashboard or team selection

### Team Management Integration

**Scenario 1: New Account**
- User invited to existing team via email invite
- Sign up with email matches team invite
- Post-verification: Automatically added to team
- No additional approval needed

**Scenario 2: Team Creation**
- User can create first team immediately after verification
- Prompts for:
  - Team name
  - Team size estimate
  - Industry/use case
  - Primary assets managed

**Scenario 3: Multiple Teams**
- User can be member of multiple teams
- Team switcher in account menu
- Separate sessions per team (optional)
- Different roles per team supported

---

## Security Considerations

### Password Requirements

**For Email Registration:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Password Storage:**
- Bcrypt hashing (not reversible)
- Salt with 12+ rounds
- Never stored in plain text

### Rate Limiting

**Sign-In Attempts:**
- Max 5 failed attempts per 15 minutes
- IP-based blocking after threshold
- Email notification of suspicious activity

**Verification Code Requests:**
- Max 3 new codes per email per hour
- Prevents email spam
- User must wait 60 seconds between requests

**Password Reset Requests:**
- Max 3 per email per day
- Prevents account takeover attempts
- Older reset links invalidated when new requested

### Two-Factor Authentication (Future)

**Not Currently Implemented:**
- Roadmap feature for enhanced security
- Will support TOTP apps (Google Authenticator, Authy)
- Optional or mandatory by organization policy

---

## User Experience Principles

### Progressive Disclosure

- Initial screen shows OAuth options prominently
- Email option available but not primary
- Reduces cognitive load for first-time users

### Error Recovery

- Clear, actionable error messages
- "Change" links allow course correction
- Multiple paths to reach same outcome (magic link or code)

### Accessibility

- Tab navigation through all fields
- Screen reader compatible labels
- High contrast text and buttons
- Keyboard-only flow supported

### Performance

- OAuth redirects handled efficiently
- Code entry accepts pasted values
- No unnecessary page reloads during verification
- Email delivery typically < 1 minute

---

## Summary Flow Diagram

```
User Arrives at Sign In/Sign Up
├── OAuth Path (Google/Microsoft)
│   ├── Select Account
│   ├── Receive Verification Email
│   └── Enter Code → Dashboard
│
└── Email Registration Path
    ├── Enter Name + Work Email
    ├── Receive Verification Email
    ├── Enter Code or Click Magic Link
    ├── Account Setup (Profile)
    └── Dashboard

Sign In (Returning User)
├── Continue with Google → Select Account → Dashboard
├── Continue with Microsoft → Select Account → Dashboard
└── Continue with Email → Verification Code → Dashboard
```

---

## Related Documentation

- Account Management & Profile Settings
- Team Management & Invitations
- Permission & Role Management
- Security & Compliance
- SSO Integration (Enterprise)
