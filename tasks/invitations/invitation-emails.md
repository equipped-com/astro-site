# Task: Invitation Email Templates

## Description

Create email templates for invitation lifecycle events: invitation sent, invitation accepted (notify inviter), and invitation declined (notify inviter). Emails should be branded, mobile-responsive, and include clear CTAs.

## Acceptance Criteria

- [ ] Invitation email template with accept/decline links
- [ ] Accepted notification email template (to inviter)
- [ ] Declined notification email template (to inviter)
- [ ] Mobile-responsive HTML email
- [ ] Branded with Equipped logo and colors
- [ ] Clear CTA buttons
- [ ] Expiry date displayed
- [ ] Unsubscribe footer (if required)

## Test Criteria

```gherkin
Feature: Invitation Email Templates
  As an invitee or inviter
  I want clear, actionable emails
  So that I understand what action to take

  @REQ-EMAIL-001 @Template
  Scenario: Invitation email content
    Given an invitation was sent to "alice@example.com"
    When the invitation email is rendered
    Then it should include:
      | Element           | Present |
      | Company name      | Yes     |
      | Inviter name      | Yes     |
      | Role being granted| Yes     |
      | Accept button     | Yes     |
      | Decline button    | Yes     |
      | Expiry date       | Yes     |
      | Equipped logo     | Yes     |

  @REQ-EMAIL-002 @Links
  Scenario: Accept/decline links
    Given an invitation email
    When I click "Accept Invitation"
    Then I should be taken to acceptance page with invitation token
    When I click "Decline"
    Then I should be taken to decline confirmation page

  @REQ-EMAIL-003 @Branding
  Scenario: Email branding
    Given any invitation email
    Then it should use Equipped brand colors
    And it should include the Equipped logo
    And it should follow email design system

  @REQ-EMAIL-004 @Notification
  Scenario: Accepted notification to inviter
    Given "alice@example.com" accepted the invitation
    When the acceptance email is sent to the inviter
    Then it should say "alice@example.com has joined your team"
    And it should include the role granted
    And it should link to team settings

  @REQ-EMAIL-005 @Notification
  Scenario: Declined notification to inviter
    Given "bob@example.com" declined the invitation
    When the decline email is sent to the inviter
    Then it should say "bob@example.com declined your invitation"
    And it should suggest alternative actions

  @REQ-EMAIL-006 @Responsive
  Scenario: Mobile responsiveness
    Given any invitation email
    When viewed on mobile device
    Then text should be readable
    And buttons should be tappable
    And layout should adapt to screen size
```

## Dependencies

- invitations/invitation-api (triggers email sends)

## Email Templates

### Invitation Email
**Subject:** You've been invited to join [Company Name] on Equipped

**Content:**
- Personal greeting
- Inviter name and company
- Role being granted
- Accept/Decline CTAs
- Expiry notice (14 days)
- What to expect after accepting

### Acceptance Notification
**Subject:** [Name] accepted your invitation to [Company Name]

**Content:**
- Confirmation of acceptance
- Role granted
- Link to team settings

### Decline Notification
**Subject:** [Name] declined your invitation to [Company Name]

**Content:**
- Notification of decline
- Suggestion to reach out directly if needed

## Files to Create

- `src/emails/invitation.html` - Invitation email template
- `src/emails/invitation-accepted.html` - Acceptance notification
- `src/emails/invitation-declined.html` - Decline notification
- `src/lib/email/send-invitation.ts` - Email sending logic

## Email Service Integration

Use Clerk's email service or integrate with:
- Resend
- SendGrid
- AWS SES

## References

- PRD.md Section 3: Identity & Onboarding (REQ-ID-004, REQ-ID-005)
- PRD.md Section 11: Marketing & Brand Assets (REQ-MKT-004)
