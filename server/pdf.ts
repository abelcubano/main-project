import PDFDocument from "pdfkit";
import type { Invoice, InvoiceItem, Customer } from "@shared/schema";

interface PdfInvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer | null;
  userName: string;
}

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
}

export function generateInvoicePdf(data: PdfInvoiceData): PDFKit.PDFDocument {
  const { invoice, items, customer, userName } = data;
  const doc = new PDFDocument({ size: "LETTER", margin: 50 });

  // Header - Company branding
  doc.fillColor("#1e3a5f").fontSize(22).font("Helvetica-Bold").text("911-DC", 50, 50);
  doc.fillColor("#64748b").fontSize(8).font("Helvetica")
    .text("Datacenter Operations & SmartHands Services", 50, 75)
    .text("100 NE 2nd St, Miami, FL 33138", 50, 86)
    .text("info@911dc.us  |  www.911dc.us", 50, 97);

  // Invoice title
  doc.fillColor("#1e3a5f").fontSize(28).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });

  // Invoice details box
  const detailsY = 85;
  doc.fillColor("#64748b").fontSize(8).font("Helvetica");
  doc.text("Invoice #:", 400, detailsY, { align: "right" });
  doc.text("Issue Date:", 400, detailsY + 12, { align: "right" });
  doc.text("Due Date:", 400, detailsY + 24, { align: "right" });
  doc.text("Status:", 400, detailsY + 36, { align: "right" });

  doc.fillColor("#1e293b").fontSize(8).font("Helvetica-Bold");
  doc.text(invoice.invoiceNumber, 460, detailsY);
  doc.text(new Date(invoice.issueDate).toLocaleDateString("en-US"), 460, detailsY + 12);
  doc.text(new Date(invoice.dueDate).toLocaleDateString("en-US"), 460, detailsY + 24);

  const statusColor = invoice.status === "paid" ? "#16a34a" : invoice.status === "overdue" ? "#dc2626" : "#f59e0b";
  doc.fillColor(statusColor).text(invoice.status.toUpperCase(), 460, detailsY + 36);

  drawLine(doc, 130);

  // Bill To section
  doc.fillColor("#64748b").fontSize(8).font("Helvetica-Bold").text("BILL TO", 50, 145);
  doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold")
    .text(customer?.name || userName, 50, 160);
  doc.fillColor("#475569").fontSize(8).font("Helvetica");
  let billY = 174;
  if (customer?.contactName) {
    doc.text(`Attn: ${customer.contactName}`, 50, billY);
    billY += 12;
  }
  if (customer?.address) {
    doc.text(customer.address, 50, billY);
    billY += 12;
  }
  if (customer?.city || customer?.state || customer?.zip) {
    doc.text(`${customer?.city || ""}${customer?.city && customer?.state ? ", " : ""}${customer?.state || ""} ${customer?.zip || ""}`.trim(), 50, billY);
    billY += 12;
  }
  if (customer?.email) {
    doc.text(customer.email, 50, billY);
    billY += 12;
  }
  if (customer?.phone) {
    doc.text(customer.phone, 50, billY);
    billY += 12;
  }

  // Items table header
  const tableTop = Math.max(billY + 20, 240);
  doc.fillColor("#f1f5f9").rect(50, tableTop, 495, 20).fill();
  doc.fillColor("#475569").fontSize(7).font("Helvetica-Bold");
  doc.text("DESCRIPTION", 55, tableTop + 6);
  doc.text("QTY", 340, tableTop + 6, { width: 40, align: "center" });
  doc.text("UNIT PRICE", 385, tableTop + 6, { width: 70, align: "right" });
  doc.text("TOTAL", 460, tableTop + 6, { width: 80, align: "right" });

  drawLine(doc, tableTop + 20);

  // Items rows
  let rowY = tableTop + 26;
  for (const item of items) {
    if (rowY > 680) {
      doc.addPage();
      rowY = 50;
    }

    doc.fillColor("#1e293b").fontSize(8).font("Helvetica");
    doc.text(item.description, 55, rowY, { width: 280 });
    doc.text(String(item.quantity), 340, rowY, { width: 40, align: "center" });
    doc.text(`$${Number(item.unitPrice).toFixed(2)}`, 385, rowY, { width: 70, align: "right" });
    doc.text(`$${Number(item.total).toFixed(2)}`, 460, rowY, { width: 80, align: "right" });

    rowY += 18;
    drawLine(doc, rowY - 4);
  }

  // Totals
  const totalsY = rowY + 10;
  doc.fillColor("#64748b").fontSize(8).font("Helvetica");
  doc.text("Subtotal:", 385, totalsY, { width: 70, align: "right" });
  doc.fillColor("#1e293b").font("Helvetica").text(`$${Number(invoice.subtotal).toFixed(2)}`, 460, totalsY, { width: 80, align: "right" });

  if (Number(invoice.tax) > 0) {
    doc.fillColor("#64748b").font("Helvetica").text("Tax:", 385, totalsY + 14, { width: 70, align: "right" });
    doc.fillColor("#1e293b").font("Helvetica").text(`$${Number(invoice.tax).toFixed(2)}`, 460, totalsY + 14, { width: 80, align: "right" });
  }

  const totalLineY = Number(invoice.tax) > 0 ? totalsY + 28 : totalsY + 14;
  drawLine(doc, totalLineY);
  doc.fillColor("#1e3a5f").fontSize(11).font("Helvetica-Bold")
    .text("Total Due:", 385, totalLineY + 6, { width: 70, align: "right" });
  doc.text(`$${Number(invoice.total).toFixed(2)}`, 460, totalLineY + 6, { width: 80, align: "right" });

  // Payment terms footer
  const footerY = Math.min(totalLineY + 50, 700);
  drawLine(doc, footerY);
  doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("PAYMENT TERMS", 50, footerY + 8);
  doc.fillColor("#475569").fontSize(7).font("Helvetica")
    .text("Payment is due within 30 days of the invoice date. Please reference the invoice number when making payment.", 50, footerY + 20)
    .text("For questions about this invoice, please contact billing@911dc.us", 50, footerY + 32);

  doc.fillColor("#94a3b8").fontSize(6).font("Helvetica")
    .text("911-DC  |  Datacenter Operations & SmartHands Services  |  Miami, FL", 50, 740, { align: "center" });

  doc.end();
  return doc;
}
