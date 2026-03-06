import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  email: text("email"),
  contactName: text("contact_name"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
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

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  location: text("location").notNull(),
  details: text("details"),
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

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
