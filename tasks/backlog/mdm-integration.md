# Task: MDM Integration

## Description

Integrate with Mobile Device Management solutions to show software compliance and security checks.

## Acceptance Criteria

- [ ] MDM provider integration (Addigy, Jamf, etc.)
- [ ] Software list per device
- [ ] Security compliance checks (screen lock, password)
- [ ] Compliance dashboard
- [ ] Alert on non-compliant devices

## Test Criteria

- [ ] Can fetch device info from MDM
- [ ] Software list displays correctly
- [ ] Compliance status accurate
- [ ] Alerts trigger on violations

## Dependencies

- devices/device-list
- api/device-crud

## Features from EQUIPPED.md

> "See a list of software installed on devices (via MDM)"
> "See checks on software installed on devices (screen lock, password etc, via MDM)"

## MDM Providers to Consider

- Addigy (partnership exists per EQUIPPED.md)
- Jamf
- Kandji
- Mosyle

## API Integration Points

| Feature | MDM Data |
|---------|----------|
| Software List | Installed apps |
| Security Status | Encryption, password policy |
| OS Version | Current/required version |
| Last Check-in | Device online status |

## Priority

Backlog - requires MDM partnership/credentials

## References

- EQUIPPED.md Partnerships (Addigy)
- EQUIPPED.md UX Flows
