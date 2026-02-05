import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendDispatchEmail, verifyEmailConnection, type DispatchRequest } from "./email";
import { z } from "zod";
import bcrypt from "bcrypt";
import { loginSchema, insertUserSchema } from "@shared/schema";

const dispatchRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  facility: z.string().min(1, "Facility is required"),
  urgency: z.enum(["standard", "priority", "emergency"]),
  details: z.string().min(1, "Task details are required"),
});


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
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
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
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        companyName: u.companyName,
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
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
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
      if (req.body.role) updates.role = req.body.role;
      if (typeof req.body.active === "boolean") updates.active = req.body.active;
      
      if (req.body.password) {
        updates.password = await bcrypt.hash(req.body.password, 10);
      }

      const userId = Array.isArray(id) ? id[0] : id;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
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
