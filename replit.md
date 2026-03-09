# 911-DC - Datacenter Operations Platform

## Overview

911-DC is a datacenter-focused company providing SmartHands services, colocation, connectivity, DDoS protection, SIP/PBX, and custom development in South Florida. The platform features a public-facing landing page, a customer portal for service management and billing, and an admin console for internal operations with role-based access control. Key services include SmartHands across multiple datacenter locations, with specialized services like Colocation and DIA Internet available at the main hub.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
The platform follows a modular, component-based architecture designed for scalability and maintainability. A shared directory facilitates type-safe API contracts between frontend and backend. Role-based access control is central to the admin console, ensuring secure internal operations.

### Frontend
- **Framework**: React with TypeScript
- **UI/UX**: Professional B2B design with a blue/slate color scheme. Utilizes `shadcn/ui` with Radix UI primitives for components, styled with Tailwind CSS. Framer Motion handles animations.
- **State Management**: TanStack React Query.
- **Build**: Vite.

### Backend
- **Framework**: Express.js 5 with TypeScript.
- **API**: RESTful API design.
- **Session Management**: Express session with PostgreSQL store support.

### Data Management
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with Drizzle Kit for migrations.
- **Schema & Validation**: Zod schemas generated from Drizzle schemas (`drizzle-zod`) define data structures for `customers`, `customer_contacts`, `users`, `services`, `devices`, `invoices`, and `tickets`, among others.
- **Key Features**:
    - **Customer & User Management**: Detailed customer accounts, contacts, and role-based user permissions (Ubersmith-style).
    - **Service & Device Management**: Comprehensive tracking of datacenter services and devices, including facility location, SNMP/PDU configuration, and Grafana monitoring links.
    - **Billing System**: Automated invoice generation (draft/approval workflow), configurable billing settings, and PDF invoice generation.
    - **Ticketing System**: Support ticket creation, management, and reply threads with internal notes functionality.
    - **SNMP/PDU Management**: Remote monitoring and control of PDU outlets via SNMP.
    - **Admin Portal**: Ubersmith-inspired design with a dark navy top navigation, collapsible sidebar, comprehensive dashboards, and detailed client 360-degree views.

## External Dependencies

- **Database**: PostgreSQL
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React (icons)
- **Email**: Nodemailer for SMTP (Titan Email configured), supports templated notifications.
- **PDF Generation**: PDFKit for professional invoice PDFs.
- **SNMP**: `net-snmp` (Node.js SNMP client) for device interaction.
- **Monitoring**: Grafana (embedded panels via iframe).
- **Payment Gateway**: Stripe (dependency included for future integration).