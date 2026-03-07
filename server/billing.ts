import { storage } from "./storage";
import { sendInvoiceEmail } from "./email";
import type { Customer, Service, Invoice, BillingSettings } from "@shared/schema";
import { canReceiveInvoices } from "./permissions";

async function generateInvoiceNumber(date: Date, settings: BillingSettings): Promise<string> {
  const prefix = settings.invoicePrefix || "INV";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const seq = String(settings.nextInvoiceNumber).padStart(4, "0");
  await storage.updateBillingSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
  return `${prefix}-${y}${m}-${seq}`;
}

interface BillingResult {
  generated: number;
  skipped: number;
  errors: string[];
  invoices: Invoice[];
}

export async function runMonthlyBilling(billingDate?: Date): Promise<BillingResult> {
  const now = billingDate || new Date();
  const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const result: BillingResult = { generated: 0, skipped: 0, errors: [], invoices: [] };

  const billingSettings = await storage.getBillingSettings();
  const allCustomers = await storage.getAllCustomers();
  const allServices = await storage.getAllServices();
  const existingInvoices = await storage.getAllInvoices();

  const existingPeriods = new Set(
    existingInvoices
      .map((inv) => {
        const num = inv.invoiceNumber;
        const match = num.match(/^[A-Za-z]+-(\d{6})-/);
        if (match) {
          const invMonth = `${match[1].substring(0, 4)}-${match[1].substring(4, 6)}`;
          return `${inv.userId}:${invMonth}`;
        }
        return null;
      })
      .filter(Boolean)
  );

  for (const customer of allCustomers) {
    if (!customer.active) continue;

    const customerUsers = await storage.getUsersByCustomer(customer.id);
    if (customerUsers.length === 0) continue;

    const primaryUser = customerUsers[0];

    const customerServiceList = allServices.filter(
      (s) => s.status === "active" && customerUsers.some((u) => u.id === s.userId)
    );

    if (customerServiceList.length === 0) {
      result.skipped++;
      continue;
    }

    const periodKey = `${primaryUser.id}:${billingMonth}`;
    if (existingPeriods.has(periodKey)) {
      result.skipped++;
      continue;
    }

    try {
      const subtotal = customerServiceList.reduce((sum, s) => sum + Number(s.monthlyPrice), 0);
      const tax = 0;
      const total = subtotal + tax;

      const issueDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const invoiceNumber = await generateInvoiceNumber(issueDate, billingSettings);
      billingSettings.nextInvoiceNumber++;

      const invoice = await storage.createInvoice({
        userId: primaryUser.id,
        invoiceNumber,
        status: "draft",
        issueDate,
        dueDate,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      });

      for (const svc of customerServiceList) {
        const soRef = svc.serviceOrder ? ` [SO: ${svc.serviceOrder}]` : "";
        await storage.createInvoiceItem({
          invoiceId: invoice.id,
          serviceId: svc.id,
          description: `${svc.name} - ${svc.type} (${svc.location})${soRef}`,
          quantity: 1,
          unitPrice: svc.monthlyPrice,
          total: svc.monthlyPrice,
        });
      }

      result.invoices.push(invoice);
      result.generated++;

    } catch (err: any) {
      result.errors.push(`Failed for ${customer.name}: ${err.message}`);
    }
  }

  console.log(`[BILLING] Cycle complete: ${result.generated} invoices generated, ${result.skipped} skipped, ${result.errors.length} errors`);
  return result;
}
