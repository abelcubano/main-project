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
- **users** - User accounts with bcrypt-hashed passwords, linked to customers via customerId, with customerRole (account_admin/manager/technician) and system role (admin/customer)
- **services** - Customer services linked to users, with optional Grafana monitoring config (grafanaUrl, grafanaDashboardUid, grafanaPanelId, grafanaOrgId, grafanaVar) and SNMP/PDU config (snmpHost, snmpPort, snmpCommunity, snmpVersion, snmpOidStatus, snmpOidControl, pduPortNumber)
- **invoices** - Customer invoices with line items, totals, and status tracking
- **invoice_items** - Individual line items for each invoice
- **dispatch_requests** - SmartHands dispatch requests for datacenter operations

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

### Automated Billing
- **Service**: server/billing.ts - scans active services grouped by customer company
- **Trigger**: POST /api/admin/billing/run (admin only, manual trigger from Invoices view)
- **Features**:
  - Generates monthly invoices with each active service as a line item
  - Prevents duplicate invoices for the same billing period via invoice number pattern matching (INV-YYYYMM-XXXX)
  - Sends email notifications to customer contacts when invoices are generated
  - Groups services by customer company for consolidated invoicing

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
- **Design**: Native desktop application aesthetic (pgAdmin/SSMS/VS Code light theme)
- **Layout**: Menu bar (22px), tab bar (26px), breadcrumb (18px), tree sidebar (140px), draggable split panels, status bar (18px)
- **Colors**: bg #f3f3f3, panels #ffffff, table headers #e8e8e8, borders #d0d0d0, text #1e1e1e, accent #0078d4, selected #cce4f7
- **Density**: 10-12px fonts, 18-22px table rows, 1px borders, no rounded corners/shadows, alternating row colors

### Planned Integrations (Future)
- Payment gateway integration (Stripe dependency already included)
- Automated scheduled billing (cron-based)