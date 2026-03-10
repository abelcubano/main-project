import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import https from "https";

const tlsTolerantAgent = new https.Agent({ rejectUnauthorized: false });

async function fetchTolerant(url: string, options: RequestInit & { headers?: Record<string, string> } = {}): Promise<Response> {
  if (url.startsWith("https://")) {
    const urlObj = new URL(url);
    return new Promise((resolve, reject) => {
      const reqOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: options.headers || {},
        agent: tlsTolerantAgent,
      };
      const req = https.request(reqOptions, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          resolve({
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            status: res.statusCode!,
            json: async () => JSON.parse(body),
            text: async () => body,
          } as unknown as Response);
        });
      });
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }
  return fetch(url, options);
}
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { storage } from "./storage";
import { sendDispatchEmail, sendInvoiceEmail, sendInvitationEmail, sendTicketNotificationEmail, testSmtpConnection, verifyEmailConnection, type DispatchRequest } from "./email";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "b", "i", "u", "s", "strong", "em", "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote", "pre", "code", "span", "div", "font"],
    ALLOWED_ATTR: ["href", "target", "rel", "style", "class", "color", "size", "face"],
  });
}
import { generateInvoicePdf } from "./pdf";
import { runMonthlyBilling } from "./billing";
import { z } from "zod";
import bcrypt from "bcrypt";
import { loginSchema, insertUserSchema, insertServiceSchema, insertInvoiceSchema, insertCustomerSchema, insertTicketSchema, insertTicketReplySchema, insertDeviceSchema, insertDeviceIpSchema, insertDeviceInterfaceSchema, insertCustomerContactSchema, insertCustomerNoteSchema, insertContactAccessBadgeSchema, insertInfrastructureEquipmentSchema, insertInfrastructurePortSchema, PERMISSION_FIELDS } from "@shared/schema";
import { getPduPortStatus, rebootPduPort } from "./snmp";
import { startImapPoller, stopImapPoller, pollMailbox } from "./imap-poller";
import { canViewBilling, canViewServices, canViewTechnical, canManageTechnical, canViewSupport, canCreateSupport, canSubmitSmarthands, canMakePayments, canAccessPortal } from "./permissions";
import { searchZabbixHosts, getZabbixPortStatuses, getZabbixPowerData, testZabbixConnection, isZabbixConfigured, getZabbixAllHosts, getZabbixHostItems, getZabbixItemValues } from "./zabbix";

const dispatchRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  facility: z.string().min(1, "Facility is required"),
  urgency: z.enum(["standard", "priority", "emergency"]),
  details: z.string().min(1, "Task details are required"),
});


function extractUserPermissions(user: any) {
  const perms: Record<string, boolean> = {};
  for (const field of PERMISSION_FIELDS) {
    perms[field] = user[field] ?? false;
  }
  return perms;
}

function sanitizeUser(user: any) {
  const base: any = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    customerId: user.customerId,
    customerRole: user.customerRole,
    active: user.active,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    ...extractUserPermissions(user),
  };
  if (user.role === "admin") {
    base.adminRole = user.adminRole;
    base.adminPermDashboard = user.adminPermDashboard;
    base.adminPermClients = user.adminPermClients;
    base.adminPermSupport = user.adminPermSupport;
    base.adminPermDevices = user.adminPermDevices;
    base.adminPermOrders = user.adminPermOrders;
    base.adminPermSales = user.adminPermSales;
    base.adminPermSettings = user.adminPermSettings;
    base.adminPermUsers = user.adminPermUsers;
    base.adminPermReports = user.adminPermReports;
  }
  return base;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.session;
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const session = await storage.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const user = await storage.getUser(session.userId);
  if (!user || !user.active) {
    return res.status(401).json({ error: "User not found or inactive" });
  }

  (req as any).user = user;
  (req as any).session = session;
  next();
}

function requirePortalAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (user && user.role === "admin") return next();
  if (!user || !canAccessPortal(user)) {
    return res.status(403).json({ error: "Portal access denied" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function requireAdminPerm(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (user.adminRole === "super_admin") return next();
    const permKey = `adminPerm${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof typeof user;
    if (user[permKey] === false) {
      return res.status(403).json({ error: `Access denied: ${permission} permission required` });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  verifyEmailConnection().then((connected) => {
    if (!connected) {
      console.warn("[STARTUP] Email service not fully configured - check MAIL_PASSWORD secret");
    }
  });

  startImapPoller(60000);

  await seedAdminUser();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid credentials",
          details: validation.error.flatten().fieldErrors 
        });
      }

      const { username, password } = validation.data;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.active) {
        return res.status(401).json({ error: "Account is inactive" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const session = await storage.createSession(user.id);
      await storage.updateLastLogin(user.id);

      res.json({
        success: true,
        token: session.token,
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.session;
      if (token) {
        await storage.deleteSession(token);
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("[AUTH] Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json(sanitizeUser(user));
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, requireAdminPerm("users"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        ...sanitizeUser(u),
        active: u.active,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })));
    } catch (error: any) {
      console.error("[ADMIN] Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, requireAdminPerm("users"), async (req, res) => {
    try {
      const schema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors 
        });
      }

      const existingUser = await storage.getUserByUsername(validation.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(validation.data.password, 10);
      const user = await storage.createUser({
        ...validation.data,
        password: hashedPassword,
      });

      res.json({
        ...sanitizeUser(user),
        active: user.active,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      console.error("[ADMIN] Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, requireAdminPerm("users"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.name) updates.name = req.body.name;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.companyName !== undefined) updates.companyName = req.body.companyName;
      if (req.body.customerId !== undefined) updates.customerId = req.body.customerId || null;
      if (req.body.role) updates.role = req.body.role;
      if (typeof req.body.active === "boolean") updates.active = req.body.active;
      
      if (req.body.password) {
        updates.password = await bcrypt.hash(req.body.password, 10);
      }

      for (const field of PERMISSION_FIELDS) {
        if (typeof req.body[field] === "boolean") {
          updates[field] = req.body[field];
        }
      }

      const ADMIN_PERM_FIELDS = ["adminPermDashboard", "adminPermClients", "adminPermSupport", "adminPermDevices", "adminPermOrders", "adminPermSales", "adminPermSettings", "adminPermUsers", "adminPermReports"];
      if (req.body.adminRole) updates.adminRole = req.body.adminRole;
      for (const field of ADMIN_PERM_FIELDS) {
        if (typeof req.body[field] === "boolean") {
          updates[field] = req.body[field];
        }
      }

      const userId = Array.isArray(id) ? id[0] : id;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        ...sanitizeUser(user),
        active: user.active,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      });
    } catch (error: any) {
      console.error("[ADMIN] Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, requireAdminPerm("users"), async (req, res) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user;

      if (userId === currentUser.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await storage.deleteUserSessions(userId);
      const deleted = await storage.deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Customer services endpoints
  app.get("/api/services", requireAuth, requirePortalAccess, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin" && !canViewServices(user)) {
        return res.status(403).json({ error: "You do not have permission to view services" });
      }
      const servicesList = user.role === "admin" 
        ? await storage.getAllServices()
        : await storage.getServicesByUser(user.id);
      const sanitized = user.role === "admin" ? servicesList : servicesList.map((s: any) => {
        const { snmpCommunity, ...rest } = s;
        return rest;
      });
      res.json(sanitized);
    } catch (error: any) {
      console.error("[SERVICES] Get services error:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", requireAuth, requirePortalAccess, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin" && !canViewServices(user)) {
        return res.status(403).json({ error: "You do not have permission to view services" });
      }
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      if (user.role !== "admin" && service.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (user.role !== "admin") {
        const { snmpCommunity, ...sanitized } = service;
        return res.json(sanitized);
      }
      res.json(service);
    } catch (error: any) {
      console.error("[SERVICES] Get service error:", error);
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  // Admin service management
  app.post("/api/admin/services", requireAuth, requireAdmin, requireAdminPerm("orders"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      const validation = insertServiceSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors 
        });
      }
      
      const service = await storage.createService(validation.data);
      res.json(service);
    } catch (error: any) {
      console.error("[ADMIN] Create service error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.put("/api/admin/services/:id", requireAuth, requireAdmin, requireAdminPerm("orders"), async (req, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = { ...req.body };
      if (body.startDate && typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      const service = await storage.updateService(serviceId, body);
      
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      res.json(service);
    } catch (error: any) {
      console.error("[ADMIN] Update service error:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", requireAuth, requireAdmin, requireAdminPerm("orders"), async (req, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteService(serviceId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Delete service error:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Customer invoices endpoints
  app.get("/api/invoices", requireAuth, requirePortalAccess, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin" && !canViewBilling(user)) {
        return res.status(403).json({ error: "You do not have permission to view invoices" });
      }
      const invoicesList = user.role === "admin" 
        ? await storage.getAllInvoices()
        : (await storage.getInvoicesByUser(user.id)).filter(inv => inv.status !== "draft");
      
      if (user.role === "admin") {
        const allUsers = await storage.getAllUsers();
        const allCustomers = await storage.getAllCustomers();
        const enriched = invoicesList.map(inv => {
          const invUser = allUsers.find(u => u.id === inv.userId);
          const customer = invUser?.customerId ? allCustomers.find(c => c.id === invUser.customerId) : null;
          return { ...inv, customerName: customer?.name || invUser?.name || "Unknown", customerId: customer?.id || null };
        });
        return res.json(enriched);
      }
      res.json(invoicesList);
    } catch (error: any) {
      console.error("[INVOICES] Get invoices error:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, requirePortalAccess, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role !== "admin" && !canViewBilling(user)) {
        return res.status(403).json({ error: "You do not have permission to view invoices" });
      }
      const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (user.role !== "admin" && invoice.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const items = await storage.getInvoiceItems(invoiceId);
      res.json({ ...invoice, items });
    } catch (error: any) {
      console.error("[INVOICES] Get invoice error:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  // PDF invoice download
  app.get("/api/invoices/:id/pdf", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      if (user.role !== "admin" && !canViewBilling(user)) {
        return res.status(403).json({ error: "You do not have permission to view invoices" });
      }
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (user.role !== "admin" && invoice.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const items = await storage.getInvoiceItems(invoiceId);
      const invoiceUser = await storage.getUser(invoice.userId);
      let customer = null;
      if (invoiceUser?.customerId) {
        customer = await storage.getCustomer(invoiceUser.customerId) || null;
      }

      const doc = generateInvoicePdf({
        invoice,
        items,
        customer,
        userName: invoiceUser?.name || "Unknown",
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      doc.on("error", (err: any) => {
        console.error("[PDF] Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "PDF generation failed" });
        }
      });
      doc.pipe(res);
    } catch (error: any) {
      console.error("[PDF] Generate invoice PDF error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });

  // Run billing cycle
  app.post("/api/admin/billing/run", requireAuth, requireAdmin, requireAdminPerm("sales"), async (req, res) => {
    try {
      const result = await runMonthlyBilling();
      res.json(result);
    } catch (error: any) {
      console.error("[BILLING] Run billing error:", error);
      res.status(500).json({ error: "Failed to run billing cycle" });
    }
  });

  // Billing settings
  app.get("/api/admin/billing-settings", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("[ADMIN] Get billing settings error:", error);
      res.status(500).json({ error: "Failed to fetch billing settings" });
    }
  });

  app.get("/api/admin/ticket-from-addresses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      const supportEmail = settings.supportEmailAddress || "info@911dc.us";
      let configured: { label: string; email: string }[] = [];
      try {
        const raw = (settings as any).ticketFromAddresses;
        if (raw) configured = JSON.parse(raw);
      } catch {}
      const addresses = [
        { label: "Support", email: supportEmail },
        ...configured,
      ];
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get from addresses" });
    }
  });

  app.put("/api/admin/billing-settings", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const settings = await storage.updateBillingSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("[ADMIN] Update billing settings error:", error);
      res.status(500).json({ error: "Failed to update billing settings" });
    }
  });

  // Approve invoice (draft -> pending)
  app.post("/api/admin/invoices/:id/approve", requireAuth, requireAdmin, requireAdminPerm("sales"), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const invoice = await storage.getInvoice(id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      if (invoice.status !== "draft") return res.status(400).json({ error: "Only draft invoices can be approved" });
      const updated = await storage.updateInvoice(id, { status: "pending" });

      try {
        const invoiceUser = await storage.getUser(invoice.userId);
        const customer = invoiceUser?.customerId ? await storage.getCustomer(invoiceUser.customerId) : null;
        if (customer) {
          const billingSettings = await storage.getBillingSettings();
          const allUsers = await storage.getAllUsers();
          const customerUsers = allUsers.filter(u => u.customerId === customer.id && u.permBillingReceiveInvoices && u.email);
          const items = await storage.getInvoiceItems(id);

          let pdfBuffer: Buffer | undefined;
          try {
            const pdfDoc = generateInvoicePdf({ invoice, items, customer, userName: invoiceUser?.name || "Customer" });
            const chunks: Buffer[] = [];
            pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
            pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
              pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
              pdfDoc.on("error", reject);
              pdfDoc.end();
            });
          } catch (pdfErr: any) {
            console.error("[ADMIN] PDF generation error for approve email:", pdfErr.message);
          }

          for (const recipient of customerUsers) {
            const emailResult = await sendInvoiceEmail(
              {
                customerName: customer.name,
                contactName: recipient.name || customer.contactName || customer.name,
                email: recipient.email,
                invoiceNumber: invoice.invoiceNumber,
                total: Number(invoice.total).toFixed(2),
                dueDate: new Date(invoice.dueDate).toLocaleDateString("en-US"),
                issueDate: new Date(invoice.issueDate).toLocaleDateString("en-US"),
                itemCount: items.length,
              },
              {
                subject: billingSettings.billingEmailSubject,
                body: billingSettings.billingEmailTemplate,
              },
              pdfBuffer
            );
            console.log(`[ADMIN] Approve email to ${recipient.email}: ${emailResult.success ? "sent" : emailResult.error}`);
          }
          if (customerUsers.length === 0) {
            console.log(`[ADMIN] No users with billing_receive_invoices permission for ${customer.name}`);
          }
        } else {
          console.log(`[ADMIN] No customer found for invoice ${invoice.invoiceNumber} (userId: ${invoice.userId})`);
        }
      } catch (emailErr: any) {
        console.error("[ADMIN] Approve invoice email error:", emailErr.message);
      }

      res.json(updated);
    } catch (error: any) {
      console.error("[ADMIN] Approve invoice error:", error);
      res.status(500).json({ error: "Failed to approve invoice" });
    }
  });

  // Send invitation email
  app.post("/api/admin/users/:id/send-invitation", requireAuth, requireAdmin, requireAdminPerm("users"), async (req, res) => {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const billingSettings = await storage.getBillingSettings();
      const customer = user.customerId ? await storage.getCustomer(user.customerId) : null;

      const result = await sendInvitationEmail(
        {
          userName: user.name,
          userEmail: user.email,
          companyName: customer?.name || user.companyName || "911-DC",
          portalUrl: `${req.protocol}://${req.get("host")}/portal`,
        },
        {
          subject: billingSettings.invitationEmailSubject,
          body: billingSettings.invitationEmailTemplate,
        }
      );

      if (result.success) {
        res.json({ success: true, message: "Invitation email sent" });
      } else {
        res.status(500).json({ error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("[ADMIN] Send invitation error:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  // Admin invoice management
  app.post("/api/admin/invoices", requireAuth, requireAdmin, requireAdminPerm("sales"), async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;
      if (invoiceData.issueDate && typeof invoiceData.issueDate === 'string') {
        invoiceData.issueDate = new Date(invoiceData.issueDate);
      }
      if (invoiceData.dueDate && typeof invoiceData.dueDate === 'string') {
        invoiceData.dueDate = new Date(invoiceData.dueDate);
      }
      const validation = insertInvoiceSchema.safeParse(invoiceData);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors 
        });
      }
      
      const invoice = await storage.createInvoice(validation.data);
      
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createInvoiceItem({
            ...item,
            invoiceId: invoice.id,
          });
        }
      }
      
      const createdItems = await storage.getInvoiceItems(invoice.id);
      res.json({ ...invoice, items: createdItems });
    } catch (error: any) {
      console.error("[ADMIN] Create invoice error:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.put("/api/admin/invoices/:id", requireAuth, requireAdmin, requireAdminPerm("sales"), async (req, res) => {
    try {
      const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { items, ...updates } = req.body;
      if (updates.issueDate && typeof updates.issueDate === 'string') {
        updates.issueDate = new Date(updates.issueDate);
      }
      if (updates.dueDate && typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }
      const invoice = await storage.updateInvoice(invoiceId, updates);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (items && Array.isArray(items)) {
        await storage.deleteInvoiceItems(invoiceId);
        for (const item of items) {
          await storage.createInvoiceItem({
            ...item,
            invoiceId: invoice.id,
          });
        }
      }
      
      const updatedItems = await storage.getInvoiceItems(invoice.id);
      res.json({ ...invoice, items: updatedItems });
    } catch (error: any) {
      console.error("[ADMIN] Update invoice error:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/admin/invoices/:id", requireAuth, requireAdmin, requireAdminPerm("sales"), async (req, res) => {
    try {
      const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteInvoice(invoiceId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Delete invoice error:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Get customer users for dropdowns (services/invoices)
  app.get("/api/admin/customer-users", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const allCustomers = await storage.getAllCustomers();
      const result: Array<{ id: string; name: string; companyName: string | null; email: string | null; customerId: string }> = [];
      for (const customer of allCustomers) {
        const users = await storage.getUsersByCustomer(customer.id);
        if (users.length > 0) {
          result.push({
            id: users[0].id,
            name: customer.name,
            companyName: customer.name,
            email: customer.email,
            customerId: customer.id,
          });
        } else {
          result.push({
            id: "",
            name: customer.name,
            companyName: customer.name,
            email: customer.email,
            customerId: customer.id,
          });
        }
      }
      res.json(result);
    } catch (error: any) {
      console.error("[ADMIN] Get customer users error:", error);
      res.status(500).json({ error: "Failed to fetch customer users" });
    }
  });

  // Customer (Company) CRUD
  app.get("/api/admin/customers", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const allCustomers = await storage.getAllCustomers();
      res.json(allCustomers);
    } catch (error: any) {
      console.error("[ADMIN] Get customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/customers/:id", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const customerUsers = await storage.getUsersByCustomer(customerId);
      const contacts = await storage.getCustomerContacts(customerId);
      const notes = await storage.getCustomerNotes(customerId);
      const customerTickets = await storage.getTicketsByCustomer(customerId);
      const allDevices = await storage.getDevicesByCustomer(customerId);
      const allServices = await storage.getAllServices();
      const customerServices = allServices.filter(s => customerUsers.some(u => u.id === s.userId));
      const allInvoices = await storage.getAllInvoices();
      const customerInvoices = allInvoices.filter(inv => customerUsers.some(u => u.id === inv.userId));
      const allUsersForNotes = await storage.getAllUsers();
      const enrichedNotes = notes.map(n => {
        const author = allUsersForNotes.find(u => u.id === n.userId);
        return { ...n, authorName: author?.name || "Unknown" };
      });
      res.json({
        ...customer,
        users: customerUsers.map(u => ({ ...sanitizeUser(u), active: u.active, createdAt: u.createdAt, lastLogin: u.lastLogin })),
        contacts,
        notes: enrichedNotes,
        tickets: customerTickets.slice(0, 10),
        devices: allDevices,
        services: customerServices,
        invoices: customerInvoices.slice(0, 10),
        invoiceBalance: customerInvoices.filter(i => i.status === "pending").reduce((sum, i) => sum + Number(i.total), 0).toFixed(2),
      });
    } catch (error: any) {
      console.error("[ADMIN] Get customer error:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/admin/customers", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const validation = insertCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      }
      const customer = await storage.createCustomer(validation.data);
      res.json(customer);
    } catch (error: any) {
      console.error("[ADMIN] Create customer error:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/admin/customers/:id", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const customer = await storage.updateCustomer(customerId, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      console.error("[ADMIN] Update customer error:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/admin/customers/:id", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteCustomer(customerId);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Delete customer error:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Add/remove user from customer
  app.post("/api/admin/customers/:id/users", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { username, password, email, name, customerRole, ...rest } = req.body;
      
      const permFields: Record<string, boolean> = {};
      for (const field of PERMISSION_FIELDS) {
        if (typeof rest[field] === "boolean") {
          permFields[field] = rest[field];
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: "customer",
        customerId,
        customerRole: customerRole || "technician",
        active: true,
        ...permFields,
      });

      res.json({ ...sanitizeUser(user), active: user.active });
    } catch (error: any) {
      console.error("[ADMIN] Add customer user error:", error);
      if (error.code === "23505") {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Failed to add user to customer" });
    }
  });

  app.put("/api/admin/customers/:customerId/users/:userId", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const { customerRole, name, email } = req.body;
      
      const updates: any = {};
      if (customerRole) updates.customerRole = customerRole;
      if (name) updates.name = name;
      if (email) updates.email = email;

      for (const field of PERMISSION_FIELDS) {
        if (typeof req.body[field] === "boolean") {
          updates[field] = req.body[field];
        }
      }
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...sanitizeUser(user), active: user.active });
    } catch (error: any) {
      console.error("[ADMIN] Update customer user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/customers/:customerId/users/:userId", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      await storage.updateUser(userId, { customerId: null, customerRole: null } as any);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Remove customer user error:", error);
      res.status(500).json({ error: "Failed to remove user from customer" });
    }
  });

  // Ticket endpoints
  app.get("/api/tickets", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role === "admin") {
        const allTickets = await storage.getAllTickets();
        const allUsers = await storage.getAllUsers();
        const allCustomers = await storage.getAllCustomers();
        const enriched = allTickets.map((t: any) => {
          const creator = allUsers.find(u => u.id === t.userId);
          const customer = t.customerId ? allCustomers.find(c => c.id === t.customerId) : null;
          const assignee = t.assignedTo ? allUsers.find(u => u.id === t.assignedTo) : null;
          return {
            ...t,
            creatorName: creator?.name || "Unknown",
            customerName: customer?.name || creator?.companyName || "Unknown",
            assigneeName: assignee?.name || null,
          };
        });
        return res.json(enriched);
      }
      if (!canViewSupport(user)) {
        return res.status(403).json({ error: "You do not have permission to view tickets" });
      }
      if (!user.customerId) {
        return res.json([]);
      }
      const customerTickets = await storage.getTicketsByCustomer(user.customerId);
      res.json(customerTickets);
    } catch (error: any) {
      console.error("[TICKETS] Get tickets error:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (user.role !== "admin") {
        if (!canViewSupport(user)) {
          return res.status(403).json({ error: "Access denied" });
        }
        if (ticket.customerId !== user.customerId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      let replies = await storage.getTicketReplies(ticketId);
      if (user.role !== "admin") {
        replies = replies.filter(r => !r.isInternal);
      }
      const allUsers = await storage.getAllUsers();
      const enrichedReplies = replies.map(r => {
        const author = allUsers.find(u => u.id === r.userId);
        return { ...r, authorName: author?.name || "Unknown", authorRole: author?.role || "customer" };
      });
      const creator = allUsers.find(u => u.id === ticket.userId);
      const customer = ticket.customerId ? await storage.getCustomer(ticket.customerId) : null;
      const assignee = ticket.assignedTo ? allUsers.find(u => u.id === ticket.assignedTo) : null;
      res.json({
        ...ticket,
        creatorName: creator?.name || "Unknown",
        customerName: customer?.name || creator?.companyName || "Unknown",
        assigneeName: assignee?.name || null,
        replies: enrichedReplies,
      });
    } catch (error: any) {
      console.error("[TICKETS] Get ticket error:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role !== "admin" && !canCreateSupport(user)) {
        return res.status(403).json({ error: "You do not have permission to create tickets" });
      }
      const body: any = {
        ...req.body,
        userId: user.role === "admin" ? (req.body.userId || user.id) : user.id,
        customerId: user.role === "admin" ? (req.body.customerId || null) : (user.customerId || null),
      };
      const validation = insertTicketSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      }
      const ticket = await storage.createTicket(validation.data);

      try {
        const settings = await storage.getBillingSettings();
        const supportEmail = settings.supportEmailAddress || "info@911dc.us";
        const creator = await storage.getUser(ticket.userId);
        const customer = ticket.customerId ? await storage.getCustomer(ticket.customerId) : null;
        await sendTicketNotificationEmail({
          recipientEmail: supportEmail,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          replyBody: ticket.body,
          replyAuthor: creator?.name || "Customer",
          customerName: customer?.name || creator?.companyName || "Unknown",
          isNewTicket: true,
        }, settings);
      } catch (emailErr: any) {
        console.error("[TICKETS] Email notification error:", emailErr.message);
      }

      res.json(ticket);
    } catch (error: any) {
      console.error("[TICKETS] Create ticket error:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  app.post("/api/admin/tickets/bulk", requireAuth, requireAdmin, requireAdminPerm("support"), async (req: any, res) => {
    try {
      const { ticketIds, action, value } = req.body;
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ error: "ticketIds must be a non-empty array" });
      }
      if (!["status", "category", "assignedTo", "delete"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      if (action === "delete") {
        const count = await storage.bulkDeleteTickets(ticketIds);
        return res.json({ success: true, affected: count });
      }

      const validStatuses = ["new", "open", "in_progress", "waiting", "resolved", "closed"];
      const validCategories = ["support", "sales", "billing", "provisioning", "smart_hands", "abuse", "general"];

      if (action === "status" && !validStatuses.includes(value)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      if (action === "category" && !validCategories.includes(value)) {
        return res.status(400).json({ error: "Invalid category value" });
      }

      const updates: any = {};
      if (action === "assignedTo") {
        if (value && value !== "unassigned") {
          const assignee = await storage.getUser(value);
          if (!assignee || assignee.role !== "admin") {
            return res.status(400).json({ error: "Invalid assignee" });
          }
          updates.assignedTo = value;
        } else {
          updates.assignedTo = null;
        }
      } else if (action === "status") {
        updates.status = value;
        if (value === "resolved" || value === "closed") {
          updates.closedAt = new Date();
        }
      } else {
        updates[action] = value;
      }

      const count = await storage.bulkUpdateTickets(ticketIds, updates);
      res.json({ success: true, affected: count });
    } catch (error: any) {
      console.error("[TICKETS] Bulk operation error:", error.message);
      res.status(500).json({ error: "Bulk operation failed" });
    }
  });

  app.put("/api/tickets/:id", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (user.role !== "admin") {
        if (ticket.customerId !== user.customerId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const updates: any = {};
      if (user.role === "admin") {
        if (req.body.status) updates.status = req.body.status;
        if (req.body.priority) updates.priority = req.body.priority;
        if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo || null;
        if (req.body.category) {
          const validCategories = ["support", "sales", "billing", "provisioning", "smart_hands", "abuse", "general"];
          if (validCategories.includes(req.body.category)) {
            updates.category = req.body.category;
          }
        }
        if (req.body.status === "closed" || req.body.status === "resolved") {
          updates.closedAt = new Date();
        }
      }
      const updated = await storage.updateTicket(ticketId, updates);
      res.json(updated);
    } catch (error: any) {
      console.error("[TICKETS] Update ticket error:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  app.post("/api/tickets/:id/replies", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (user.role !== "admin") {
        if (!canViewSupport(user)) {
          return res.status(403).json({ error: "Access denied" });
        }
        if (ticket.customerId !== user.customerId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const rawBody = req.body.body || "";
      const sanitizedBody = rawBody.startsWith("<") ? sanitizeHtml(rawBody) : rawBody;
      const replyData: any = {
        ticketId,
        userId: user.id,
        body: sanitizedBody,
        isInternal: user.role === "admin" ? (req.body.isInternal || false) : false,
      };
      const validation = insertTicketReplySchema.safeParse(replyData);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      }
      const reply = await storage.createTicketReply(validation.data);
      await storage.updateTicket(ticketId, {});

      try {
        if (!replyData.isInternal) {
          const settings = await storage.getBillingSettings();
          const customer = ticket.customerId ? await storage.getCustomer(ticket.customerId) : null;

          if (user.role === "admin") {
            const isHtml = !!req.body.isHtml;
            let selectedFrom: string | undefined = undefined;
            if (req.body.fromAddress) {
              const supportEmail = settings.supportEmailAddress || "info@911dc.us";
              let configuredAddrs: string[] = [supportEmail.toLowerCase()];
              try {
                const parsed = JSON.parse((settings as any).ticketFromAddresses || "[]");
                configuredAddrs.push(...parsed.map((a: any) => a.email?.toLowerCase()));
              } catch {}
              if (configuredAddrs.includes(req.body.fromAddress.toLowerCase())) {
                selectedFrom = req.body.fromAddress;
              }
            }
            const notifiedEmails = new Set<string>();
            if (ticket.customerId) {
              const customerUsers = await storage.getUsersByCustomer(ticket.customerId);
              const recipients = customerUsers.filter(u => u.email && u.permSupportView);
              for (const recipient of recipients) {
                await sendTicketNotificationEmail({
                  recipientEmail: recipient.email,
                  ticketNumber: ticket.ticketNumber,
                  subject: ticket.subject,
                  replyBody: sanitizedBody,
                  replyAuthor: user.name,
                  customerName: customer?.name || "Customer",
                  fromAddress: selectedFrom,
                  isHtml,
                }, settings);
                notifiedEmails.add(recipient.email.toLowerCase());
              }
            }
            if (ticket.contactEmail && !notifiedEmails.has(ticket.contactEmail.toLowerCase())) {
              await sendTicketNotificationEmail({
                recipientEmail: ticket.contactEmail,
                ticketNumber: ticket.ticketNumber,
                subject: ticket.subject,
                replyBody: sanitizedBody,
                replyAuthor: user.name,
                customerName: customer?.name || "Customer",
                fromAddress: selectedFrom,
                isHtml,
              }, settings);
            }
          } else {
            const supportEmail = settings.supportEmailAddress || "info@911dc.us";
            let recipientEmail = supportEmail;
            if (ticket.assignedTo) {
              const assignee = await storage.getUser(ticket.assignedTo);
              if (assignee?.email) recipientEmail = assignee.email;
            }
            await sendTicketNotificationEmail({
              recipientEmail,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              replyBody: sanitizedBody,
              replyAuthor: user.name,
              customerName: customer?.name || user.companyName || "Customer",
            }, settings);
          }
        }
      } catch (emailErr: any) {
        console.error("[TICKETS] Reply email notification error:", emailErr.message);
      }

      res.json(reply);
    } catch (error: any) {
      console.error("[TICKETS] Create reply error:", error);
      res.status(500).json({ error: "Failed to create reply" });
    }
  });

  app.post("/api/dispatch", async (req, res) => {
    try {
      const validation = dispatchRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        });
      }

      const dispatchRequest: DispatchRequest = validation.data;
      const emailResult = await sendDispatchEmail(dispatchRequest);

      if (emailResult.success) {
        return res.json({
          success: true,
          message: "Dispatch request submitted successfully",
        });
      } else {
        console.error(`[API] Email send failed: ${emailResult.error}`);
        return res.status(500).json({
          success: false,
          error: "Failed to send dispatch request. Please try again or contact us directly at info@911dc.us",
        });
      }
    } catch (error: any) {
      console.error("[API] Dispatch endpoint error:", error);
      return res.status(500).json({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      });
    }
  });

  app.get("/api/services/:id/pdu/status", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      if (user.role !== "admin" && !canViewTechnical(user)) {
        return res.status(403).json({ error: "You do not have permission to view technical details" });
      }
      const service = await storage.getService(serviceId);

      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (user.role !== "admin" && service.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!service.snmpHost || !service.snmpOidStatus || service.pduPortNumber == null) {
        return res.status(400).json({ error: "SNMP/PDU not configured for this service" });
      }

      const status = await getPduPortStatus(
        service.snmpHost,
        service.snmpPort || 161,
        service.snmpCommunity || "public",
        service.snmpVersion || "v2c",
        service.snmpOidStatus,
        service.pduPortNumber
      );

      res.json(status);
    } catch (error: any) {
      console.error("[PDU] Get port status error:", error);
      res.status(500).json({ error: error.message || "Failed to get PDU port status" });
    }
  });

  app.post("/api/services/:id/pdu/reboot", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user;
      if (user.role !== "admin" && !canManageTechnical(user)) {
        return res.status(403).json({ error: "You do not have permission to manage technical operations" });
      }
      const service = await storage.getService(serviceId);

      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (user.role !== "admin" && service.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!service.snmpHost || !service.snmpOidControl || service.pduPortNumber == null) {
        return res.status(400).json({ error: "SNMP/PDU control not configured for this service" });
      }

      const result = await rebootPduPort(
        service.snmpHost,
        service.snmpPort || 161,
        service.snmpCommunity || "private",
        service.snmpVersion || "v2c",
        service.snmpOidControl,
        service.pduPortNumber
      );

      console.log(`[PDU] Reboot port ${service.pduPortNumber} on ${service.snmpHost} by user ${user.username}`);
      res.json(result);
    } catch (error: any) {
      console.error("[PDU] Reboot port error:", error);
      res.status(500).json({ error: error.message || "Failed to reboot PDU port" });
    }
  });

  // SMTP test endpoint
  app.post("/api/admin/test-smtp", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      const testSettings = {
        ...settings,
        ...(req.body?.smtpHost && { smtpHost: req.body.smtpHost }),
        ...(req.body?.smtpPort && { smtpPort: req.body.smtpPort }),
        ...(req.body?.smtpUser && { smtpUser: req.body.smtpUser }),
        ...(req.body?.smtpPassword && { smtpPassword: req.body.smtpPassword }),
        ...(req.body?.smtpSecure !== undefined && { smtpSecure: req.body.smtpSecure }),
      };
      const result = await testSmtpConnection(testSettings);
      res.json(result);
    } catch (error: any) {
      console.error("[ADMIN] Test SMTP error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Device CRUD
  app.get("/api/admin/devices", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const allDevices = await storage.getAllDevices();
      const allCustomers = await storage.getAllCustomers();
      const allServices = await storage.getAllServices();
      const enriched = allDevices.map(d => {
        const customer = d.customerId ? allCustomers.find(c => c.id === d.customerId) : null;
        const service = d.serviceId ? allServices.find(s => s.id === d.serviceId) : null;
        return { ...d, customerName: customer?.name || null, serviceName: service?.name || null };
      });
      res.json(enriched);
    } catch (error: any) {
      console.error("[ADMIN] Get devices error:", error);
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  app.get("/api/admin/devices/:id", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const device = await storage.getDevice(deviceId);
      if (!device) return res.status(404).json({ error: "Device not found" });
      const ips = await storage.getDeviceIps(deviceId);
      const interfaces = await storage.getDeviceInterfaces(deviceId);
      const children = await storage.getChildDevices(deviceId);
      const customer = device.customerId ? await storage.getCustomer(device.customerId) : null;
      const service = device.serviceId ? await storage.getService(device.serviceId) : null;
      const allDevices = await storage.getAllDevices();
      const enrichedInterfaces = interfaces.map(i => {
        const connDev = i.connectedDeviceId ? allDevices.find(d => d.id === i.connectedDeviceId) : null;
        return { ...i, connectedDeviceName: connDev?.name || null };
      });
      res.json({
        ...device,
        customerName: customer?.name || null,
        serviceName: service?.name || null,
        ips,
        interfaces: enrichedInterfaces,
        children: children.map(c => ({ id: c.id, deviceNumber: c.deviceNumber, name: c.name, deviceType: c.deviceType, status: c.status })),
      });
    } catch (error: any) {
      console.error("[ADMIN] Get device error:", error);
      res.status(500).json({ error: "Failed to fetch device" });
    }
  });

  app.post("/api/admin/devices", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const validation = insertDeviceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      }
      const device = await storage.createDevice(validation.data);
      res.json(device);
    } catch (error: any) {
      console.error("[ADMIN] Create device error:", error);
      res.status(500).json({ error: "Failed to create device" });
    }
  });

  app.put("/api/admin/devices/:id", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const device = await storage.updateDevice(deviceId, req.body);
      if (!device) return res.status(404).json({ error: "Device not found" });
      res.json(device);
    } catch (error: any) {
      console.error("[ADMIN] Update device error:", error);
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  app.delete("/api/admin/devices/:id", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteDevice(deviceId);
      if (!deleted) return res.status(404).json({ error: "Device not found" });
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Delete device error:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  app.get("/api/admin/devices/:id/ips", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ips = await storage.getDeviceIps(deviceId);
      res.json(ips);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch device IPs" });
    }
  });

  app.post("/api/admin/devices/:id/ips", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = insertDeviceIpSchema.safeParse({ ...req.body, deviceId });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const ip = await storage.createDeviceIp(validation.data);
      res.json(ip);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create device IP" });
    }
  });

  app.delete("/api/admin/devices/:deviceId/ips/:ipId", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const ipId = Array.isArray(req.params.ipId) ? req.params.ipId[0] : req.params.ipId;
      await storage.deleteDeviceIp(ipId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete device IP" });
    }
  });

  app.get("/api/admin/devices/:id/interfaces", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const interfaces = await storage.getDeviceInterfaces(deviceId);
      res.json(interfaces);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch device interfaces" });
    }
  });

  app.post("/api/admin/devices/:id/interfaces", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = insertDeviceInterfaceSchema.safeParse({ ...req.body, deviceId });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      if (req.body.infrastructurePortId) {
        const port = await storage.getPort(req.body.infrastructurePortId);
        if (!port) return res.status(400).json({ error: "Infrastructure port not found" });
        if (port.status !== "available") return res.status(400).json({ error: "Infrastructure port is not available" });
      }
      const iface = await storage.createDeviceInterface(validation.data);
      if (req.body.infrastructurePortId) {
        await storage.updatePort(req.body.infrastructurePortId, {
          status: "in_use",
          connectedDeviceId: deviceId,
          connectedInterfaceId: iface.id,
        });
      }
      res.json(iface);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create device interface" });
    }
  });

  app.delete("/api/admin/devices/:deviceId/interfaces/:ifaceId", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const ifaceId = Array.isArray(req.params.ifaceId) ? req.params.ifaceId[0] : req.params.ifaceId;
      const iface = await storage.getDeviceInterface(ifaceId);
      if (iface?.infrastructurePortId) {
        await storage.updatePort(iface.infrastructurePortId, {
          status: "available",
          connectedDeviceId: null,
          connectedInterfaceId: null,
        });
      }
      await storage.deleteDeviceInterface(ifaceId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete device interface" });
    }
  });

  // Customer contacts and notes
  app.get("/api/admin/customers/:id/contacts", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const contacts = await storage.getCustomerContacts(customerId);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/admin/customers/:id/contacts", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = insertCustomerContactSchema.safeParse({ ...req.body, customerId });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const contact = await storage.createCustomerContact(validation.data);
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/admin/customers/:customerId/contacts/:contactId", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      const contact = await storage.updateCustomerContact(contactId, req.body);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/customers/:customerId/contacts/:contactId", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      await storage.deleteCustomerContact(contactId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.get("/api/admin/customers/:id/notes", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const notes = await storage.getCustomerNotes(customerId);
      const allUsers = await storage.getAllUsers();
      const enriched = notes.map(n => {
        const author = allUsers.find(u => u.id === n.userId);
        return { ...n, authorName: author?.name || "Unknown" };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/admin/customers/:id/notes", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = (req as any).user;
      const validation = insertCustomerNoteSchema.safeParse({ ...req.body, customerId, userId: user.id });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const note = await storage.createCustomerNote(validation.data);
      res.json({ ...note, authorName: user.name });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.get("/api/admin/contacts/:contactId/access-badges", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      const badges = await storage.getContactAccessBadges(contactId);
      const allDevices = await storage.getAllDevices();
      const enriched = badges.map(b => {
        const device = allDevices.find(d => d.id === b.deviceId);
        return { ...b, deviceName: device?.name || null, deviceNumber: device?.deviceNumber || null };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch access badges" });
    }
  });

  app.post("/api/admin/contacts/:contactId/access-badges", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      const validation = insertContactAccessBadgeSchema.safeParse({ ...req.body, contactId });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const badge = await storage.createContactAccessBadge(validation.data);
      res.json(badge);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create access badge" });
    }
  });

  app.delete("/api/admin/contacts/:contactId/access-badges/:badgeId", requireAuth, requireAdmin, requireAdminPerm("clients"), async (req, res) => {
    try {
      const badgeId = Array.isArray(req.params.badgeId) ? req.params.badgeId[0] : req.params.badgeId;
      await storage.deleteContactAccessBadge(badgeId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete access badge" });
    }
  });

  app.get("/api/admin/devices/:id/access-badges", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const badges = await storage.getAccessBadgesByDevice(deviceId);
      const allContacts: any[] = [];
      for (const b of badges) {
        const contact = await storage.getCustomerContact(b.contactId);
        if (contact) allContacts.push(contact);
      }
      const enriched = badges.map(b => {
        const contact = allContacts.find(c => c.id === b.contactId);
        return { ...b, contactName: contact?.name || "Unknown", contactEmail: contact?.email || null };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch device access badges" });
    }
  });

  // Customer devices endpoint (for customer portal)
  app.get("/api/devices", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role === "admin") {
        const allDevices = await storage.getAllDevices();
        return res.json(allDevices);
      }
      if (!user.customerId) return res.json([]);
      const customerDevices = await storage.getDevicesByCustomer(user.customerId);
      const sanitized = customerDevices.map(d => {
        const { snmpCommunity, ...rest } = d;
        return rest;
      });
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  // Infrastructure Equipment CRUD
  app.get("/api/admin/infrastructure", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const equipment = await storage.getAllEquipment();
      const withPortCounts = await Promise.all(equipment.map(async (e) => {
        const ports = await storage.getEquipmentPorts(e.id);
        const usedPorts = ports.filter(p => p.status === "in_use").length;
        return { ...e, usedPorts, totalPortsActual: ports.length };
      }));
      res.json(withPortCounts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch infrastructure equipment" });
    }
  });

  app.post("/api/admin/infrastructure", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const validation = insertInfrastructureEquipmentSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const equipment = await storage.createEquipment(validation.data);
      res.json(equipment);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.get("/api/admin/infrastructure/:id", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const equipment = await storage.getEquipment(id);
      if (!equipment) return res.status(404).json({ error: "Equipment not found" });
      res.json(equipment);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.put("/api/admin/infrastructure/:id", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const equipment = await storage.updateEquipment(id, req.body);
      if (!equipment) return res.status(404).json({ error: "Equipment not found" });
      res.json(equipment);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.delete("/api/admin/infrastructure/:id", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteEquipment(id);
      if (!deleted) return res.status(404).json({ error: "Equipment not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // Infrastructure Ports
  app.get("/api/admin/infrastructure/:id/ports", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const equipmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ports = await storage.getEquipmentPorts(equipmentId);
      const allDevices = await storage.getAllDevices();
      const enriched = ports.map(p => {
        const device = p.connectedDeviceId ? allDevices.find(d => d.id === p.connectedDeviceId) : null;
        return { ...p, connectedDeviceName: device?.name || null };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch ports" });
    }
  });

  app.post("/api/admin/infrastructure/:id/ports", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const equipmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = insertInfrastructurePortSchema.safeParse({ ...req.body, equipmentId });
      if (!validation.success) return res.status(400).json({ error: "Validation failed", details: validation.error.flatten().fieldErrors });
      const port = await storage.createPort(validation.data);
      res.json(port);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create port" });
    }
  });

  app.post("/api/admin/infrastructure/:id/ports/bulk", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const equipmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { count, pattern, portType, speed } = req.body;
      if (!count || !pattern) return res.status(400).json({ error: "Count and pattern are required" });
      const ports = [];
      for (let i = 1; i <= count; i++) {
        const portName = pattern.replace("{n}", String(i));
        ports.push({ equipmentId, portName, portType: portType || "ethernet", speed: speed || null, status: "available" as const });
      }
      const created = await storage.bulkCreatePorts(ports as any);
      res.json(created);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to bulk create ports" });
    }
  });

  app.put("/api/admin/infrastructure/ports/:portId", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const portId = Array.isArray(req.params.portId) ? req.params.portId[0] : req.params.portId;
      const port = await storage.updatePort(portId, req.body);
      if (!port) return res.status(404).json({ error: "Port not found" });
      res.json(port);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update port" });
    }
  });

  app.delete("/api/admin/infrastructure/ports/:portId", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const portId = Array.isArray(req.params.portId) ? req.params.portId[0] : req.params.portId;
      const deleted = await storage.deletePort(portId);
      if (!deleted) return res.status(404).json({ error: "Port not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete port" });
    }
  });

  app.get("/api/admin/infrastructure/ports/available", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId as string | undefined;
      const ports = await storage.getAvailablePorts(equipmentId);
      const allEquipment = await storage.getAllEquipment();
      const grouped = ports.map(p => {
        const equip = allEquipment.find(e => e.id === p.equipmentId);
        return { ...p, equipmentName: equip?.name || "Unknown", equipmentType: equip?.equipmentType || "unknown" };
      });
      res.json(grouped);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch available ports" });
    }
  });

  // Zabbix API routes
  app.get("/api/admin/zabbix/hosts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const query = (req.query.search as string) || "";
      if (query) {
        const hosts = await searchZabbixHosts(query);
        return res.json(hosts);
      }
      const hosts = await getZabbixAllHosts();
      res.json(hosts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Zabbix hosts" });
    }
  });

  app.get("/api/admin/zabbix/test", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    const result = await testZabbixConnection();
    res.json(result);
  });

  app.get("/api/admin/zabbix/host/:hostId/items", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const hostId = Array.isArray(req.params.hostId) ? req.params.hostId[0] : req.params.hostId;
      const items = await getZabbixHostItems(hostId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Zabbix items" });
    }
  });

  app.get("/api/admin/zabbix/items", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const ids = typeof req.query.ids === "string" ? req.query.ids.split(",").filter(Boolean) : [];
      if (ids.length === 0) return res.json([]);
      const items = await getZabbixItemValues(ids);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Zabbix item values" });
    }
  });

  app.get("/api/admin/grafana/test", requireAuth, requireAdmin, requireAdminPerm("settings"), async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      if (!settings.grafanaUrl) return res.json({ success: false, message: "Grafana URL not configured" });
      const url = `${settings.grafanaUrl.replace(/\/$/, "")}/api/health`;
      const response = await fetchTolerant(url, {
        headers: settings.grafanaApiKey ? { Authorization: `Bearer ${settings.grafanaApiKey}` } : {},
      });
      if (response.ok) {
        res.json({ success: true, message: "Connected to Grafana" });
      } else {
        res.json({ success: false, message: `Grafana responded with status ${response.status}` });
      }
    } catch (error: any) {
      res.json({ success: false, message: `Failed to connect: ${error.message}` });
    }
  });

  app.get("/api/admin/grafana/dashboards", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      if (!settings.grafanaUrl) return res.json([]);
      const url = `${settings.grafanaUrl.replace(/\/$/, "")}/api/search?type=dash-db`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (settings.grafanaApiKey) headers["Authorization"] = `Bearer ${settings.grafanaApiKey}`;
      const response = await fetchTolerant(url, { headers });
      if (!response.ok) return res.json([]);
      const dashboards = await response.json();
      res.json((dashboards as any[]).map((d: any) => ({
        uid: d.uid,
        title: d.title,
        url: d.url,
        type: d.type,
        tags: d.tags || [],
      })));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch dashboards" });
    }
  });

  app.get("/api/admin/grafana/dashboard/:uid/panels", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getBillingSettings();
      if (!settings.grafanaUrl) return res.json([]);
      const uid = Array.isArray(req.params.uid) ? req.params.uid[0] : req.params.uid;
      const url = `${settings.grafanaUrl.replace(/\/$/, "")}/api/dashboards/uid/${uid}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (settings.grafanaApiKey) headers["Authorization"] = `Bearer ${settings.grafanaApiKey}`;
      const response = await fetchTolerant(url, { headers });
      if (!response.ok) return res.json([]);
      const data = await response.json() as any;
      const panels = (data.dashboard?.panels || []).map((p: any) => ({
        id: p.id,
        title: p.title || `Panel ${p.id}`,
        type: p.type,
      }));
      res.json(panels);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch panels" });
    }
  });

  app.get("/api/admin/zabbix/host/:hostId/ports", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const hostId = Array.isArray(req.params.hostId) ? req.params.hostId[0] : req.params.hostId;
      const portStatuses = await getZabbixPortStatuses(hostId);
      res.json(portStatuses);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch port statuses" });
    }
  });

  app.get("/api/admin/zabbix/host/:hostId/power", requireAuth, requireAdmin, requireAdminPerm("devices"), async (req, res) => {
    try {
      const hostId = Array.isArray(req.params.hostId) ? req.params.hostId[0] : req.params.hostId;
      const powerData = await getZabbixPowerData(hostId);
      res.json(powerData);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch power data" });
    }
  });

  app.get("/api/devices/:id/port-status", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const device = await storage.getDevice(deviceId);
      if (!device) return res.status(404).json({ error: "Device not found" });
      if (req.user.role !== "admin" && device.customerId !== req.user.customerId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (!device.zabbixHostId) return res.json({ items: [], mode: "none" });
      if (device.zabbixItems) {
        try {
          const configured = JSON.parse(device.zabbixItems);
          if (Array.isArray(configured) && configured.length > 0) {
            const itemIds = configured.map((i: any) => i.itemId);
            const values = await getZabbixItemValues(itemIds);
            const enriched = values.map((v: any) => {
              const cfg = configured.find((c: any) => c.itemId === v.itemId);
              return { ...v, type: cfg?.type || "other", label: cfg?.label || v.name };
            });
            return res.json({ items: enriched, mode: "selected" });
          }
        } catch {}
      }
      const portStatuses = await getZabbixPortStatuses(device.zabbixHostId);
      res.json({ items: portStatuses, mode: "all" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch port status" });
    }
  });

  app.get("/api/devices/:id/power", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const deviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const device = await storage.getDevice(deviceId);
      if (!device) return res.status(404).json({ error: "Device not found" });
      if (req.user.role !== "admin" && device.customerId !== req.user.customerId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (!device.zabbixHostId) return res.json({ watts: null, amps: null, volts: null, kWh: null, allItems: [] });
      const powerData = await getZabbixPowerData(device.zabbixHostId);
      res.json(powerData);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch power data" });
    }
  });

  app.get("/api/portal/config", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const settings = await storage.getBillingSettings();
      res.json({ grafanaUrl: settings?.grafanaUrl || null });
    } catch { res.json({ grafanaUrl: null }); }
  });

  app.get("/api/services/:id/devices-info", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const allDevices = await storage.getAllDevices();
      let serviceDevices = allDevices.filter(d => d.serviceId === serviceId);
      if (req.user.role !== "admin") {
        serviceDevices = serviceDevices.filter(d => d.customerId === req.user.customerId);
      }
      const deviceInfos = await Promise.all(serviceDevices.map(async (d) => {
        const ips = await storage.getDeviceIps(d.id);
        return {
          id: d.id, name: d.name, deviceType: d.deviceType, status: d.status,
          facility: d.facility, rack: d.rack, rackPosition: d.rackPosition,
          hasZabbix: !!d.zabbixHostId,
          hasGrafana: !!(d.grafanaDashboardUid || d.grafanaPowerDashboardUid),
          grafanaDashboardUid: d.grafanaDashboardUid || null,
          grafanaPanelId: d.grafanaPanelId || null,
          grafanaOrgId: d.grafanaOrgId || null,
          grafanaVar: d.grafanaVar || null,
          grafanaUrl: d.grafanaUrl || null,
          grafanaPowerDashboardUid: d.grafanaPowerDashboardUid || null,
          grafanaPowerPanelId: d.grafanaPowerPanelId || null,
          ips: ips.map(ip => ({ ipAddress: ip.ipAddress, description: ip.description, type: ip.type, vlan: ip.vlan })),
        };
      }));
      res.json(deviceInfos);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch device info" });
    }
  });

  // Customer portal: service-scoped monitoring (resolves service → devices with Zabbix)
  app.get("/api/services/:id/port-status", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const allDevices = await storage.getAllDevices();
      let serviceDevices = allDevices.filter(d => d.serviceId === serviceId && d.zabbixHostId);
      if (req.user.role !== "admin") {
        serviceDevices = serviceDevices.filter(d => d.customerId === req.user.customerId);
      }
      if (serviceDevices.length === 0) return res.json({ items: [], mode: "none" });

      const allItems: any[] = [];
      for (const device of serviceDevices) {
        if (device.zabbixItems) {
          try {
            const configured = JSON.parse(device.zabbixItems);
            if (Array.isArray(configured) && configured.length > 0) {
              const itemIds = configured.map((i: any) => i.itemId);
              const values = await getZabbixItemValues(itemIds);
              const enriched = values.map((v: any) => {
                const cfg = configured.find((c: any) => c.itemId === v.itemId);
                return { ...v, type: cfg?.type || "other", label: cfg?.label || v.name, deviceName: device.name };
              });
              allItems.push(...enriched);
              continue;
            }
          } catch {}
        }
        const portStatuses = await getZabbixPortStatuses(device.zabbixHostId!);
        allItems.push(...portStatuses.map((p: any) => ({ ...p, deviceName: device.name })));
      }
      const hasConfiguredItems = serviceDevices.some(d => {
        try { const items = JSON.parse(d.zabbixItems || "[]"); return Array.isArray(items) && items.length > 0; } catch { return false; }
      });
      res.json({ items: allItems, mode: hasConfiguredItems ? "selected" : "all" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch port status" });
    }
  });

  app.get("/api/services/:id/power", requireAuth, requirePortalAccess, async (req: any, res) => {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const allDevices = await storage.getAllDevices();
      const serviceDevices = allDevices.filter(d => d.serviceId === serviceId && d.zabbixHostId);
      if (req.user.role !== "admin") {
        const customerDevices = serviceDevices.filter(d => d.customerId === req.user.customerId);
        if (customerDevices.length === 0) return res.json({ watts: null, amps: null, volts: null, kWh: null, allItems: [] });
        const first = customerDevices[0];
        const powerData = await getZabbixPowerData(first.zabbixHostId!);
        return res.json(powerData);
      }
      if (serviceDevices.length === 0) return res.json({ watts: null, amps: null, volts: null, kWh: null, allItems: [] });
      const powerData = await getZabbixPowerData(serviceDevices[0].zabbixHostId!);
      res.json(powerData);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch power data" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}

async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@911dc.us",
        name: "Administrator",
        role: "admin",
        companyName: "911-DC",
        active: true,
      });
      console.log("[STARTUP] Default admin user created (username: admin, password: admin123)");
    }
  } catch (error) {
    console.error("[STARTUP] Failed to seed admin user:", error);
  }
}
