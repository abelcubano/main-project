import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientNumber: serial("client_number").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  email: text("email"),
  fax: text("fax"),
  website: text("website"),
  contactName: text("contact_name"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  accountType: text("account_type").notNull().default("standard"),
  billingMethod: text("billing_method").notNull().default("invoice"),
  paymentTerms: text("payment_terms").notNull().default("Net 30"),
  discount: text("discount").notNull().default("0"),
  gracePeriod: integer("grace_period").notNull().default(0),
  lateFeeSchedule: text("late_fee_schedule"),
  deliveryMethod: text("delivery_method").notNull().default("email"),
  defaultTicketPriority: text("default_ticket_priority").notNull().default("normal"),
  tags: text("tags"),
  contractStatus: text("contract_status"),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  contractTermMonths: integer("contract_term_months"),
  assignedSalesperson: varchar("assigned_salesperson").references(() => users.id),
  assignedAccountManager: varchar("assigned_account_manager").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"),
  companyName: text("company_name"),
  customerId: varchar("customer_id").references(() => customers.id),
  customerRole: text("customer_role"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  permPortalAccess: boolean("perm_portal_access").notNull().default(true),
  permBillingView: boolean("perm_billing_view").notNull().default(false),
  permBillingReceiveInvoices: boolean("perm_billing_receive_invoices").notNull().default(false),
  permBillingMakePayments: boolean("perm_billing_make_payments").notNull().default(false),
  permServicesView: boolean("perm_services_view").notNull().default(false),
  permServicesManage: boolean("perm_services_manage").notNull().default(false),
  permTechnicalView: boolean("perm_technical_view").notNull().default(false),
  permTechnicalManage: boolean("perm_technical_manage").notNull().default(false),
  permSupportView: boolean("perm_support_view").notNull().default(false),
  permSupportCreate: boolean("perm_support_create").notNull().default(false),
  permSupportSmarthands: boolean("perm_support_smarthands").notNull().default(false),
  permNotifyMaintenance: boolean("perm_notify_maintenance").notNull().default(false),
  permNotifyBilling: boolean("perm_notify_billing").notNull().default(false),
  permNotifyIncidents: boolean("perm_notify_incidents").notNull().default(false),
  permAdminUsers: boolean("perm_admin_users").notNull().default(false),
  adminRole: text("admin_role"),
  adminPermDashboard: boolean("admin_perm_dashboard").notNull().default(true),
  adminPermClients: boolean("admin_perm_clients").notNull().default(true),
  adminPermSupport: boolean("admin_perm_support").notNull().default(true),
  adminPermDevices: boolean("admin_perm_devices").notNull().default(true),
  adminPermOrders: boolean("admin_perm_orders").notNull().default(true),
  adminPermSales: boolean("admin_perm_sales").notNull().default(true),
  adminPermSettings: boolean("admin_perm_settings").notNull().default(true),
  adminPermUsers: boolean("admin_perm_users").notNull().default(true),
  adminPermReports: boolean("admin_perm_reports").notNull().default(false),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  clientNumber: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  companyName: true,
  customerId: true,
  customerRole: true,
  active: true,
  permPortalAccess: true,
  permBillingView: true,
  permBillingReceiveInvoices: true,
  permBillingMakePayments: true,
  permServicesView: true,
  permServicesManage: true,
  permTechnicalView: true,
  permTechnicalManage: true,
  permSupportView: true,
  permSupportCreate: true,
  permSupportSmarthands: true,
  permNotifyMaintenance: true,
  permNotifyBilling: true,
  permNotifyIncidents: true,
  permAdminUsers: true,
  adminRole: true,
  adminPermDashboard: true,
  adminPermClients: true,
  adminPermSupport: true,
  adminPermDevices: true,
  adminPermOrders: true,
  adminPermSales: true,
  adminPermSettings: true,
  adminPermUsers: true,
  adminPermReports: true,
});

export const PERMISSION_FIELDS = [
  "permPortalAccess",
  "permBillingView",
  "permBillingReceiveInvoices",
  "permBillingMakePayments",
  "permServicesView",
  "permServicesManage",
  "permTechnicalView",
  "permTechnicalManage",
  "permSupportView",
  "permSupportCreate",
  "permSupportSmarthands",
  "permNotifyMaintenance",
  "permNotifyBilling",
  "permNotifyIncidents",
  "permAdminUsers",
] as const;

