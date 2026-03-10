import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { storage } from "./storage";
import { sendTicketNotificationEmail } from "./email";
import { db } from "./db";
import { processedEmails } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { BillingSettings } from "@shared/schema";

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

function log(message: string) {
  console.log(`[IMAP] ${message}`);
}

async function getImapConfig(): Promise<{ host: string; port: number; user: string; password: string; secure: boolean } | null> {
  try {
    const settings = await storage.getBillingSettings();
    if (!settings?.imapHost || !settings?.imapUser || !settings?.imapPassword) return null;
    return {
      host: settings.imapHost,
      port: settings.imapPort || 993,
      user: settings.imapUser,
      password: settings.imapPassword,
      secure: settings.imapSecure ?? true,
    };
  } catch {
    return null;
  }
}

function extractTicketNumber(subject: string): number | null {
  const match = subject.match(/\[(?:Ticket|New Ticket)\s*#(\d+)\]/i);
  return match ? parseInt(match[1]) : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanReplyBody(body: string): string {
  const lines = body.split("\n");
  const cleanedLines: string[] = [];
  for (const line of lines) {
    if (line.match(/^On\s+.+wrote:\s*$/i)) break;
    if (line.match(/^-{3,}.*Original Message.*-{3,}$/i)) break;
    if (line.match(/^>{2,}/)) break;
    if (line.match(/^From:\s+/i) && cleanedLines.length > 2) break;
    cleanedLines.push(line);
  }
  return cleanedLines.join("\n").trim();
}

async function findActiveUserByEmail(email: string) {
  const allUsers = await storage.getAllUsers();
  return allUsers.find(u =>
    u.email?.toLowerCase() === email.toLowerCase() &&
    u.active !== false
  );
}

async function isAlreadyProcessed(messageId: string): Promise<boolean> {
  const existing = await db.select().from(processedEmails).where(eq(processedEmails.messageId, messageId));
  return existing.length > 0;
}

async function markProcessed(messageId: string) {
  await db.insert(processedEmails).values({ messageId }).onConflictDoNothing();
}

function canUserAccessTicket(user: any, ticket: any): boolean {
  if (user.role === "admin") return true;
  if (ticket.customerId && user.customerId === ticket.customerId) return true;
  if (!ticket.customerId && ticket.userId === user.id) return true;
  return false;
}

async function processEmail(parsed: any, settings: BillingSettings) {
  const fromAddress = parsed.from?.value?.[0]?.address?.toLowerCase();
  const subject = parsed.subject || "(No Subject)";
  const textBody = parsed.text || (parsed.html ? stripHtml(parsed.html) : "");
  const messageId = parsed.messageId;

  if (!fromAddress) {
    log("Skipping email with no from address");
    return;
  }

  if (messageId && await isAlreadyProcessed(messageId)) {
    log(`Skipping already-processed email: ${messageId}`);
    return;
  }

  const supportEmail = settings.supportEmailAddress?.toLowerCase() || settings.imapUser?.toLowerCase();
  if (fromAddress === supportEmail) {
    log(`Skipping email from own support address: ${fromAddress}`);
    if (messageId) await markProcessed(messageId);
    return;
  }

  const ticketNum = extractTicketNumber(subject);

  if (ticketNum) {
    const tickets = await storage.getAllTickets();
    const ticket = tickets.find(t => t.ticketNumber === ticketNum);
    if (ticket) {
      const user = await findActiveUserByEmail(fromAddress);
      if (!user) {
        log(`Reply from unknown/inactive email ${fromAddress} for ticket #${ticketNum} — skipping`);
        if (messageId) await markProcessed(messageId);
        return;
      }

      if (!canUserAccessTicket(user, ticket)) {
        log(`User ${fromAddress} not authorized for ticket #${ticketNum} — skipping`);
        if (messageId) await markProcessed(messageId);
        return;
      }

      const replyBody = cleanReplyBody(textBody);
      if (!replyBody.trim()) {
        log(`Empty reply body for ticket #${ticketNum} from ${fromAddress} — skipping`);
        if (messageId) await markProcessed(messageId);
        return;
      }

      await storage.createTicketReply({
        ticketId: ticket.id,
        userId: user.id,
        body: replyBody,
        isInternal: false,
      });

      if (messageId) await markProcessed(messageId);

      if (ticket.status === "resolved" || ticket.status === "closed") {
        await storage.updateTicket(ticket.id, { status: "in_progress" });
      }
      log(`Added reply to ticket #${ticketNum} from ${fromAddress}`);

      try {
        if (user.role === "admin") {
          const allUsers = await storage.getAllUsers();
          const customerUsers = allUsers.filter(u => u.customerId === ticket.customerId && u.permSupportView);
          const customer = ticket.customerId ? await storage.getCustomer(ticket.customerId) : null;
          for (const cu of customerUsers) {
            if (cu.email) {
              await sendTicketNotificationEmail({
                recipientEmail: cu.email,
                ticketNumber: ticket.ticketNumber,
                subject: ticket.subject,
                replyBody,
                replyAuthor: user.name || "Support",
                customerName: customer?.name || "Customer",
                isNewTicket: false,
              }, settings);
            }
          }
        } else {
          const targetEmail = ticket.assignedTo
            ? (await storage.getUser(ticket.assignedTo))?.email
            : settings.supportEmailAddress;
          if (targetEmail) {
            const customer = ticket.customerId ? await storage.getCustomer(ticket.customerId) : null;
            await sendTicketNotificationEmail({
              recipientEmail: targetEmail,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              replyBody,
              replyAuthor: user.name || fromAddress,
              customerName: customer?.name || "Unknown",
              isNewTicket: false,
            }, settings);
          }
        }
      } catch (err: any) {
        log(`Email notification error for reply: ${err.message}`);
      }

      return;
    }
  }

  const user = await findActiveUserByEmail(fromAddress);
  if (!user) {
    log(`Email from unknown/inactive address ${fromAddress}: "${subject}" — skipping`);
    if (messageId) await markProcessed(messageId);
    return;
  }

  const body = cleanReplyBody(textBody);
  if (!body.trim()) {
    log(`Empty body from ${fromAddress}: "${subject}" — skipping`);
    if (messageId) await markProcessed(messageId);
    return;
  }

  const cleanSubject = subject
    .replace(/^(Re|Fwd|Fw):\s*/gi, "")
    .replace(/\[(?:Ticket|New Ticket)\s*#\d+\]\s*/gi, "")
    .trim() || "(No Subject)";

  const ticket = await storage.createTicket({
    userId: user.id,
    customerId: user.customerId || null,
    subject: cleanSubject,
    body,
    category: "support",
    priority: "normal",
  });

  if (messageId) await markProcessed(messageId);

  log(`Created ticket #${ticket.ticketNumber} from ${fromAddress}: "${cleanSubject}"`);

  try {
    const supportAddr = settings.supportEmailAddress || "info@911dc.us";
    const customer = user.customerId ? await storage.getCustomer(user.customerId) : null;
    await sendTicketNotificationEmail({
      recipientEmail: supportAddr,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      replyBody: body,
      replyAuthor: user.name || fromAddress,
      customerName: customer?.name || user.companyName || "Unknown",
      isNewTicket: true,
    }, settings);
  } catch (err: any) {
    log(`Email notification error for new ticket: ${err.message}`);
  }
}

async function pollMailbox() {
  if (isPolling) return;
  isPolling = true;

  try {
    const config = await getImapConfig();
    if (!config) {
      return;
    }

    const settings = await storage.getBillingSettings();

    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
      logger: false,
    });

    await client.connect();
    log(`Connected to ${config.host}`);

    const lock = await client.getMailboxLock("INBOX");
    try {
      const unseen = await client.search({ seen: false });
      if (unseen.length === 0) {
        log("No new emails");
      } else {
        log(`Found ${unseen.length} unseen email(s)`);
        for (const uid of unseen) {
          try {
            const msg = await client.fetchOne(uid, { source: true });
            if (msg?.source) {
              const parsed = await simpleParser(msg.source);
              await processEmail(parsed, settings);
            }
            await client.messageFlagsAdd(uid, ["\\Seen"]);
          } catch (msgErr: any) {
            log(`Error processing message ${uid}: ${msgErr.message}`);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error: any) {
    log(`Poll error: ${error.message}`);
  } finally {
    isPolling = false;
  }
}

export function startImapPoller(intervalMs: number = 60000) {
  if (pollingInterval) {
    log("Poller already running");
    return;
  }

  log(`Starting email poller (every ${intervalMs / 1000}s)`);

  pollMailbox();

  pollingInterval = setInterval(pollMailbox, intervalMs);
}

export function stopImapPoller() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    log("Poller stopped");
  }
}

export { pollMailbox };
