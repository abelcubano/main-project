import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendDispatchEmail, verifyEmailConnection, type DispatchRequest } from "./email";
import { z } from "zod";

const dispatchRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  facility: z.string().min(1, "Facility is required"),
  urgency: z.enum(["standard", "priority", "emergency"]),
  details: z.string().min(1, "Task details are required"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  verifyEmailConnection().then((connected) => {
    if (!connected) {
      console.warn("[STARTUP] Email service not fully configured - check MAIL_PASSWORD secret");
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
