import { 
  type User, type InsertUser, type Session, 
  type Service, type InsertService,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type Customer, type InsertCustomer,
  type BillingSettings, type InsertBillingSettings,
  type Ticket, type InsertTicket,
  type TicketReply, type InsertTicketReply,
  type Device, type InsertDevice,
  type DeviceIp, type InsertDeviceIp,
  type DeviceInterface, type InsertDeviceInterface,
  type CustomerContact, type InsertCustomerContact,
  type CustomerNote, type InsertCustomerNote,
  type ContactAccessBadge, type InsertContactAccessBadge,
  type InfrastructureEquipment, type InsertInfrastructureEquipment,
  type InfrastructurePort, type InsertInfrastructurePort,
  users, sessions, services, invoices, invoiceItems, customers, billingSettings,
  tickets, ticketReplies, devices, deviceIps, deviceInterfaces,
  customerContacts, customerNotes, contactAccessBadges,
  infrastructureEquipment, infrastructurePorts
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, desc, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getUsersByCustomer(customerId: string): Promise<User[]>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
  createSession(userId: string): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<boolean>;
  deleteUserSessions(userId: string): Promise<boolean>;
  updateLastLogin(userId: string): Promise<void>;
  
  getService(id: string): Promise<Service | undefined>;
  getServicesByUser(userId: string): Promise<Service[]>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByUser(userId: string): Promise<Invoice[]>;
  getAllInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItems(invoiceId: string): Promise<boolean>;

  getBillingSettings(): Promise<BillingSettings>;
  updateBillingSettings(updates: Partial<InsertBillingSettings>): Promise<BillingSettings>;

  getAllTickets(): Promise<Ticket[]>;
  getTicketsByCustomer(customerId: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket | undefined>;
  getTicketReplies(ticketId: string): Promise<TicketReply[]>;
  createTicketReply(reply: InsertTicketReply): Promise<TicketReply>;

  getAllDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  getDevicesByCustomer(customerId: string): Promise<Device[]>;
  getChildDevices(parentId: string): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<boolean>;
  getDeviceIps(deviceId: string): Promise<DeviceIp[]>;
  createDeviceIp(ip: InsertDeviceIp): Promise<DeviceIp>;
  deleteDeviceIp(id: string): Promise<boolean>;
  getDeviceInterfaces(deviceId: string): Promise<DeviceInterface[]>;
  getDeviceInterface(id: string): Promise<DeviceInterface | undefined>;
  createDeviceInterface(iface: InsertDeviceInterface): Promise<DeviceInterface>;
  deleteDeviceInterface(id: string): Promise<boolean>;

  getCustomerContacts(customerId: string): Promise<CustomerContact[]>;
  getCustomerContact(contactId: string): Promise<CustomerContact | undefined>;
  createCustomerContact(contact: InsertCustomerContact): Promise<CustomerContact>;
  updateCustomerContact(id: string, updates: Partial<InsertCustomerContact>): Promise<CustomerContact | undefined>;
  deleteCustomerContact(id: string): Promise<boolean>;

  getCustomerNotes(customerId: string): Promise<CustomerNote[]>;
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;

  getContactAccessBadges(contactId: string): Promise<ContactAccessBadge[]>;
  getAccessBadgesByDevice(deviceId: string): Promise<ContactAccessBadge[]>;
  getAccessBadgesByFacility(facility: string): Promise<ContactAccessBadge[]>;
  createContactAccessBadge(badge: InsertContactAccessBadge): Promise<ContactAccessBadge>;
  deleteContactAccessBadge(id: string): Promise<boolean>;

  getAllEquipment(): Promise<InfrastructureEquipment[]>;
  getEquipment(id: string): Promise<InfrastructureEquipment | undefined>;
  createEquipment(data: InsertInfrastructureEquipment): Promise<InfrastructureEquipment>;
  updateEquipment(id: string, updates: Partial<InsertInfrastructureEquipment>): Promise<InfrastructureEquipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  getEquipmentPorts(equipmentId: string): Promise<InfrastructurePort[]>;
  getPort(id: string): Promise<InfrastructurePort | undefined>;
  createPort(data: InsertInfrastructurePort): Promise<InfrastructurePort>;
  bulkCreatePorts(ports: InsertInfrastructurePort[]): Promise<InfrastructurePort[]>;
  updatePort(id: string, updates: Partial<InsertInfrastructurePort>): Promise<InfrastructurePort | undefined>;
  deletePort(id: string): Promise<boolean>;
  getAvailablePorts(equipmentId?: string): Promise<InfrastructurePort[]>;
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.update(users).set({ customerId: null, customerRole: null }).where(eq(users.customerId, id));
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async getUsersByCustomer(customerId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.customerId, customerId));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async createSession(userId: string): Promise<Session> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [session] = await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    }).returning();
    
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, token)).returning();
    return result.length > 0;
  }

  async deleteUserSessions(userId: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return true;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, userId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServicesByUser(userId: string): Promise<Service[]> {
    return db.select().from(services).where(eq(services.userId, userId)).orderBy(desc(services.createdAt));
  }

  async getAllServices(): Promise<Service[]> {
    return db.select().from(services).orderBy(desc(services.createdAt));
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services).set(updates).where(eq(services.id, id)).returning();
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id)).returning();
    return result.length > 0;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.issueDate));
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.issueDate));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [created] = await db.insert(invoiceItems).values(item).returning();
    return created;
  }

  async deleteInvoiceItems(invoiceId: string): Promise<boolean> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    return true;
  }

  async getBillingSettings(): Promise<BillingSettings> {
    const rows = await db.select().from(billingSettings);
    if (rows.length > 0) return rows[0];
    const [created] = await db.insert(billingSettings).values({}).returning();
    return created;
  }

  async updateBillingSettings(updates: Partial<InsertBillingSettings>): Promise<BillingSettings> {
    const current = await this.getBillingSettings();
    const [updated] = await db.update(billingSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingSettings.id, current.id))
      .returning();
    return updated;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return db.select().from(tickets).orderBy(desc(tickets.updatedAt));
  }

  async getTicketsByCustomer(customerId: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.customerId, customerId)).orderBy(desc(tickets.updatedAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(ticket).returning();
    return created;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updated] = await db.update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    return db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId)).orderBy(ticketReplies.createdAt);
  }

  async createTicketReply(reply: InsertTicketReply): Promise<TicketReply> {
    const [created] = await db.insert(ticketReplies).values(reply).returning();
    return created;
  }

  async getAllDevices(): Promise<Device[]> {
    return db.select().from(devices).orderBy(desc(devices.updatedAt));
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async getDevicesByCustomer(customerId: string): Promise<Device[]> {
    return db.select().from(devices).where(eq(devices.customerId, customerId)).orderBy(desc(devices.updatedAt));
  }

  async getChildDevices(parentId: string): Promise<Device[]> {
    return db.select().from(devices).where(eq(devices.parentDeviceId, parentId));
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [created] = await db.insert(devices).values(device).returning();
    return created;
  }

  async updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device | undefined> {
    const [updated] = await db.update(devices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();
    return updated;
  }

  async deleteDevice(id: string): Promise<boolean> {
    await db.delete(deviceIps).where(eq(deviceIps.deviceId, id));
    await db.delete(deviceInterfaces).where(eq(deviceInterfaces.deviceId, id));
    await db.update(devices).set({ parentDeviceId: null }).where(eq(devices.parentDeviceId, id));
    const result = await db.delete(devices).where(eq(devices.id, id)).returning();
    return result.length > 0;
  }

  async getDeviceIps(deviceId: string): Promise<DeviceIp[]> {
    return db.select().from(deviceIps).where(eq(deviceIps.deviceId, deviceId));
  }

  async createDeviceIp(ip: InsertDeviceIp): Promise<DeviceIp> {
    const [created] = await db.insert(deviceIps).values(ip).returning();
    return created;
  }

  async deleteDeviceIp(id: string): Promise<boolean> {
    const result = await db.delete(deviceIps).where(eq(deviceIps.id, id)).returning();
    return result.length > 0;
  }

  async getDeviceInterfaces(deviceId: string): Promise<DeviceInterface[]> {
    return db.select().from(deviceInterfaces).where(eq(deviceInterfaces.deviceId, deviceId));
  }

  async getDeviceInterface(id: string): Promise<DeviceInterface | undefined> {
    const [iface] = await db.select().from(deviceInterfaces).where(eq(deviceInterfaces.id, id));
    return iface;
  }

  async createDeviceInterface(iface: InsertDeviceInterface): Promise<DeviceInterface> {
    const [created] = await db.insert(deviceInterfaces).values(iface).returning();
    return created;
  }

  async deleteDeviceInterface(id: string): Promise<boolean> {
    const result = await db.delete(deviceInterfaces).where(eq(deviceInterfaces.id, id)).returning();
    return result.length > 0;
  }

  async getCustomerContacts(customerId: string): Promise<CustomerContact[]> {
    return db.select().from(customerContacts).where(eq(customerContacts.customerId, customerId));
  }

  async getCustomerContact(contactId: string): Promise<CustomerContact | undefined> {
    const [contact] = await db.select().from(customerContacts).where(eq(customerContacts.id, contactId));
    return contact;
  }

  async createCustomerContact(contact: InsertCustomerContact): Promise<CustomerContact> {
    const [created] = await db.insert(customerContacts).values(contact).returning();
    return created;
  }

  async updateCustomerContact(id: string, updates: Partial<InsertCustomerContact>): Promise<CustomerContact | undefined> {
    const [updated] = await db.update(customerContacts).set(updates).where(eq(customerContacts.id, id)).returning();
    return updated;
  }

  async deleteCustomerContact(id: string): Promise<boolean> {
    const result = await db.delete(customerContacts).where(eq(customerContacts.id, id)).returning();
    return result.length > 0;
  }

  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    return db.select().from(customerNotes).where(eq(customerNotes.customerId, customerId)).orderBy(desc(customerNotes.createdAt));
  }

  async createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote> {
    const [created] = await db.insert(customerNotes).values(note).returning();
    return created;
  }

  async getContactAccessBadges(contactId: string): Promise<ContactAccessBadge[]> {
    return db.select().from(contactAccessBadges).where(eq(contactAccessBadges.contactId, contactId));
  }

  async getAccessBadgesByDevice(deviceId: string): Promise<ContactAccessBadge[]> {
    return db.select().from(contactAccessBadges).where(eq(contactAccessBadges.deviceId, deviceId));
  }

  async getAccessBadgesByFacility(facility: string): Promise<ContactAccessBadge[]> {
    return db.select().from(contactAccessBadges).where(eq(contactAccessBadges.facility, facility));
  }

  async createContactAccessBadge(badge: InsertContactAccessBadge): Promise<ContactAccessBadge> {
    const [created] = await db.insert(contactAccessBadges).values(badge).returning();
    return created;
  }

  async deleteContactAccessBadge(id: string): Promise<boolean> {
    const result = await db.delete(contactAccessBadges).where(eq(contactAccessBadges.id, id)).returning();
    return result.length > 0;
  }

  async getAllEquipment(): Promise<InfrastructureEquipment[]> {
    return db.select().from(infrastructureEquipment).orderBy(desc(infrastructureEquipment.createdAt));
  }

  async getEquipment(id: string): Promise<InfrastructureEquipment | undefined> {
    const [eq_] = await db.select().from(infrastructureEquipment).where(eq(infrastructureEquipment.id, id));
    return eq_;
  }

  async createEquipment(data: InsertInfrastructureEquipment): Promise<InfrastructureEquipment> {
    const [created] = await db.insert(infrastructureEquipment).values(data).returning();
    return created;
  }

  async updateEquipment(id: string, updates: Partial<InsertInfrastructureEquipment>): Promise<InfrastructureEquipment | undefined> {
    const [updated] = await db.update(infrastructureEquipment).set(updates).where(eq(infrastructureEquipment.id, id)).returning();
    return updated;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    await db.delete(infrastructurePorts).where(eq(infrastructurePorts.equipmentId, id));
    const result = await db.delete(infrastructureEquipment).where(eq(infrastructureEquipment.id, id)).returning();
    return result.length > 0;
  }

  async getEquipmentPorts(equipmentId: string): Promise<InfrastructurePort[]> {
    return db.select().from(infrastructurePorts).where(eq(infrastructurePorts.equipmentId, equipmentId));
  }

  async getPort(id: string): Promise<InfrastructurePort | undefined> {
    const [port] = await db.select().from(infrastructurePorts).where(eq(infrastructurePorts.id, id));
    return port;
  }

  async createPort(data: InsertInfrastructurePort): Promise<InfrastructurePort> {
    const [created] = await db.insert(infrastructurePorts).values(data).returning();
    return created;
  }

  async bulkCreatePorts(ports: InsertInfrastructurePort[]): Promise<InfrastructurePort[]> {
    if (ports.length === 0) return [];
    return db.insert(infrastructurePorts).values(ports).returning();
  }

  async updatePort(id: string, updates: Partial<InsertInfrastructurePort>): Promise<InfrastructurePort | undefined> {
    const [updated] = await db.update(infrastructurePorts).set(updates).where(eq(infrastructurePorts.id, id)).returning();
    return updated;
  }

  async deletePort(id: string): Promise<boolean> {
    const result = await db.delete(infrastructurePorts).where(eq(infrastructurePorts.id, id)).returning();
    return result.length > 0;
  }

  async getAvailablePorts(equipmentId?: string): Promise<InfrastructurePort[]> {
    if (equipmentId) {
      return db.select().from(infrastructurePorts).where(
        and(eq(infrastructurePorts.equipmentId, equipmentId), eq(infrastructurePorts.status, "available"))
      );
    }
    return db.select().from(infrastructurePorts).where(eq(infrastructurePorts.status, "available"));
  }
}

export const storage = new DatabaseStorage();
