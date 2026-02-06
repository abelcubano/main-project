import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.titan.email",
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.MAIL_USER || "abel.monzon@911dc.us",
    pass: process.env.MAIL_PASSWORD,
  },
});

export interface DispatchRequest {
  name: string;
  company: string;
  email: string;
  phone?: string;
  facility: string;
  urgency: "standard" | "priority" | "emergency";
  details: string;
}

const urgencyLabels: Record<string, string> = {
  standard: "Standard (Next Day)",
  priority: "Priority (4-8 Hours)",
  emergency: "EMERGENCY (Under 2 Hours)",
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

export async function sendDispatchEmail(request: DispatchRequest): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.MAIL_FROM || "abel.monzon@911dc.us";
  const toAddress = process.env.MAIL_TO || "info@911dc.us";

  const urgencyEmoji = request.urgency === "emergency" ? "🚨" : request.urgency === "priority" ? "⚡" : "📋";
  const urgencyLabel = urgencyLabels[request.urgency] || request.urgency;

  const safeName = escapeHtml(request.name);
  const safeCompany = escapeHtml(request.company);
  const safeEmail = escapeHtml(request.email);
  const safePhone = request.phone ? escapeHtml(request.phone) : "";
  const safeFacility = escapeHtml(request.facility);
  const safeDetails = escapeHtml(request.details);

  const subject = `${urgencyEmoji} Smart Hands Request: ${safeFacility} - ${safeCompany}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e3a5f; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 0.05em; }
    .field-value { font-size: 15px; color: #1e293b; }
    .urgency-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase; }
    .urgency-emergency { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .urgency-priority { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .urgency-standard { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .details-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 8px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${urgencyEmoji} New Smart Hands Dispatch Request</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Urgency Level</div>
        <span class="urgency-badge urgency-${request.urgency}">${urgencyLabel}</span>
      </div>
      
      <div class="field">
        <div class="field-label">Contact Name</div>
        <div class="field-value">${safeName}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Company</div>
        <div class="field-value">${safeCompany}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
      </div>
      
      ${safePhone ? `
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value"><a href="tel:${safePhone}">${safePhone}</a></div>
      </div>
      ` : ""}
      
      <div class="field">
        <div class="field-label">Facility Location</div>
        <div class="field-value">${safeFacility}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Task Details</div>
        <div class="details-box">${safeDetails.replace(/\n/g, "<br>")}</div>
      </div>
      
      <div class="footer">
        This dispatch request was submitted via the South Florida Smart Hands website.<br>
        Submitted at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
NEW SMART HANDS DISPATCH REQUEST
${urgencyEmoji} ${urgencyLabel}
================================

Contact: ${request.name}
Company: ${request.company}
Email: ${request.email}
${request.phone ? `Phone: ${request.phone}` : ""}
Facility: ${request.facility}

TASK DETAILS:
${request.details}

================================
Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST
  `;

  try {
    await transporter.sendMail({
      from: `"SF Smart Hands" <${fromAddress}>`,
      to: toAddress,
      replyTo: request.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[EMAIL] Dispatch request sent successfully for ${request.company} - ${request.facility}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send dispatch email:`, error.message);
    return { success: false, error: error.message };
  }
}

export interface InvoiceEmailData {
  customerName: string;
  contactName: string;
  email: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  issueDate: string;
  itemCount: number;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: string }> {
  const fromAddress = process.env.MAIL_FROM || "abel.monzon@911dc.us";

  const safeName = escapeHtml(data.contactName);
  const safeCompany = escapeHtml(data.customerName);

  const subject = `Invoice ${data.invoiceNumber} - 911-DC`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e3a5f; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .amount { font-size: 28px; font-weight: bold; color: #1e3a5f; margin: 16px 0; }
    .detail { margin-bottom: 8px; font-size: 14px; color: #475569; }
    .detail strong { color: #1e293b; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Invoice from 911-DC</h1>
    </div>
    <div class="content">
      <p>Hello ${safeName},</p>
      <p>A new invoice has been generated for <strong>${safeCompany}</strong>.</p>
      
      <div class="amount">$${data.total}</div>
      
      <div class="detail"><strong>Invoice #:</strong> ${escapeHtml(data.invoiceNumber)}</div>
      <div class="detail"><strong>Issue Date:</strong> ${escapeHtml(data.issueDate)}</div>
      <div class="detail"><strong>Due Date:</strong> ${escapeHtml(data.dueDate)}</div>
      <div class="detail"><strong>Items:</strong> ${data.itemCount} service(s)</div>
      
      <p style="margin-top: 20px;">Please review your invoice and arrange payment by the due date. For questions, contact billing@911dc.us.</p>
      
      <div class="footer">
        911-DC | Datacenter Operations & SmartHands Services | Miami, FL<br>
        This is an automated notification.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
NEW INVOICE FROM 911-DC
=======================

Hello ${data.contactName},

A new invoice has been generated for ${data.customerName}.

Amount: $${data.total}
Invoice #: ${data.invoiceNumber}
Issue Date: ${data.issueDate}
Due Date: ${data.dueDate}
Items: ${data.itemCount} service(s)

Please review your invoice and arrange payment by the due date.
For questions, contact billing@911dc.us.

911-DC | Datacenter Operations & SmartHands Services | Miami, FL
  `;

  try {
    await transporter.sendMail({
      from: `"911-DC Billing" <${fromAddress}>`,
      to: data.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[EMAIL] Invoice notification sent to ${data.email} for ${data.invoiceNumber}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send invoice email:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("[EMAIL] SMTP connection verified successfully");
    return true;
  } catch (error: any) {
    console.error("[EMAIL ERROR] SMTP connection failed:", error.message);
    return false;
  }
}
