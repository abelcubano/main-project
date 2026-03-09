# 911-DC - Datacenter Operations Platform

## Overview

911-DC is a datacenter-focused company primarily oriented to SmartHands services, also offering colocation, connectivity, DDoS protection, SIP/PBX, and custom development services across South Florida.

The application includes:
- **Public-facing landing page** - Professional B2B design with blue/slate color scheme, showcasing services and 8 datacenter locations with service availability matrix
- **Customer portal** - Service management, billing, and support tickets
- **Admin console** - Internal operations with role-based access control, full CRUD for services and invoices

### Services Offered
- SmartHands Datacenter Services (available at all locations)
- Colocation (main hub only)
- DIA Internet (main hub only)
- DDoS Protection (main hub only)
- SIP Trunk and PBX
- Software Programming and Custom Development

### Datacenter Locations
- **Main Hub**: iM Critical Miami (100 NE 2nd St, Miami, FL 33138) - Full services
- Equinix Miami, Digital Realty Miami, 365 Data Centers FLL, EdgeConneX, QTS MIA1, CoreSite MI1 - SmartHands only
- South Reach Networks - SmartHands + Dark Fiber Access

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **Animations**: Framer Motion for page transitions and interactions
- **Build Tool**: Vite

The frontend follows a component-based architecture with pages in `client/src/pages/` and reusable UI components in `client/src/components/ui/`. Path aliases are configured for clean imports (`@/` for client source, `@shared/` for shared code).

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Runtime**: Node.js with tsx for development
- **API Pattern**: REST API with `/api` prefix
- **Session Management**: Express session with PostgreSQL store support (connect-pg-simple)

The server uses a modular structure with routes in `server/routes.ts` and a storage abstraction layer in `server/storage.ts`. The storage interface currently uses in-memory storage but is designed for easy PostgreSQL migration.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Located in `shared/schema.ts` using Drizzle's schema builder
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

The database schema is shared between frontend and backend through the `shared/` directory, enabling type-safe API contracts.

### Database Schema
- **customers** - Company/organization accounts (name, address, contact info, notes)
- **users** - User accounts with bcrypt-hashed passwords, linked to customers via customerId, with customerRole (account_admin/manager/technician) and system role (admin/customer). Includes 15 boolean permission fields (Ubersmith-style): permPortalAccess, permBillingView, permBillingReceiveInvoices, permBillingMakePayments, permServicesView, permServicesManage, permTechnicalView, permTechnicalManage, permSupportView, permSupportCreate, permSupportSmarthands, permNotifyMaintenance, permNotifyBilling, permNotifyIncidents, permAdminUsers
- **services** - Customer services linked to users, with optional Grafana monitoring config (grafanaUrl, grafanaDashboardUid, grafanaPanelId, grafanaOrgId, grafanaVar) and SNMP/PDU config (snmpHost, snmpPort, snmpCommunity, snmpVersion, snmpOidStatus, snmpOidControl, pduPortNumber)
- **invoices** - Customer invoices with line items, totals, and status tracking
- **invoice_items** - Individual line items for each invoice
- **dispatch_requests** - SmartHands dispatch requests for datacenter operations
- **tickets** - Support tickets (id UUID, customerId, userId, subject, body, category, priority, status, assignedTo, createdAt, updatedAt, closedAt)
- **ticket_replies** - Ticket reply thread (id UUID, ticketId, userId, body, isInternal boolean for admin-only notes, createdAt)

### Build System
- **Client Build**: Vite bundles React app to `dist/public/`
- **Server Build**: esbuild bundles server with selective dependency bundling to optimize cold start times
- **Development**: Vite dev server with HMR proxied through Express

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database toolkit for type-safe queries and migrations

### UI Framework
- **Radix UI**: Headless component primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: Dev banner, cartographer, and runtime error overlay for Replit environment
- **Vite Plugin Meta Images**: Auto-updates OpenGraph meta tags with deployment URL

### Email Notifications
- **Library**: Nodemailer with SMTP transport
- **SMTP Provider**: Titan Email (smtp.titan.email:465 with SSL)
- **Configuration**: Environment variables for host, port, from/to addresses
- **Secrets**: MAIL_PASSWORD stored securely in Replit Secrets
- **Features**: 
  - Dispatch request notifications sent to info@911dc.us
  - Invoice notification emails to customer contacts
  - HTML and plain text email formats
  - HTML injection prevention via entity escaping
  - Error logging for failed sends

### PDF Generation
- **Library**: PDFKit
- **Template**: Professional invoice PDF with 911-DC branding, company details, customer info, line items table, totals, and payment terms
- **Endpoint**: GET /api/invoices/:id/pdf (accessible by admins and invoice owner)

### Billing Settings & Configuration
- **Table**: billing_settings — configurable invoice prefix, sequential numbering, payment terms, email templates
- **Admin UI**: Settings view with "Billing" and "Email Templates" tabs
- **Invoice Number Format**: Configurable prefix (default "INV") + YYYYMM + sequential number (e.g., INV-202603-0001)
- **Email Templates**: Billing and invitation templates with placeholder variables ({{customerName}}, {{invoiceNumber}}, {{totalAmount}}, {{dueDate}}, {{issueDate}}, {{itemCount}}, {{userName}}, {{userEmail}}, {{companyName}}, {{portalUrl}})
- **Endpoints**: GET/PUT /api/admin/billing-settings

