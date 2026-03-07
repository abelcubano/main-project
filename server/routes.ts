import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendDispatchEmail, sendInvoiceEmail, sendInvitationEmail, verifyEmailConnection, type DispatchRequest } from "./email";
import { generateInvoicePdf } from "./pdf";
import { runMonthlyBilling } from "./billing";
import { z } from "zod";
import bcrypt from "bcrypt";
import { loginSchema, insertUserSchema, insertServiceSchema, insertInvoiceSchema, insertCustomerSchema, PERMISSION_FIELDS } from "@shared/schema";
import { getPduPortStatus, rebootPduPort } from "./snmp";
import { canViewBilling, canViewServices, canViewTechnical, canManageTechnical, canViewSupport, canCreateSupport, canSubmitSmarthands, canMakePayments, canAccessPortal } from "./permissions";

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
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    customerId: user.customerId,
    customerRole: user.customerRole,
    ...extractUserPermissions(user),
  };
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  verifyEmailConnection().then((connected) => {
    if (!connected) {
      console.warn("[STARTUP] Email service not fully configured - check MAIL_PASSWORD secret");
    }
  });

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

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
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

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
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

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
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

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/services", requireAuth, requireAdmin, async (req, res) => {
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

  app.put("/api/admin/services/:id", requireAuth, requireAdmin, async (req, res) => {
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

  app.delete("/api/admin/services/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/billing/run", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await runMonthlyBilling();
      res.json(result);
    } catch (error: any) {
      console.error("[BILLING] Run billing error:", error);
      res.status(500).json({ error: "Failed to run billing cycle" });
    }
  });

  // Billing settings
  app.get("/api/admin/billing-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getBillingSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("[ADMIN] Get billing settings error:", error);
      res.status(500).json({ error: "Failed to fetch billing settings" });
    }
  });

  app.put("/api/admin/billing-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateBillingSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("[ADMIN] Update billing settings error:", error);
      res.status(500).json({ error: "Failed to update billing settings" });
    }
  });

  // Approve invoice (draft -> pending)
  app.post("/api/admin/invoices/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const invoice = await storage.getInvoice(id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      if (invoice.status !== "draft") return res.status(400).json({ error: "Only draft invoices can be approved" });
      const updated = await storage.updateInvoice(id, { status: "pending" });

      try {
        const customer = await storage.getCustomer(invoice.customerId);
        if (customer) {
          const billingSettings = await storage.getBillingSettings();
          const allUsers = await storage.getUsers();
          const customerUsers = allUsers.filter(u => u.customerId === customer.id && u.permBillingReceiveInvoices && u.email);
          const items = await storage.getInvoiceItems(id);
          for (const recipient of customerUsers) {
            await sendInvoiceEmail(
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
              }
            );
          }
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
  app.post("/api/admin/users/:id/send-invitation", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/invoices", requireAuth, requireAdmin, async (req, res) => {
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

  app.put("/api/admin/invoices/:id", requireAuth, requireAdmin, async (req, res) => {
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

  app.delete("/api/admin/invoices/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.get("/api/admin/customer-users", requireAuth, requireAdmin, async (req, res) => {
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
  app.get("/api/admin/customers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allCustomers = await storage.getAllCustomers();
      res.json(allCustomers);
    } catch (error: any) {
      console.error("[ADMIN] Get customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/customers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const customerUsers = await storage.getUsersByCustomer(customerId);
      res.json({ ...customer, users: customerUsers.map(u => ({ ...sanitizeUser(u), active: u.active })) });
    } catch (error: any) {
      console.error("[ADMIN] Get customer error:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/admin/customers", requireAuth, requireAdmin, async (req, res) => {
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

  app.put("/api/admin/customers/:id", requireAuth, requireAdmin, async (req, res) => {
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

  app.delete("/api/admin/customers/:id", requireAuth, requireAdmin, async (req, res) => {
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
  app.post("/api/admin/customers/:id/users", requireAuth, requireAdmin, async (req, res) => {
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

  app.put("/api/admin/customers/:customerId/users/:userId", requireAuth, requireAdmin, async (req, res) => {
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

  app.delete("/api/admin/customers/:customerId/users/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      await storage.updateUser(userId, { customerId: null, customerRole: null } as any);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Remove customer user error:", error);
      res.status(500).json({ error: "Failed to remove user from customer" });
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
