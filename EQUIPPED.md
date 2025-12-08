# Equipped is an Apple Authorized Reseller designed for business users

## Our Offer

### Long-Term Business-to-Business Relationship
Unlike one-time retailers, Equipped provides a platform to monitor all devices, assignments to employees, orders, and shared logins across your organization post-purchase.  Asset and fleet management tracks locations, valuation, and depreciation for ongoing visibility.

### Easy Purchasing
Standard purchases use credit card, Stripe Link, or Affirm/Klarna for quick checkout of Macs, iPads, AppleCare, and accessories.  Leasing is available (we assist approval via lenders like Macquarie).  Prompt worldwide delivery and reliable collection ensure seamless logistics.

Log in with your business email to track orders and devices across your company, with easy standard purchasing plus responsive human support over Slack, iMessage, WhatsApp, phone, or email.

### Human-Centered Support
Real humans (not AI) respond quickly via your preferred channel: Slack, iMessage, WhatsApp, email, or phone for all needs.  Device lifecycle services include repair, wipe, recycle, resell, and upgrades on demand.

## Market

Business users who need to purchase and manage Apple devices for their organization.

They are frustrated by:

- retailers that don't offer integrated asset lifecycle management
- retailers that are "order" focused
- retailers that don't support SSO or multiple business users accessing their orders and devices
- up-front/unpredictable purchases (which hit cash flow)
- losing track of devices, who they are assigned to
- not being able to retrieve dev ices from terminated/departing employees
- the hassle of getting devices to new employees on time (especially remote, international employees)
- supporting employees when upgrading from one dev ice to another (having two devices for a while, having a firewire cable, having support by folks with experience in mac-to-mac migration)

## Capabilities

### User/Customer Capabilities

- [x] Autorized Apple Retailer: buy Macs, iPads, AppleCare, and accessories from us
- [x] Premier Apple Partner: repair and support for your Apple devices.
- [x] Post-purchase support: track your devices orders and share login acorss your organization - we're not "just" a retailer, we're there for you long term.
- [x] Easy to reach: You can call, email, or chat with us. We can talk to you over Slack, iMessage, and WhatsApp.
- [x] Logistics: We deliver laptops promptly. It will be easy and reliable.
- [x] Collection: We will pick up laptops. It will be a good experience for your users.
- [x] Device lifecycle: we recycle, repair, wipe, resell, and upgrade your devices on demand.
- [x] Leasing: we can help you lease devices so you have a predicatable "monthly/per user" cash flow (may require lender approval).

In progress/PoC:

- [ ] Fleet management: we can help you manage your fleet of devices. Including showing asset valuation and depreciation.
- [ ] Asset management: track all your devices and where they are (assign them to employees)

### Backend services (products, payments, logistics)

- Shopify store API (prod, dev, staging)
- Alchemy APIs (dev, prod(): trade-in valuation, serial/model lookup, FindMy status for trade-in/resell devices
- Stripe accounts (sandbox, prod)
- Affirm contracts & accounts (sandbox, prod): custom program for upgrade programs
- Spark Shipping API (staging, prod): Drop-shipping, pricing, inventory and logistics/shipment tracking
- TD Synnex/Ingram Micro API: distributors (pricing, inventory)

Also:

- Google Workspace Suite (access to API): Enterprise capabilities
- Brex bank accounts (access to API)
- GitHub org(s) & CI
- Slack, Posthog, Sentry, Mailgun, etc... (pretty much any SaaS you can think of, we probably have accounts)

### Partnerships

- Apple
- Google Workspace, Addigy, Vanta, 1Password reseller

### Infra

- Heroku (enterprise)
- AWS

### Marketing

- Google, Facebook, LinkedIn campaigns

### Skills

- customer support
- partnerships (Apple, lenders, VC ecosystem)
- design (Apple-like UI, Figma, static site & marketing asset creation)
- dev
- CFO
- Accounting/bookkeeping

### Other
- Two "Clerky-incorporated" entities (VC-ready): Upgraded Technologies Inc. (Y-combinator graduate) and Equipped Technologies Inc.

## Brand

### Ethos
We will be responsive, friendly, personal, and helpful.  
We will deliver laptops promptly. It will be easy and reliable.  
We will pick up laptops. It will be a good experience for your users.  
We will handle onboarding and offboarding.  
We will help your staff directly (you won’t need to be the in-between).  
We will be transparent: Most communication will be in Slack so you can see what is going on.

## UX & Flows

- Figma: https://www.figma.com/design/XEiUSo8vmtPFAeJU2DpFmF/Platform?node-id=466-8685&t=OfB6fIVGpIBQ6u9d-1
- Figme Prototype: https://www.figma.com/proto/XEiUSo8vmtPFAeJU2DpFmF/Platform?page-id=466%3A8685&type=design&node-id=524-25328&viewport=2476%2C451%2C0.07&t=wKUnRSxep9Q8fwoP-1&scaling=min-zoom&starting-point-node-id=524%3A25328&show-proto-sidebar=1

### Customer's frontend

- Log into the system (email, Google, SSO)
- See a list of devices  
- Add device by serial number and purchase date  
- Request to buy a new device  
- See a list of software installed on devices (via MDM)  
- See checks on software installed on devices (screen lock, password etc, via MDM)  
- See a list of services (Slack, Google Suite) connected to devices  
- See checks on services (Slack and Google 2FA), via ?  
- See a list of employees and their connections to devices and services  
- Create employee groups (Engineers, Sales etc)  
- Manage hardware, software and services accessible or required by employee groups

### SuperAdmin's frontend:

- See and edit a list of customers  
- See and edit a list of customer's managers who has access to the system  
- See and edit a list of customer's employees  
- See and edit a list of customer's hardware (with connections)  
- See and edit a list of software (with connections)  
- See and edit a list of services (with connections)  