export type PermissionField = (typeof PERMISSION_FIELDS)[number];

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export const billingSettings = pgTable("billing_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  paymentTerms: text("payment_terms").notNull().default("Net 30"),
  billingEmailSubject: text("billing_email_subject").notNull().default("Invoice {{invoiceNumber}} - 911-DC"),
  billingEmailTemplate: text("billing_email_template").notNull().default("Dear {{customerName}},\n\nPlease find attached your invoice {{invoiceNumber}} for the amount of ${{totalAmount}}.\n\nIssue Date: {{issueDate}}\nDue Date: {{dueDate}}\nItems: {{itemCount}}\n\nFor questions, contact billing@911dc.us.\n\nThank you for your business.\n911-DC"),
  invitationEmailSubject: text("invitation_email_subject").notNull().default("Welcome to 911-DC Customer Portal"),
  invitationEmailTemplate: text("invitation_email_template").notNull().default("Dear {{userName}},\n\nYour account has been created on the 911-DC Customer Portal.\n\nUsername: {{userEmail}}\nCompany: {{companyName}}\n\nPlease log in at {{portalUrl}} to access your services, billing, and support.\n\nWelcome aboard!\n911-DC"),
  smtpHost: text("smtp_host").notNull().default("smtp.titan.email"),
  smtpPort: integer("smtp_port").notNull().default(465),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPassword: text("smtp_password").notNull().default(""),
  smtpSecure: boolean("smtp_secure").notNull().default(true),
  imapHost: text("imap_host").notNull().default(""),
  imapPort: integer("imap_port").notNull().default(993),
  imapUser: text("imap_user").notNull().default(""),
  imapPassword: text("imap_password").notNull().default(""),
  imapSecure: boolean("imap_secure").notNull().default(true),
  supportEmailAddress: text("support_email_address").notNull().default("info@911dc.us"),
  ticketEmailSubject: text("ticket_email_subject").notNull().default("[Ticket #{{ticketNumber}}] {{subject}}"),
  ticketEmailTemplate: text("ticket_email_template").notNull().default("Hello {{customerName}},\n\n{{replyAuthor}} has replied to your ticket #{{ticketNumber}}:\n\nSubject: {{subject}}\n\n{{replyBody}}\n\nYou can view and respond to this ticket in your customer portal.\n\nThank you,\n911-DC Support"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  location: text("location").notNull(),
  details: text("details"),
  serviceOrder: text("service_order"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  grafanaUrl: text("grafana_url"),
  grafanaDashboardUid: text("grafana_dashboard_uid"),
  grafanaPanelId: text("grafana_panel_id"),
  grafanaOrgId: text("grafana_org_id"),
  grafanaVar: text("grafana_var"),
  snmpHost: text("snmp_host"),
  snmpPort: integer("snmp_port"),
  snmpCommunity: text("snmp_community"),
  snmpVersion: text("snmp_version"),
  snmpOidStatus: text("snmp_oid_status"),
  snmpOidControl: text("snmp_oid_control"),
  pduPortNumber: integer("pdu_port_number"),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default("pending"),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  serviceId: varchar("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertBillingSettingsSchema = createInsertSchema(billingSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type BillingSettings = typeof billingSettings.$inferSelect;
export type InsertBillingSettings = z.infer<typeof insertBillingSettingsSchema>;

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: serial("ticket_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("new"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const ticketReplies = pgTable("ticket_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export const insertTicketReplySchema = createInsertSchema(ticketReplies).omit({
  id: true,
  createdAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type TicketReply = typeof ticketReplies.$inferSelect;

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceNumber: serial("device_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  deviceType: text("device_type").notNull().default("server"),
  status: text("status").notNull().default("active"),
  monitorStatus: text("monitor_status").notNull().default("unknown"),
  customerId: varchar("customer_id").references(() => customers.id),
  serviceId: varchar("service_id").references(() => services.id),
  parentDeviceId: varchar("parent_device_id"),
  facility: text("facility"),
  zone: text("zone"),
  cage: text("cage"),
  row: text("row"),
  rack: text("rack"),
  rackPosition: text("rack_position"),
  rackUnits: integer("rack_units"),
  snmpHost: text("snmp_host"),
  snmpPort: integer("snmp_port"),
  snmpCommunity: text("snmp_community"),
  snmpVersion: text("snmp_version"),
  snmpOidStatus: text("snmp_oid_status"),
  snmpOidControl: text("snmp_oid_control"),
  grafanaUrl: text("grafana_url"),
  grafanaDashboardUid: text("grafana_dashboard_uid"),
  grafanaPanelId: text("grafana_panel_id"),
  grafanaOrgId: text("grafana_org_id"),
  grafanaVar: text("grafana_var"),
  tags: text("tags"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deviceIps = pgTable("device_ips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  ipAddress: text("ip_address").notNull(),
  description: text("description"),
  type: text("type").notNull().default("public"),
  vlan: text("vlan"),
  ptrRecord: text("ptr_record"),
});

export const deviceInterfaces = pgTable("device_interfaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("up"),
  connectedDeviceId: varchar("connected_device_id").references(() => devices.id),
  connectedPort: text("connected_port"),
  vlan: text("vlan"),
  speed: text("speed"),
});

export const customerContacts = pgTable("customer_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  isPrimary: boolean("is_primary").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const customerNotes = pgTable("customer_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  deviceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceIpSchema = createInsertSchema(deviceIps).omit({
  id: true,
});

export const insertDeviceInterfaceSchema = createInsertSchema(deviceInterfaces).omit({
  id: true,
});

export const insertCustomerContactSchema = createInsertSchema(customerContacts).omit({
  id: true,
});

export const insertCustomerNoteSchema = createInsertSchema(customerNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDeviceIp = z.infer<typeof insertDeviceIpSchema>;
export type DeviceIp = typeof deviceIps.$inferSelect;
export type InsertDeviceInterface = z.infer<typeof insertDeviceInterfaceSchema>;
export type DeviceInterface = typeof deviceInterfaces.$inferSelect;
export type InsertCustomerContact = z.infer<typeof insertCustomerContactSchema>;
export type CustomerContact = typeof customerContacts.$inferSelect;
export type InsertCustomerNote = z.infer<typeof insertCustomerNoteSchema>;
export type CustomerNote = typeof customerNotes.$inferSelect;

export const contactAccessBadges = pgTable("contact_access_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => customerContacts.id),
  deviceId: varchar("device_id").references(() => devices.id),
  facility: text("facility"),
  accessLevel: text("access_level").notNull().default("escorted"),
  notes: text("notes"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
});

export const insertContactAccessBadgeSchema = createInsertSchema(contactAccessBadges).omit({
  id: true,
  issuedAt: true,
});

export type InsertContactAccessBadge = z.infer<typeof insertContactAccessBadgeSchema>;
export type ContactAccessBadge = typeof contactAccessBadges.$inferSelect;