### Invoice Draft/Approval Workflow
- **Draft Status**: New invoices (manual and automated) start as "draft" — not visible to customers
- **Approval**: Admin clicks "Approve" to change draft → pending (visible to customers)
- **Customer Portal**: Filters out draft invoices server-side
- **Endpoint**: POST /api/admin/invoices/:id/approve

### Service Order References
- **Field**: serviceOrder on services table — optional service order number (e.g., SO-2024-001)
- **Invoice Line Items**: Service order reference automatically included in invoice line item descriptions when present

### Automated Billing
- **Service**: server/billing.ts - scans active services grouped by customer company
- **Trigger**: POST /api/admin/billing/run (admin only, manual trigger from Invoices view)
- **Features**:
  - Generates monthly invoices as "draft" status with configurable invoice number prefix and sequential numbering
  - Prevents duplicate invoices for the same billing period via invoice number pattern matching
  - Sends email notifications using configurable billing email template
  - Groups services by customer company for consolidated invoicing
  - Includes service order references in line item descriptions

### Invitation Emails
- **Endpoint**: POST /api/admin/users/:id/send-invitation (admin only)
- **Template**: Configurable via billing settings, supports placeholder variables
- **UI**: "Send Portal Invitation" button in admin user detail panel for customer users

### SNMP/PDU Management
- **Library**: net-snmp (Node.js SNMP client)
- **Service**: server/snmp.ts — SNMP GET (port status) and SET (reboot) operations
- **Endpoints**: 
  - GET /api/services/:id/pdu/status — read PDU outlet state via SNMP
  - POST /api/services/:id/pdu/reboot — power cycle outlet via SNMP SET
- **Security**: SNMP community strings stored in DB, never returned to customer API responses (sanitized server-side)
- **Config per service**: host, port (default 161), community, version (v1/v2c), status OID, control OID, port number

### Grafana Monitoring
- **Integration**: Embedded Grafana panels via iframe in customer portal
- **Config per service**: Grafana URL, Dashboard UID, Panel ID, Org ID, Host Variable
- **Customer portal**: Time range selector (6h, 24h, 7d, 30d), auto-constructs iframe src from config

### Admin Portal UI Style
- **Design**: Modern Ubersmith-inspired SaaS platform with clean, professional aesthetic
- **Component Library**: 4 reusable admin components in `client/src/components/admin/`:
  - `AdminLayout.tsx` — App shell: 48px dark navy top nav (#0f172a), 220px collapsible sidebar (#1e293b), breadcrumb bar, responsive mobile menu
  - `AdminCard.tsx` — Card component with accent-colored top border, KpiRow for metric display
  - `AdminTable.tsx` — Data table with search, sortable columns, alternating rows, pagination footer, domain-specific row test IDs
  - `StatusBadge.tsx` — Colored pill badges for statuses, priorities, and roles
- **Navigation**: Top nav section buttons (Clients, Support, Devices, Orders, Sales, Settings) with active highlight. Contextual sidebar per section with collapsible groups and badge counts.
  - **Clients**: Customers list, Users list
  - **Support**: Ticket queue with department filters, status filters, assignment filters — ticket detail with reply thread and internal notes
  - **Devices**: Placeholder for future device management
  - **Orders**: Services list
  - **Sales**: Invoices list
  - **Settings**: Billing config, email templates
- **Dashboard**: 6 manager cards (Client, Support, Device, Billing, Orders, Infrastructure) with real KPI data and navigation CTAs. Recent open tickets table.
- **Layout**: Top nav (48px), breadcrumb bar (32px), sidebar (220px collapsible to 48px), content area (slate-100 bg)
- **Colors**: Top nav #0f172a, sidebar #1e293b, content bg slate-100, cards white with subtle shadows, active nav blue-600, text slate-900/700/500, accent blue-600
- **Typography**: 13-14px body text, 11px table headers (uppercase tracking), clean spacing with Tailwind utility classes
- **Responsive**: Mobile hamburger menu for section switching, sidebar collapse button in top nav on small screens, cards stack on mobile

### Ticketing System
- **Tables**: tickets + ticket_replies (UUID primary keys)
- **Ticket Fields**: customerId, userId (creator), subject, body, category (support/sales/billing/provisioning/smart_hands/abuse/general), priority (low/normal/high/urgent), status (new/open/in_progress/waiting/resolved/closed), assignedTo (nullable, admin user), timestamps
- **Internal Notes**: ticket_replies.isInternal — admin-only notes hidden from customer API responses (filtered server-side)
- **Admin Features**: Full CRUD, status/priority/assignee management via property panel, Ubersmith-style department queue sidebar (Support, Sales, Billing, Provisioning, SmartHands, Abuse, General) with status and assignment sub-filters, new ticket creation on behalf of customers
- **Customer Portal**: Create tickets, view own tickets, reply to tickets (isInternal hidden), permission-gated via permSupportView/permSupportCreate
- **Endpoints**: GET/POST /api/tickets, GET/PUT /api/tickets/:id, POST /api/tickets/:id/replies

### Planned Integrations (Future)
- Payment gateway integration (Stripe dependency already included)
- Automated scheduled billing (cron-based)