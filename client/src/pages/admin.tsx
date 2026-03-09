import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Cable,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Globe,
  HardHat,
  Hash,
  Headset,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  Monitor,
  Network,
  Plus,
  Send,
  Server,
  Settings,
  Shield,
  StickyNote,
  Ticket,
  Trash2,
  Save,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { AdminLayout, type AdminSection, type SidebarGroup } from "@/components/admin/AdminLayout";
import { AdminCard, KpiRow } from "@/components/admin/AdminCard";
import { AdminTable, type ColumnDef } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

type PermissionKeys = {
  permPortalAccess: boolean;
  permBillingView: boolean;
  permBillingReceiveInvoices: boolean;
  permBillingMakePayments: boolean;
  permServicesView: boolean;
  permServicesManage: boolean;
  permTechnicalView: boolean;
  permTechnicalManage: boolean;
  permSupportView: boolean;
  permSupportCreate: boolean;
  permSupportSmarthands: boolean;
  permNotifyMaintenance: boolean;
  permNotifyBilling: boolean;
  permNotifyIncidents: boolean;
  permAdminUsers: boolean;
};

const PERMISSION_GROUPS: { label: string; keys: { key: keyof PermissionKeys; label: string }[] }[] = [
  { label: "Portal Access", keys: [{ key: "permPortalAccess", label: "Can log into portal" }] },
  { label: "Billing & Financial", keys: [
    { key: "permBillingView", label: "View invoices" },
    { key: "permBillingReceiveInvoices", label: "Receive invoice emails" },
    { key: "permBillingMakePayments", label: "Make payments" },
  ]},
  { label: "Services", keys: [
    { key: "permServicesView", label: "View services" },
    { key: "permServicesManage", label: "Manage services" },
  ]},
  { label: "Technical", keys: [
    { key: "permTechnicalView", label: "View technical details" },
    { key: "permTechnicalManage", label: "PDU reboot / manage" },
  ]},
  { label: "Support", keys: [
    { key: "permSupportView", label: "View tickets" },
    { key: "permSupportCreate", label: "Create tickets" },
    { key: "permSupportSmarthands", label: "SmartHands requests" },
  ]},
  { label: "Notifications", keys: [
    { key: "permNotifyMaintenance", label: "Maintenance notices" },
    { key: "permNotifyBilling", label: "Billing notices" },
    { key: "permNotifyIncidents", label: "Incident notices" },
  ]},
  { label: "Admin", keys: [{ key: "permAdminUsers", label: "Manage users" }] },
];

const DEFAULT_PERMS: PermissionKeys = {
  permPortalAccess: true, permBillingView: false, permBillingReceiveInvoices: false,
  permBillingMakePayments: false, permServicesView: false, permServicesManage: false,
  permTechnicalView: false, permTechnicalManage: false, permSupportView: false,
  permSupportCreate: false, permSupportSmarthands: false, permNotifyMaintenance: false,
  permNotifyBilling: false, permNotifyIncidents: false, permAdminUsers: false,
};

const ROLE_TEMPLATES: { value: string; label: string; perms: PermissionKeys }[] = [
  { value: "custom", label: "Custom", perms: DEFAULT_PERMS },
  { value: "account_admin", label: "Account Admin (all)", perms: {
    permPortalAccess: true, permBillingView: true, permBillingReceiveInvoices: true,
    permBillingMakePayments: true, permServicesView: true, permServicesManage: true,
    permTechnicalView: true, permTechnicalManage: true, permSupportView: true,
    permSupportCreate: true, permSupportSmarthands: true, permNotifyMaintenance: true,
    permNotifyBilling: true, permNotifyIncidents: true, permAdminUsers: true,
  }},
  { value: "manager", label: "Manager (billing+services+support)", perms: {
    permPortalAccess: true, permBillingView: true, permBillingReceiveInvoices: true,
    permBillingMakePayments: true, permServicesView: true, permServicesManage: false,
    permTechnicalView: false, permTechnicalManage: false, permSupportView: true,
    permSupportCreate: true, permSupportSmarthands: false, permNotifyMaintenance: true,
    permNotifyBilling: true, permNotifyIncidents: true, permAdminUsers: false,
  }},
  { value: "technician", label: "Technician (technical+support)", perms: {
    permPortalAccess: true, permBillingView: false, permBillingReceiveInvoices: false,
    permBillingMakePayments: false, permServicesView: true, permServicesManage: false,
    permTechnicalView: true, permTechnicalManage: true, permSupportView: true,
    permSupportCreate: true, permSupportSmarthands: true, permNotifyMaintenance: true,
    permNotifyBilling: false, permNotifyIncidents: true, permAdminUsers: false,
  }},
];

function getActivePermCount(perms: Partial<PermissionKeys>): number {
  return Object.values(perms).filter(Boolean).length;
}

function getPermSummaryBadges(perms: Partial<PermissionKeys>): string[] {
  const badges: string[] = [];
  if (perms.permBillingView) badges.push("Billing");
  if (perms.permServicesView) badges.push("Services");
  if (perms.permTechnicalView) badges.push("Technical");
  if (perms.permSupportView) badges.push("Support");
  if (perms.permAdminUsers) badges.push("Admin");
  return badges;
}

function PermissionCheckboxGrid({ perms, onChange }: { perms: PermissionKeys; onChange: (perms: PermissionKeys) => void }) {
  return (
    <div className="space-y-3" data-testid="permission-grid">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{group.label}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {group.keys.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={perms[key]}
                  onChange={(e) => onChange({ ...perms, [key]: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  data-testid={`checkbox-${key}`}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type AdminPermKeys = {
  adminPermDashboard: boolean;
  adminPermClients: boolean;
  adminPermSupport: boolean;
  adminPermDevices: boolean;
  adminPermOrders: boolean;
  adminPermSales: boolean;
  adminPermSettings: boolean;
  adminPermUsers: boolean;
  adminPermReports: boolean;
};

const DEFAULT_ADMIN_PERMS: AdminPermKeys = {
  adminPermDashboard: true, adminPermClients: true, adminPermSupport: true,
  adminPermDevices: true, adminPermOrders: true, adminPermSales: true,
  adminPermSettings: true, adminPermUsers: true, adminPermReports: false,
};

const ADMIN_ROLE_TEMPLATES: { value: string; label: string; perms: AdminPermKeys }[] = [
  { value: "super_admin", label: "Super Admin", perms: { adminPermDashboard: true, adminPermClients: true, adminPermSupport: true, adminPermDevices: true, adminPermOrders: true, adminPermSales: true, adminPermSettings: true, adminPermUsers: true, adminPermReports: true } },
  { value: "datacenter_tech", label: "Datacenter Technician", perms: { adminPermDashboard: true, adminPermClients: true, adminPermSupport: true, adminPermDevices: true, adminPermOrders: false, adminPermSales: false, adminPermSettings: false, adminPermUsers: false, adminPermReports: false } },
  { value: "security", label: "Security", perms: { adminPermDashboard: true, adminPermClients: true, adminPermSupport: true, adminPermDevices: true, adminPermOrders: false, adminPermSales: false, adminPermSettings: false, adminPermUsers: false, adminPermReports: false } },
  { value: "billing_admin", label: "Billing Admin", perms: { adminPermDashboard: true, adminPermClients: true, adminPermSupport: false, adminPermDevices: false, adminPermOrders: true, adminPermSales: true, adminPermSettings: true, adminPermUsers: false, adminPermReports: true } },
  { value: "support_agent", label: "Support Agent", perms: { adminPermDashboard: true, adminPermClients: true, adminPermSupport: true, adminPermDevices: false, adminPermOrders: false, adminPermSales: false, adminPermSettings: false, adminPermUsers: false, adminPermReports: false } },
  { value: "readonly", label: "Read-Only", perms: { adminPermDashboard: true, adminPermClients: false, adminPermSupport: false, adminPermDevices: false, adminPermOrders: false, adminPermSales: false, adminPermSettings: false, adminPermUsers: false, adminPermReports: false } },
];

const ADMIN_PERM_LABELS: { key: keyof AdminPermKeys; label: string }[] = [
  { key: "adminPermDashboard", label: "Dashboard" },
  { key: "adminPermClients", label: "Clients" },
  { key: "adminPermSupport", label: "Support" },
  { key: "adminPermDevices", label: "Devices" },
  { key: "adminPermOrders", label: "Orders" },
  { key: "adminPermSales", label: "Sales / Invoices" },
  { key: "adminPermSettings", label: "Settings" },
  { key: "adminPermUsers", label: "User Management" },
  { key: "adminPermReports", label: "Reports" },
];

type UserData = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  customerId?: string | null;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  adminRole?: string | null;
} & Partial<PermissionKeys> & Partial<AdminPermKeys>;

type AdminView = "dashboard" | "users" | "services" | "invoices" | "customers" | "settings" | "tickets" | "devices" | "customer-detail";

const inputCls = "w-full h-9 px-3 text-[13px] bg-white border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors";
const btnPrimary = "inline-flex items-center gap-1.5 px-4 h-9 bg-blue-600 text-white text-[13px] font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50";
const btnSecondary = "inline-flex items-center gap-1.5 px-4 h-9 bg-white text-slate-700 text-[13px] font-medium rounded-md border border-slate-200 hover:bg-slate-50 transition-colors";

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<AdminSection>("home");
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [ticketQueueFilter, setTicketQueueFilter] = useState("all");
  const [ticketDeptFilter, setTicketDeptFilter] = useState("all");
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [allDevices, setAllDevices] = useState<any[]>([]);

  function navigateToSection(section: AdminSection) {
    setCurrentSection(section);
    const defaultViews: Record<AdminSection, AdminView> = {
      home: "dashboard",
      clients: "customers",
      support: "tickets",
      devices: "devices",
      orders: "services",
      sales: "invoices",
      settings: "settings",
    };
    setCurrentView(defaultViews[section]);
    if (section !== "clients") setSelectedCustomerId(null);
  }

  async function loadDevices() {
    try {
      const res = await fetch("/api/admin/devices", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAllDevices(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadTickets() {
    try {
      const res = await fetch("/api/tickets", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAllTickets(await res.json());
    } catch {}
  }

  useEffect(() => {
    if (currentView === "tickets") loadTickets();
  }, [currentView]);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAllUsers(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (currentView === "users") loadUsers();
  }, [currentView]);

  async function handleLogout() {
    await logout();
    setLocation("/admin/login");
  }

  function handleEditUser(u: UserData) {
    setEditingUser(u);
    setShowUserModal(true);
  }

  function handleNewUser() {
    setEditingUser(null);
    setShowUserModal(true);
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "Success", description: "User deleted" });
        loadUsers();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to delete user", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  }

  const openTicketCount = allTickets.filter(t => ["new", "open", "in_progress", "waiting"].includes(t.status)).length;

  const ticketDepts = [
    { key: "all", label: "All Queues", icon: Ticket },
    { key: "support", label: "Support", icon: HardHat },
    { key: "sales", label: "Sales", icon: CreditCard },
    { key: "billing", label: "Billing", icon: FileText },
    { key: "provisioning", label: "Provisioning", icon: Server },
    { key: "smart_hands", label: "SmartHands", icon: HardHat },
    { key: "abuse", label: "Abuse", icon: Shield },
    { key: "general", label: "General", icon: MessageSquare },
  ];

  function deptCount(dept: string) {
    const active = allTickets.filter(t => ["new", "open", "in_progress", "waiting"].includes(t.status));
    if (dept === "all") return active.length;
    return active.filter(t => t.category === dept).length;
  }

  const sidebarGroups: SidebarGroup[] = useMemo(() => {
    switch (currentSection) {
      case "home":
        return [{ title: "Navigation", items: [
          { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", active: currentView === "dashboard", onClick: () => setCurrentView("dashboard") },
          { icon: Activity, label: "Live Activity", id: "live-activity" },
        ]}];
      case "clients":
        return [{ title: "Accounts", items: [
          { icon: Building2, label: "All Customers", id: "customers", active: currentView === "customers", onClick: () => setCurrentView("customers") },
          { icon: Users, label: "All Users", id: "users", active: currentView === "users", badge: allUsers.length || undefined, onClick: () => setCurrentView("users") },
        ]}];
      case "support":
        return [
          { title: "Queues", items: ticketDepts.map(d => ({
            icon: d.icon, label: d.label, id: `dept-${d.key}`, badge: deptCount(d.key) || undefined,
            active: ticketDeptFilter === d.key && !["new","open","in_progress","waiting","resolved","mine","unassigned"].includes(ticketQueueFilter),
            onClick: () => { setTicketDeptFilter(d.key); setTicketQueueFilter("all"); setCurrentView("tickets"); },
          }))},
          { title: "Status", collapsible: true, items: [
            { icon: Bell, label: "New", id: "filter-new", badge: allTickets.filter(t => t.status === "new").length || undefined, active: ticketQueueFilter === "new", onClick: () => { setTicketQueueFilter("new"); setCurrentView("tickets"); } },
            { icon: Activity, label: "Open", id: "filter-open", badge: allTickets.filter(t => t.status === "open").length || undefined, active: ticketQueueFilter === "open", onClick: () => { setTicketQueueFilter("open"); setCurrentView("tickets"); } },
            { icon: Loader2, label: "In Progress", id: "filter-in-progress", badge: allTickets.filter(t => t.status === "in_progress").length || undefined, active: ticketQueueFilter === "in_progress", onClick: () => { setTicketQueueFilter("in_progress"); setCurrentView("tickets"); } },
            { icon: Bell, label: "Waiting", id: "filter-waiting", badge: allTickets.filter(t => t.status === "waiting").length || undefined, active: ticketQueueFilter === "waiting", onClick: () => { setTicketQueueFilter("waiting"); setCurrentView("tickets"); } },
            { icon: Shield, label: "Resolved", id: "filter-resolved", active: ticketQueueFilter === "resolved", onClick: () => { setTicketQueueFilter("resolved"); setCurrentView("tickets"); } },
          ]},
          { title: "Assignment", collapsible: true, items: [
            { icon: Users, label: "My Tickets", id: "filter-mine", active: ticketQueueFilter === "mine", onClick: () => { setTicketQueueFilter("mine"); setCurrentView("tickets"); } },
            { icon: HardHat, label: "Unassigned", id: "filter-unassigned", badge: allTickets.filter(t => !t.assignedTo).length || undefined, active: ticketQueueFilter === "unassigned", onClick: () => { setTicketQueueFilter("unassigned"); setCurrentView("tickets"); } },
          ]},
        ];
      case "devices":
        return [{ title: "Devices", items: [
          { icon: Server, label: "All Devices", id: "devices", active: currentView === "devices", badge: allDevices.length || undefined, onClick: () => setCurrentView("devices") },
          { icon: Monitor, label: "Servers", id: "filter-servers" },
          { icon: Network, label: "Network", id: "filter-network" },
          { icon: Wifi, label: "Monitoring", id: "filter-monitoring" },
        ]}];
      case "orders":
        return [{ title: "Service Orders", items: [
          { icon: Server, label: "All Services", id: "services", active: currentView === "services", onClick: () => setCurrentView("services") },
        ]}];
      case "sales":
        return [{ title: "Billing", items: [
          { icon: CreditCard, label: "All Invoices", id: "invoices", active: currentView === "invoices", onClick: () => setCurrentView("invoices") },
        ]}];
      case "settings":
        return [{ title: "Configuration", items: [
          { icon: Settings, label: "Billing Config", id: "settings", active: currentView === "settings", onClick: () => setCurrentView("settings") },
        ]}];
      default:
        return [];
    }
  }, [currentSection, currentView, allUsers.length, ticketQueueFilter, ticketDeptFilter, allTickets]);

  const viewLabels: Record<AdminView, string> = {
    dashboard: "Dashboard",
    users: "User Management",
    services: "Services",
    invoices: "Invoices & Billing",
    customers: "Customer Accounts",
    settings: "Settings",
    tickets: "Support Tickets",
    devices: "Device Management",
    "customer-detail": "Client Detail",
  };

  const sectionLabels: Record<AdminSection, string> = {
    home: "Home",
    clients: "Clients",
    support: "Support",
    devices: "Devices",
    orders: "Orders",
    sales: "Sales",
    settings: "Settings",
  };

  const breadcrumbs = ["911-DC", sectionLabels[currentSection], viewLabels[currentView]];

  const hiddenSections = useMemo(() => {
    if (!user || (user as any).adminRole === "super_admin") return [] as AdminSection[];
    const sectionPermMap: Record<AdminSection, keyof AdminPermKeys> = {
      home: "adminPermDashboard",
      clients: "adminPermClients",
      support: "adminPermSupport",
      devices: "adminPermDevices",
      orders: "adminPermOrders",
      sales: "adminPermSales",
      settings: "adminPermSettings",
    };
    return (Object.entries(sectionPermMap) as [AdminSection, keyof AdminPermKeys][])
      .filter(([, perm]) => (user as any)[perm] === false)
      .map(([section]) => section);
  }, [user]);

  return (
    <>
      <AdminLayout
        currentSection={currentSection}
        onSectionChange={navigateToSection}
        sidebarGroups={sidebarGroups}
        breadcrumbs={breadcrumbs}
        userName={user?.name || "Admin"}
        userRole={(user as any)?.adminRole || undefined}
        onLogout={handleLogout}
        supportBadge={openTicketCount}
        hiddenSections={hiddenSections}
      >
        {currentView === "dashboard" && (
          <DashboardView
            tickets={allTickets}
            devices={allDevices}
            token={token}
            onNavigate={(section: AdminSection) => navigateToSection(section)}
          />
        )}
        {currentView === "users" && (
          <UsersView
            users={allUsers}
            loading={loadingUsers}
            onNewUser={handleNewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            token={token}
          />
        )}
        {currentView === "services" && <ServicesView token={token} />}
        {currentView === "invoices" && <InvoicesView token={token} />}
        {currentView === "customers" && (
          <CustomersView token={token} onOpenDetail={(id) => { setSelectedCustomerId(id); setCurrentView("customer-detail"); }} />
        )}
        {currentView === "customer-detail" && selectedCustomerId && (
          <CustomerDetailView token={token} customerId={selectedCustomerId} onBack={() => { setSelectedCustomerId(null); setCurrentView("customers"); }} />
        )}
        {currentView === "devices" && <DevicesView token={token} devices={allDevices} onRefresh={loadDevices} />}
        {currentView === "settings" && <SettingsView token={token} />}
        {currentView === "tickets" && (
          <TicketsView
            token={token}
            tickets={allTickets}
            filter={ticketQueueFilter}
            deptFilter={ticketDeptFilter}
            userId={user?.id || ""}
            onRefresh={loadTickets}
          />
        )}
      </AdminLayout>

      <UserModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        editingUser={editingUser}
        token={token}
        onSuccess={() => { setShowUserModal(false); loadUsers(); }}
      />
    </>
  );
}

function DashboardView({ tickets, devices, token, onNavigate }: { tickets: any[]; devices: any[]; token: string | null; onNavigate: (section: AdminSection) => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/admin/customers", { headers }).then(r => r.ok ? r.json() : []),
      fetch("/api/admin/users", { headers }).then(r => r.ok ? r.json() : []),
      fetch("/api/services", { headers }).then(r => r.ok ? r.json() : []),
      fetch("/api/invoices", { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([c, u, s, i]) => {
      setCustomers(c);
      setUsers(u);
      setServices(s);
      setInvoices(i);
    }).catch(() => {});
  }, [token]);

  const openTickets = tickets.filter(t => ["new", "open", "in_progress", "waiting"].includes(t.status));
  const urgentTickets = tickets.filter(t => t.priority === "urgent" && ["new", "open", "in_progress", "waiting"].includes(t.status));
  const newToday = tickets.filter(t => {
    const created = new Date(t.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });

  const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "open");
  const pastDueInvoices = invoices.filter((i: any) => i.status === "past_due");
  const paidThisMonth = invoices.filter((i: any) => {
    if (i.status !== "paid") return false;
    const d = new Date(i.issueDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalOutstanding = pendingInvoices.reduce((sum: number, i: any) => sum + Number(i.total || 0), 0);

  const activeServices = services.filter((s: any) => s.status === "active");
  const provisioningServices = services.filter((s: any) => s.status === "provisioning");

  return (
    <div className="flex-1 overflow-auto p-6" data-testid="dashboard-view">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900" data-testid="text-welcome">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" — "}
            {openTickets.length} open tickets, {customers.length} customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AdminCard title="Client Manager" subtitle="Day at a Glance" icon={Building2} accentColor="blue"
            footer={
              <button onClick={() => onNavigate("clients")} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1" data-testid="button-goto-clients">
                Go to Client Manager <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }>
            <KpiRow items={[
              { label: "Customers", value: customers.length },
              { label: "Active Users", value: users.filter((u: any) => u.active).length },
              { label: "Customer Users", value: users.filter((u: any) => u.role === "customer").length },
            ]} />
          </AdminCard>

          <AdminCard title="Support Manager" subtitle="Day at a Glance" icon={Headset} accentColor="amber"
            footer={
              <button onClick={() => onNavigate("support")} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1" data-testid="button-goto-support">
                Go to Support Manager <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }>
            <KpiRow items={[
              { label: "Open Tickets", value: openTickets.length },
              { label: "New Today", value: newToday.length },
              { label: "Urgent", value: urgentTickets.length, sub: urgentTickets.length > 0 ? "needs attention" : undefined, color: "#dc2626" },
            ]} />
          </AdminCard>

          <AdminCard title="Device Manager" subtitle="Day at a Glance" icon={Server} accentColor="emerald"
            footer={
              <button onClick={() => onNavigate("devices")} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1" data-testid="button-goto-devices">
                Go to Device Manager <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }>
            <KpiRow items={[
              { label: "Total Devices", value: devices.length },
              { label: "Active", value: devices.filter((d: any) => d.status === "active").length },
              { label: "Locations", value: 8 },
            ]} />
          </AdminCard>

          <AdminCard title="Billing Manager" subtitle="Day at a Glance" icon={CreditCard} accentColor="emerald"
            footer={
              <button onClick={() => onNavigate("sales")} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1" data-testid="button-goto-billing">
                Go to Billing <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }>
            <KpiRow items={[
              { label: "Open Invoices", value: pendingInvoices.length },
              { label: "Outstanding", value: `$${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Past Due", value: pastDueInvoices.length, sub: pastDueInvoices.length > 0 ? "overdue" : undefined, color: "#dc2626" },
            ]} />
          </AdminCard>

          <AdminCard title="Orders Manager" subtitle="Day at a Glance" icon={FileText} accentColor="violet"
            footer={
              <button onClick={() => onNavigate("orders")} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1" data-testid="button-goto-orders">
                Go to Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }>
            <KpiRow items={[
              { label: "Active Services", value: activeServices.length },
              { label: "Provisioning", value: provisioningServices.length },
              { label: "Total", value: services.length },
            ]} />
          </AdminCard>

          <AdminCard title="Infrastructure" subtitle="Datacenter Locations" icon={Globe} accentColor="slate"
            footer={
              <span className="text-[13px] text-slate-400 font-medium flex items-center gap-1">
                Coming Soon
              </span>
            }>
            <KpiRow items={[
              { label: "Locations", value: 8 },
              { label: "Main Hub", value: "Miami" },
              { label: "Region", value: "S. Florida" },
            ]} />
          </AdminCard>
        </div>

        {openTickets.length > 0 && (
          <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Open Tickets</h3>
              <button onClick={() => onNavigate("support")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <table className="w-full" data-testid="table-tickets">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Ticket #</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Subject</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Customer</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Priority</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Assigned</th>
                  <th className="text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {openTickets.slice(0, 5).map((t: any, i: number) => (
                  <tr key={t.id} onClick={() => onNavigate("support")} className={`border-b border-slate-100 cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"} hover:bg-slate-50`} data-testid={`row-ticket-${t.id}`}>
                    <td className="text-[13px] text-slate-500 py-2.5 px-4 font-mono">#{t.ticketNumber || t.id}</td>
                    <td className="text-[13px] text-slate-900 py-2.5 px-4 font-medium">{t.subject}</td>
                    <td className="text-[13px] text-slate-500 py-2.5 px-4">{t.customerName || "—"}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={t.priority} /></td>
                    <td className="py-2.5 px-4"><StatusBadge status={t.status} showDot /></td>
                    <td className="text-[13px] text-slate-500 py-2.5 px-4">{t.assigneeName || "Unassigned"}</td>
                    <td className="text-[13px] text-slate-500 py-2.5 px-4 text-right">{new Date(t.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersView({ users, loading, onNewUser, onEditUser, onDeleteUser, token }: {
  users: UserData[];
  loading: boolean;
  onNewUser: () => void;
  onEditUser: (u: UserData) => void;
  onDeleteUser: (id: string) => void;
  token: string | null;
}) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedUser = users.find((u) => u.id === selectedId);

  const columns: ColumnDef<UserData>[] = [
    { key: "name", label: "Name", sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: "username", label: "Username", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: true, render: (row) => (
      <div className="flex items-center gap-1">
        <StatusBadge status={row.role} />
        {row.role === "admin" && row.adminRole && (
          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{row.adminRole.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
        )}
      </div>
    )},
    { key: "permissions", label: "Permissions", render: (row) => (
      row.role === "customer" ? (
        <div className="flex flex-wrap gap-1" data-testid={`perms-summary-${row.id}`}>
          {getPermSummaryBadges(row).map((b) => (
            <span key={b} className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 rounded-full">{b}</span>
          ))}
          {getPermSummaryBadges(row).length === 0 && <span className="text-xs text-slate-400">none</span>}
        </div>
      ) : row.role === "admin" ? (
        <div className="flex flex-wrap gap-0.5" data-testid={`perms-summary-${row.id}`}>
          {ADMIN_PERM_LABELS.filter(({ key }) => (row as any)[key] !== false).map(({ label }) => (
            <span key={label} className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full">{label}</span>
          ))}
        </div>
      ) : <span className="text-xs text-slate-400">all</span>
    )},
    { key: "companyName", label: "Company", sortable: true },
    { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "active" : "suspended"} showDot /> },
    { key: "actions", label: "Actions", align: "center", render: (row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onEditUser(row); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium" data-testid={`button-edit-user-${row.id}`}>Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDeleteUser(row.id); }} className="text-red-600 hover:text-red-700 text-xs font-medium" data-testid={`button-delete-user-${row.id}`}>Delete</button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />Loading users...
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTable
            data={users}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            searchPlaceholder="Search users..."
            searchKeys={["name", "username", "email", "companyName"]}
            selectedId={selectedId}
            getRowId={(row) => row.id}
            rowTestIdPrefix="user"
            actions={
              <button onClick={onNewUser} className={btnPrimary} data-testid="button-new-user">
                <Plus className="w-4 h-4" />New User
              </button>
            }
            className="flex-1"
          />
          {selectedUser && (
            <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0 max-h-[220px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">User Details — {selectedUser.name}</h3>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Username:</span> <span className="text-slate-900 ml-1">{selectedUser.username}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-slate-900 ml-1">{selectedUser.email}</span></div>
                <div><span className="text-slate-500">Role:</span> <span className="text-slate-900 ml-1 capitalize">{selectedUser.role}</span></div>
                <div><span className="text-slate-500">Company:</span> <span className="text-slate-900 ml-1">{selectedUser.companyName || "—"}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-slate-900 ml-1">{selectedUser.active ? "Active" : "Suspended"}</span></div>
                <div><span className="text-slate-500">Created:</span> <span className="text-slate-900 ml-1">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-slate-500">Last Login:</span> <span className="text-slate-900 ml-1">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Never"}</span></div>
              </div>
              {selectedUser.role === "customer" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/users/${selectedUser.id}/send-invitation`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast({ title: "Success", description: "Invitation email sent to " + selectedUser.email });
                        } else {
                          toast({ title: "Error", description: data.error || "Failed to send invitation", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Error", description: "Failed to send invitation email", variant: "destructive" });
                      }
                    }}
                    className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 font-medium"
                    data-testid={`button-send-invitation-${selectedUser.id}`}
                  >
                    <Mail className="w-4 h-4" />Send Portal Invitation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserModal({ open, onOpenChange, editingUser, token, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserData | null;
  token: string | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleTemplate, setRoleTemplate] = useState("custom");
  const [customerList, setCustomerList] = useState<Array<{ id: string; name: string }>>([]);
  const [contactList, setContactList] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([]);
  const [formData, setFormData] = useState({ username: "", password: "", name: "", email: "", role: "customer", customerId: "", active: true });
  const [perms, setPerms] = useState<PermissionKeys>({ ...DEFAULT_PERMS });
  const [adminRole, setAdminRole] = useState("super_admin");
  const [adminPerms, setAdminPerms] = useState<AdminPermKeys>({ ...DEFAULT_ADMIN_PERMS });

  useEffect(() => {
    if (open && token) {
      fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(data => setCustomerList(data)).catch(() => {});
    }
  }, [open, token]);

  useEffect(() => {
    if (open && token && formData.customerId && formData.role === "customer") {
      fetch(`/api/admin/customers/${formData.customerId}/contacts`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(data => setContactList(data)).catch(() => setContactList([]));
    } else {
      setContactList([]);
    }
  }, [open, token, formData.customerId, formData.role]);

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setFormData({ username: editingUser.username, password: "", name: editingUser.name, email: editingUser.email, role: editingUser.role, customerId: editingUser.customerId || "", active: editingUser.active });
        setPerms({
          permPortalAccess: editingUser.permPortalAccess ?? true, permBillingView: editingUser.permBillingView ?? false,
          permBillingReceiveInvoices: editingUser.permBillingReceiveInvoices ?? false, permBillingMakePayments: editingUser.permBillingMakePayments ?? false,
          permServicesView: editingUser.permServicesView ?? false, permServicesManage: editingUser.permServicesManage ?? false,
          permTechnicalView: editingUser.permTechnicalView ?? false, permTechnicalManage: editingUser.permTechnicalManage ?? false,
          permSupportView: editingUser.permSupportView ?? false, permSupportCreate: editingUser.permSupportCreate ?? false,
          permSupportSmarthands: editingUser.permSupportSmarthands ?? false, permNotifyMaintenance: editingUser.permNotifyMaintenance ?? false,
          permNotifyBilling: editingUser.permNotifyBilling ?? false, permNotifyIncidents: editingUser.permNotifyIncidents ?? false,
          permAdminUsers: editingUser.permAdminUsers ?? false,
        });
        setAdminRole(editingUser.adminRole || "super_admin");
        setAdminPerms({
          adminPermDashboard: editingUser.adminPermDashboard ?? true, adminPermClients: editingUser.adminPermClients ?? true,
          adminPermSupport: editingUser.adminPermSupport ?? true, adminPermDevices: editingUser.adminPermDevices ?? true,
          adminPermOrders: editingUser.adminPermOrders ?? true, adminPermSales: editingUser.adminPermSales ?? true,
          adminPermSettings: editingUser.adminPermSettings ?? true, adminPermUsers: editingUser.adminPermUsers ?? true,
          adminPermReports: editingUser.adminPermReports ?? false,
        });
        setRoleTemplate("custom");
      } else {
        setFormData({ username: "", password: "", name: "", email: "", role: "customer", customerId: "", active: true });
        setPerms({ ...DEFAULT_PERMS });
        setAdminRole("super_admin");
        setAdminPerms({ ...DEFAULT_ADMIN_PERMS });
        setRoleTemplate("custom");
      }
    }
  }, [open, editingUser]);

  function handleTemplateChange(templateValue: string) {
    setRoleTemplate(templateValue);
    const tpl = ROLE_TEMPLATES.find(t => t.value === templateValue);
    if (tpl) setPerms({ ...tpl.perms });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";
      const body: any = { ...formData };
      if (editingUser && !body.password) delete body.password;
      const selectedCustomer = customerList.find(c => c.id === formData.customerId);
      if (selectedCustomer) { body.companyName = selectedCustomer.name; } else { body.customerId = null; body.companyName = null; }
      if (formData.role === "customer") Object.assign(body, perms);
      if (formData.role === "admin") { body.adminRole = adminRole; Object.assign(body, adminPerms); }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { toast({ title: "Success", description: editingUser ? "User updated" : "User created" }); onSuccess(); }
      else toast({ title: "Error", description: data.error || "Failed to save user", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to save user", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Edit User" : "New User"}</DialogTitle>
          <DialogDescription>{editingUser ? "Update user details and permissions" : "Create a new admin or customer account"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingUser && formData.role === "customer" && formData.customerId && contactList.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="text-xs text-blue-700 font-medium block mb-1.5">Import from Authorized Contact</label>
              <Select onValueChange={(contactId) => {
                const contact = contactList.find(c => c.id === contactId);
                if (contact) {
                  setFormData(prev => ({ ...prev, name: contact.name, email: contact.email || prev.email }));
                  toast({ title: "Contact imported", description: `Pre-filled from ${contact.name}` });
                }
              }}>
                <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-import-contact"><SelectValue placeholder="Select a contact to pre-fill..." /></SelectTrigger>
                <SelectContent>
                  {contactList.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Username</label>
              <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={inputCls} required disabled={!!editingUser} data-testid="input-new-username" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Password {editingUser && <span className="text-slate-400">(blank=keep)</span>}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls} required={!editingUser} data-testid="input-new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Full Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required data-testid="input-new-name" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} required data-testid="input-new-email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">System Role</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-9" data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Company</label>
              <Select value={formData.customerId || "none"} onValueChange={(v) => setFormData({ ...formData, customerId: v === "none" ? "" : v })}>
                <SelectTrigger className="h-9" data-testid="select-company"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {customerList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="active" className="text-sm text-slate-700">Account Active</label>
          </div>
          {formData.role === "customer" && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Portal Permissions</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Template:</span>
                  <Select value={roleTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-7 w-[180px] text-xs" data-testid="select-role-template"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4">
                <PermissionCheckboxGrid perms={perms} onChange={(p) => { setPerms(p); setRoleTemplate("custom"); }} />
              </div>
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                {getActivePermCount(perms)} of 15 permissions enabled
              </div>
            </div>
          )}
          {formData.role === "admin" && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Admin Role & Permissions</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Role:</span>
                  <Select value={adminRole} onValueChange={(v) => {
                    setAdminRole(v);
                    const tpl = ADMIN_ROLE_TEMPLATES.find(t => t.value === v);
                    if (tpl) setAdminPerms({ ...tpl.perms });
                  }}>
                    <SelectTrigger className="h-7 w-[200px] text-xs" data-testid="select-admin-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLE_TEMPLATES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Section Access</div>
                <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                  {ADMIN_PERM_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={adminPerms[key]}
                        onChange={(e) => setAdminPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                        disabled={adminRole === "super_admin"}
                        data-testid={`checkbox-${key}`}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {adminRole === "super_admin" && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded">Super Admin has full access to all sections</div>
                )}
              </div>
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
                {Object.values(adminPerms).filter(Boolean).length} of {ADMIN_PERM_LABELS.length} sections enabled
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={loading} className={btnPrimary} data-testid="button-save-user">
              {loading ? "Saving..." : editingUser ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CompanyData = {
  id: string; name: string; address: string | null; city: string | null; state: string | null;
  zip: string | null; phone: string | null; email: string | null; contactName: string | null;
  notes: string | null; active: boolean;
};

type CompanyUser = { id: string; name: string; email: string; username: string; customerRole: string | null; active: boolean } & Partial<PermissionKeys>;

function CustomersView({ token, onOpenDetail }: { token: string | null; onOpenDetail: (id: string) => void }) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [addToCustomerId, setAddToCustomerId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCompanies(await res.json());
    } catch { toast({ title: "Error", description: "Failed to load customers", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function loadCompanyUsers(customerId: string) {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setExpandedUsers(data.users || []); }
    } catch { setExpandedUsers([]); }
    finally { setLoadingUsers(false); }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    if (expandedId !== id) { setExpandedId(id); loadCompanyUsers(id); }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm("Delete this customer and unlink all associated users?")) return;
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "Customer deleted" }); loadCompanies(); if (expandedId === id) { setExpandedId(null); setExpandedUsers([]); } }
    } catch { toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" }); }
  }

  async function handleRemoveUser(customerId: string, userId: string) {
    if (!confirm("Remove this user from the customer?")) return;
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "User removed" }); loadCompanyUsers(customerId); }
    } catch { toast({ title: "Error", description: "Failed to remove user", variant: "destructive" }); }
  }

  const selectedCompany = companies.find(c => c.id === selectedId);

  const columns: ColumnDef<CompanyData>[] = [
    { key: "clientNumber", label: "Client #", width: "90px", sortable: true, render: (row: any) => <span className="font-mono text-slate-500">#{row.clientNumber || "—"}</span> },
    { key: "name", label: "Company Name", sortable: true, render: (row) => (
      <span className="font-medium text-slate-900">
        {row.name}
        {!row.active && <span className="ml-2 text-xs text-red-500">[Inactive]</span>}
      </span>
    )},
    { key: "contactName", label: "Contact", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "active" : "suspended"} showDot /> },
    { key: "actions", label: "Actions", align: "center", render: (row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onOpenDetail(row.id); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium" data-testid={`button-view-customer-${row.id}`}>View</button>
        <button onClick={(e) => { e.stopPropagation(); setEditingCompany(row); setShowCompanyModal(true); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium" data-testid={`button-edit-customer-${row.id}`}>Edit</button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteCompany(row.id); }} className="text-red-600 hover:text-red-700 text-xs font-medium" data-testid={`button-delete-customer-${row.id}`}>Delete</button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="customers-view">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : (
        <>
          <AdminTable
            data={companies}
            columns={columns}
            onRowClick={(row) => onOpenDetail(row.id)}
            searchPlaceholder="Search customers..."
            searchKeys={["name", "email", "contactName"]}
            getRowId={(row) => row.id}
            rowTestIdPrefix="customer"
            actions={
              <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className={btnPrimary} data-testid="button-add-customer">
                <Plus className="w-4 h-4" />Add Customer
              </button>
            }
            className="flex-1"
          />
        </>
      )}
      <CompanyModal open={showCompanyModal} onOpenChange={setShowCompanyModal} editing={editingCompany} token={token} onSuccess={() => { setShowCompanyModal(false); loadCompanies(); }} />
      <CustomerUserModal open={showUserModal} onOpenChange={setShowUserModal} customerId={addToCustomerId} token={token} onSuccess={() => { setShowUserModal(false); if (addToCustomerId) loadCompanyUsers(addToCustomerId); }} />
    </div>
  );
}

function CompanyModal({ open, onOpenChange, editing, token, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; editing: CompanyData | null; token: string | null; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", phone: "", email: "", contactName: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({ name: editing.name, address: editing.address || "", city: editing.city || "", state: editing.state || "", zip: editing.zip || "", phone: editing.phone || "", email: editing.email || "", contactName: editing.contactName || "", notes: editing.notes || "" });
    else setForm({ name: "", address: "", city: "", state: "", zip: "", phone: "", email: "", contactName: "", notes: "" });
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Company name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/customers/${editing.id}` : "/api/admin/customers";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) { toast({ title: editing ? "Customer updated" : "Customer created" }); onSuccess(); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Failed to save", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to save customer", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>{editing ? "Update company details." : "Create a new customer (company)."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Company Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="input-company-name" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Contact Name</label>
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} data-testid="input-contact-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="input-company-email" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} data-testid="input-company-phone" /></div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} data-testid="input-company-address" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} data-testid="input-company-city" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">State</label><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} data-testid="input-company-state" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">ZIP</label><input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} data-testid="input-company-zip" /></div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} data-testid="input-company-notes" /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary} data-testid="button-save-customer">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerUserModal({ open, onOpenChange, customerId, token, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; customerId: string | null; token: string | null; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [roleTemplate, setRoleTemplate] = useState("technician");
  const [perms, setPerms] = useState<PermissionKeys>({ ...DEFAULT_PERMS });

  useEffect(() => {
    if (open) {
      setForm({ name: "", username: "", email: "", password: "" });
      const techTpl = ROLE_TEMPLATES.find(t => t.value === "technician");
      setPerms(techTpl ? { ...techTpl.perms } : { ...DEFAULT_PERMS });
      setRoleTemplate("technician");
    }
  }, [open]);

  function handleTemplateChange(templateValue: string) {
    setRoleTemplate(templateValue);
    const tpl = ROLE_TEMPLATES.find(t => t.value === templateValue);
    if (tpl) setPerms({ ...tpl.perms });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ title: "All fields are required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/users`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, ...perms }),
      });
      if (res.ok) { toast({ title: "User added" }); onSuccess(); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Failed to add user", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to add user", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add User to Customer</DialogTitle>
          <DialogDescription>Create a new user account linked to this company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="input-user-name" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Username *</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} data-testid="input-user-username" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Email *</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="input-user-email" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} data-testid="input-user-password" /></div>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-900">Portal Permissions</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Template:</span>
                <Select value={roleTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="h-7 w-[180px] text-xs" data-testid="select-role-template"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLE_TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4"><PermissionCheckboxGrid perms={perms} onChange={(p) => { setPerms(p); setRoleTemplate("custom"); }} /></div>
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">{getActivePermCount(perms)} of 15 permissions enabled</div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary} data-testid="button-save-user">{saving ? "Saving..." : "Add User"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ServiceData = {
  id: string; userId: string; name: string; type: string; status: string; location: string;
  details: string | null; serviceOrder: string | null; monthlyPrice: string; startDate: string;
  grafanaUrl?: string | null; grafanaDashboardUid?: string | null; grafanaPanelId?: string | null;
  grafanaOrgId?: string | null; grafanaVar?: string | null;
  snmpHost?: string | null; snmpPort?: number | null; snmpCommunity?: string | null;
  snmpVersion?: string | null; snmpOidStatus?: string | null; snmpOidControl?: string | null;
  pduPortNumber?: number | null;
};

type CustomerOption = { id: string; name: string; companyName?: string | null };

function ServicesView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadServices() {
    setLoading(true);
    try { const res = await fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setServices(await res.json()); }
    catch { toast({ title: "Error", description: "Failed to load services", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function loadCustomers() {
    try { const res = await fetch("/api/admin/customer-users", { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setCustomers(await res.json()); } catch {}
  }

  useEffect(() => { loadServices(); loadCustomers(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "Success", description: "Service deleted" }); loadServices(); }
    } catch { toast({ title: "Error", description: "Failed to delete service", variant: "destructive" }); }
  }

  const selectedService = services.find(s => s.id === selectedId);

  const columns: ColumnDef<ServiceData>[] = [
    { key: "name", label: "Service", sortable: true, render: (row) => (
      <div>
        <span className="font-medium text-slate-900">{row.name}</span>
        {row.details && <div className="text-xs text-slate-500 mt-0.5">{row.details}</div>}
      </div>
    )},
    { key: "type", label: "Type", sortable: true },
    { key: "location", label: "Location", sortable: true },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} showDot /> },
    { key: "monthlyPrice", label: "Monthly", align: "right", sortable: true, render: (row) => <span className="font-medium text-slate-900">${Number(row.monthlyPrice).toFixed(2)}</span> },
    { key: "monitoring", label: "Monitoring", render: (row) => <span className="text-slate-500">{row.grafanaUrl ? "Grafana" : row.snmpHost ? "SNMP/PDU" : "—"}</span> },
    { key: "actions", label: "Actions", align: "center", render: (row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); setEditingService(row); setShowModal(true); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-700 text-xs font-medium">Delete</button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : (
        <>
          <AdminTable
            data={services}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            searchPlaceholder="Search services..."
            searchKeys={["name", "type", "location"]}
            selectedId={selectedId}
            getRowId={(row) => row.id}
            rowTestIdPrefix="service"
            actions={
              <button onClick={() => { setEditingService(null); setShowModal(true); }} className={btnPrimary} data-testid="button-new-service">
                <Plus className="w-4 h-4" />New Service
              </button>
            }
            className="flex-1"
          />
          {selectedService && (
            <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0 max-h-[250px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Service Details — {selectedService.name}</h3>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Type:</span> <span className="text-slate-900 ml-1">{selectedService.type}</span></div>
                <div><span className="text-slate-500">Location:</span> <span className="text-slate-900 ml-1">{selectedService.location}</span></div>
                <div><span className="text-slate-500">Status:</span> <StatusBadge status={selectedService.status} showDot /></div>
                <div><span className="text-slate-500">Monthly:</span> <span className="text-slate-900 ml-1">${Number(selectedService.monthlyPrice).toFixed(2)}</span></div>
                <div><span className="text-slate-500">Start Date:</span> <span className="text-slate-900 ml-1">{new Date(selectedService.startDate).toLocaleDateString()}</span></div>
                <div><span className="text-slate-500">Details:</span> <span className="text-slate-900 ml-1">{selectedService.details || "—"}</span></div>
                <div><span className="text-slate-500">Service Order:</span> <span className="text-slate-900 ml-1">{selectedService.serviceOrder || "—"}</span></div>
              </div>
              {selectedService.grafanaUrl && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Grafana Configuration</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                    <div><span className="text-slate-500">URL:</span> <span className="text-slate-900 ml-1">{selectedService.grafanaUrl}</span></div>
                    <div><span className="text-slate-500">Dashboard UID:</span> <span className="text-slate-900 ml-1">{selectedService.grafanaDashboardUid || "—"}</span></div>
                    <div><span className="text-slate-500">Panel ID:</span> <span className="text-slate-900 ml-1">{selectedService.grafanaPanelId || "—"}</span></div>
                    <div><span className="text-slate-500">Org ID:</span> <span className="text-slate-900 ml-1">{selectedService.grafanaOrgId || "—"}</span></div>
                    <div><span className="text-slate-500">Variable:</span> <span className="text-slate-900 ml-1">{selectedService.grafanaVar || "—"}</span></div>
                  </div>
                </div>
              )}
              {selectedService.snmpHost && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">SNMP/PDU Configuration</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                    <div><span className="text-slate-500">Host:</span> <span className="text-slate-900 ml-1">{selectedService.snmpHost}</span></div>
                    <div><span className="text-slate-500">Port:</span> <span className="text-slate-900 ml-1">{selectedService.snmpPort || 161}</span></div>
                    <div><span className="text-slate-500">Community:</span> <span className="text-slate-900 ml-1">{selectedService.snmpCommunity || "—"}</span></div>
                    <div><span className="text-slate-500">Version:</span> <span className="text-slate-900 ml-1">{selectedService.snmpVersion || "—"}</span></div>
                    <div><span className="text-slate-500">Status OID:</span> <span className="text-slate-900 ml-1">{selectedService.snmpOidStatus || "—"}</span></div>
                    <div><span className="text-slate-500">Control OID:</span> <span className="text-slate-900 ml-1">{selectedService.snmpOidControl || "—"}</span></div>
                    <div><span className="text-slate-500">PDU Port #:</span> <span className="text-slate-900 ml-1">{selectedService.pduPortNumber ?? "—"}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <ServiceModal open={showModal} onOpenChange={setShowModal} editingService={editingService} customers={customers} token={token} onSuccess={() => { setShowModal(false); loadServices(); }} />
    </div>
  );
}

function ServiceModal({ open, onOpenChange, editingService, customers, token, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; editingService: ServiceData | null;
  customers: CustomerOption[]; token: string | null; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "grafana" | "snmp">("general");
  const [formData, setFormData] = useState({
    userId: "", name: "", type: "Colocation", status: "active", location: "iM Critical Miami",
    details: "", serviceOrder: "", monthlyPrice: "", startDate: new Date().toISOString().split("T")[0],
    grafanaUrl: "", grafanaDashboardUid: "", grafanaPanelId: "", grafanaOrgId: "", grafanaVar: "",
    snmpHost: "", snmpPort: "161", snmpCommunity: "", snmpVersion: "v2c",
    snmpOidStatus: "", snmpOidControl: "", pduPortNumber: "",
  });

  useEffect(() => {
    if (open) {
      setActiveTab("general");
      if (editingService) {
        setFormData({
          userId: editingService.userId, name: editingService.name, type: editingService.type,
          status: editingService.status, location: editingService.location,
          details: editingService.details || "", serviceOrder: editingService.serviceOrder || "",
          monthlyPrice: editingService.monthlyPrice, startDate: new Date(editingService.startDate).toISOString().split("T")[0],
          grafanaUrl: editingService.grafanaUrl || "", grafanaDashboardUid: editingService.grafanaDashboardUid || "",
          grafanaPanelId: editingService.grafanaPanelId || "", grafanaOrgId: editingService.grafanaOrgId || "",
          grafanaVar: editingService.grafanaVar || "",
          snmpHost: editingService.snmpHost || "", snmpPort: String(editingService.snmpPort || 161),
          snmpCommunity: editingService.snmpCommunity || "", snmpVersion: editingService.snmpVersion || "v2c",
          snmpOidStatus: editingService.snmpOidStatus || "", snmpOidControl: editingService.snmpOidControl || "",
          pduPortNumber: editingService.pduPortNumber != null ? String(editingService.pduPortNumber) : "",
        });
      } else {
        setFormData({
          userId: customers[0]?.id || "", name: "", type: "Colocation", status: "active", location: "iM Critical Miami",
          details: "", serviceOrder: "", monthlyPrice: "", startDate: new Date().toISOString().split("T")[0],
          grafanaUrl: "", grafanaDashboardUid: "", grafanaPanelId: "", grafanaOrgId: "", grafanaVar: "",
          snmpHost: "", snmpPort: "161", snmpCommunity: "", snmpVersion: "v2c",
          snmpOidStatus: "", snmpOidControl: "", pduPortNumber: "",
        });
      }
    }
  }, [open, editingService, customers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const method = editingService ? "PUT" : "POST";
      const body: any = {
        ...formData, startDate: new Date(formData.startDate), serviceOrder: formData.serviceOrder || null,
        snmpPort: formData.snmpPort ? parseInt(formData.snmpPort) : null,
        pduPortNumber: formData.pduPortNumber ? parseInt(formData.pduPortNumber) : null,
        grafanaUrl: formData.grafanaUrl || null, grafanaDashboardUid: formData.grafanaDashboardUid || null,
        grafanaPanelId: formData.grafanaPanelId || null, grafanaOrgId: formData.grafanaOrgId || null,
        grafanaVar: formData.grafanaVar || null, snmpHost: formData.snmpHost || null,
        snmpCommunity: formData.snmpCommunity || null, snmpVersion: formData.snmpVersion || null,
        snmpOidStatus: formData.snmpOidStatus || null, snmpOidControl: formData.snmpOidControl || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { toast({ title: "Success", description: editingService ? "Service updated" : "Service created" }); onSuccess(); }
      else { const data = await res.json(); toast({ title: "Error", description: data.error || "Failed to save service", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to save service", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  const locations = ["iM Critical Miami", "Equinix Miami", "Digital Realty Miami", "365 Data Centers FLL", "EdgeConneX Miami", "QTS MIA1", "CoreSite MI1", "South Reach Networks"];
  const serviceTypes = ["Colocation", "Internet", "Network", "Cross-Connect", "SmartHands", "DDoS Protection"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingService ? "Edit Service" : "New Service"}</DialogTitle>
          <DialogDescription>{editingService ? "Update service details" : "Create a new customer service"}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 border-b border-slate-200 mb-3">
          {(["general", "grafana", "snmp"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {tab === "general" ? "General" : tab === "grafana" ? "Grafana" : "SNMP/PDU"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[400px] overflow-y-auto">
          {activeTab === "general" && (
            <>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Customer</label>
                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.filter(c => c.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Service Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required placeholder="e.g., Cabinet C12 (42U)" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Type</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Location</label>
                  <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs text-slate-500 block mb-1">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="provisioning">Provisioning</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Details</label><input value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className={inputCls} placeholder="e.g., 2kW, 2x 20A circuits" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Service Order #</label><input value={formData.serviceOrder} onChange={(e) => setFormData({ ...formData, serviceOrder: e.target.value })} className={inputCls} placeholder="e.g., SO-2024-001" data-testid="input-service-order" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Monthly Price ($)</label><input type="number" step="0.01" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} className={inputCls} required /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Start Date</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputCls} required /></div>
              </div>
            </>
          )}
          {activeTab === "grafana" && (
            <>
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-md">Configure Grafana panel embedding for network traffic monitoring.</div>
              <div><label className="text-xs text-slate-500 block mb-1">Grafana URL</label><input value={formData.grafanaUrl} onChange={(e) => setFormData({ ...formData, grafanaUrl: e.target.value })} className={inputCls} placeholder="https://grafana.911dc.us" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Dashboard UID</label><input value={formData.grafanaDashboardUid} onChange={(e) => setFormData({ ...formData, grafanaDashboardUid: e.target.value })} className={inputCls} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Panel ID</label><input value={formData.grafanaPanelId} onChange={(e) => setFormData({ ...formData, grafanaPanelId: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Org ID</label><input value={formData.grafanaOrgId} onChange={(e) => setFormData({ ...formData, grafanaOrgId: e.target.value })} className={inputCls} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Host Variable</label><input value={formData.grafanaVar} onChange={(e) => setFormData({ ...formData, grafanaVar: e.target.value })} className={inputCls} /></div>
              </div>
            </>
          )}
          {activeTab === "snmp" && (
            <>
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-md">Configure SNMP for PDU port management.</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">SNMP Host</label><input value={formData.snmpHost} onChange={(e) => setFormData({ ...formData, snmpHost: e.target.value })} className={inputCls} placeholder="IP or hostname" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">SNMP Port</label><input type="number" value={formData.snmpPort} onChange={(e) => setFormData({ ...formData, snmpPort: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">Community String</label><input value={formData.snmpCommunity} onChange={(e) => setFormData({ ...formData, snmpCommunity: e.target.value })} className={inputCls} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">SNMP Version</label>
                  <Select value={formData.snmpVersion} onValueChange={(v) => setFormData({ ...formData, snmpVersion: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="v1">v1</SelectItem><SelectItem value="v2c">v2c</SelectItem><SelectItem value="v3">v3</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><label className="text-xs text-slate-500 block mb-1">Status OID</label><input value={formData.snmpOidStatus} onChange={(e) => setFormData({ ...formData, snmpOidStatus: e.target.value })} className={inputCls} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Control OID</label><input value={formData.snmpOidControl} onChange={(e) => setFormData({ ...formData, snmpOidControl: e.target.value })} className={inputCls} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">PDU Port Number</label><input type="number" value={formData.pduPortNumber} onChange={(e) => setFormData({ ...formData, pduPortNumber: e.target.value })} className={inputCls} /></div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={loading} className={btnPrimary}>{loading ? "Saving..." : editingService ? "Update" : "Create"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type InvoiceData = {
  id: string; userId: string; invoiceNumber: string; status: string;
  issueDate: string; dueDate: string; subtotal: string; tax: string; total: string;
  customerName?: string; customerId?: string | null;
};

function InvoicesView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [billingRunning, setBillingRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function handleRunBilling() {
    if (!confirm("This will generate invoices for all customers with active services for this month. Continue?")) return;
    setBillingRunning(true);
    try {
      const res = await fetch("/api/admin/billing/run", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Billing Complete", description: `${data.generated} invoice(s) generated, ${data.skipped} skipped${data.errors.length > 0 ? `, ${data.errors.length} error(s)` : ""}` });
        loadInvoices();
      } else toast({ title: "Error", description: data.error || "Failed to run billing", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to run billing cycle", variant: "destructive" }); }
    finally { setBillingRunning(false); }
  }

  async function handleDownloadPdf(invoiceId: string, invoiceNumber: string) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob(); const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      } else toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" }); }
  }

  async function loadInvoices() {
    setLoading(true);
    try { const res = await fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setInvoices(await res.json()); }
    catch { toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function loadCustomers() {
    try { const res = await fetch("/api/admin/customer-users", { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) setCustomers(await res.json()); } catch {}
  }

  useEffect(() => { loadInvoices(); loadCustomers(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "Success", description: "Invoice deleted" }); loadInvoices(); }
    } catch { toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" }); }
  }

  async function handleApprove(inv: InvoiceData) {
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "Success", description: "Invoice approved and set to pending" }); loadInvoices(); }
      else { const data = await res.json(); toast({ title: "Error", description: data.error || "Failed to approve invoice", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to approve invoice", variant: "destructive" }); }
  }

  const selectedInvoice = invoices.find(inv => inv.id === selectedId);

  const columns: ColumnDef<InvoiceData>[] = [
    { key: "invoiceNumber", label: "Invoice #", sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.invoiceNumber}</span> },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "issueDate", label: "Issue Date", sortable: true, render: (row) => <span>{new Date(row.issueDate).toLocaleDateString()}</span> },
    { key: "dueDate", label: "Due Date", sortable: true, render: (row) => <span>{new Date(row.dueDate).toLocaleDateString()}</span> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} showDot /> },
    { key: "total", label: "Total", align: "right", sortable: true, render: (row) => <span className="font-semibold text-slate-900">${Number(row.total).toFixed(2)}</span> },
    { key: "actions", label: "Actions", align: "center", render: (row) => (
      <div className="flex items-center justify-center gap-2">
        {row.status === "draft" && <button onClick={(e) => { e.stopPropagation(); handleApprove(row); }} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium" data-testid={`button-approve-invoice-${row.id}`}>Approve</button>}
        <button onClick={(e) => { e.stopPropagation(); handleDownloadPdf(row.id, row.invoiceNumber); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium" data-testid={`button-download-pdf-${row.id}`}>PDF</button>
        <button onClick={(e) => { e.stopPropagation(); setEditingInvoice(row); setShowModal(true); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-700 text-xs font-medium">Delete</button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
      ) : (
        <>
          <AdminTable
            data={invoices}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            searchPlaceholder="Search invoices..."
            searchKeys={["invoiceNumber", "customerName"]}
            selectedId={selectedId}
            getRowId={(row) => row.id}
            rowTestIdPrefix="invoice"
            actions={
              <div className="flex items-center gap-2">
                <button onClick={handleRunBilling} disabled={billingRunning} className={btnSecondary} data-testid="button-run-billing">
                  {billingRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}Run Billing
                </button>
                <button onClick={() => { setEditingInvoice(null); setShowModal(true); }} className={btnPrimary} data-testid="button-new-invoice">
                  <Plus className="w-4 h-4" />New Invoice
                </button>
              </div>
            }
            className="flex-1"
          />
          {selectedInvoice && (
            <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0 max-h-[200px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Invoice Details — {selectedInvoice.invoiceNumber}</h3>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Customer:</span> <span className="text-slate-900 ml-1 font-medium">{selectedInvoice.customerName || "—"}</span></div>
                <div><span className="text-slate-500">Status:</span> <StatusBadge status={selectedInvoice.status} showDot /></div>
                <div><span className="text-slate-500">Issue Date:</span> <span className="text-slate-900 ml-1">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span></div>
                <div><span className="text-slate-500">Due Date:</span> <span className="text-slate-900 ml-1">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></div>
                <div><span className="text-slate-500">Subtotal:</span> <span className="text-slate-900 ml-1">${Number(selectedInvoice.subtotal).toFixed(2)}</span></div>
                <div><span className="text-slate-500">Tax:</span> <span className="text-slate-900 ml-1">${Number(selectedInvoice.tax).toFixed(2)}</span></div>
                <div><span className="text-slate-500">Total:</span> <span className="text-slate-900 ml-1 font-semibold">${Number(selectedInvoice.total).toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </>
      )}
      <InvoiceModal open={showModal} onOpenChange={setShowModal} editingInvoice={editingInvoice} customers={customers} token={token} onSuccess={() => { setShowModal(false); loadInvoices(); }} />
    </div>
  );
}

function TicketsView({ token, tickets, filter, deptFilter, userId, onRefresh }: {
  token: string | null; tickets: any[]; filter: string; deptFilter: string; userId: string; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyInternal, setReplyInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", body: "", category: "support", priority: "normal", customerId: "" });
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [updatingField, setUpdatingField] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setCustomers).catch(() => {});
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(users => setAdminUsers(users.filter((u: any) => u.role === "admin"))).catch(() => {});
  }, []);

  useEffect(() => { setTicketDetail(null); setSelectedTicket(null); }, [filter, deptFilter]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (deptFilter && deptFilter !== "all") result = result.filter(t => t.category === deptFilter);
    if (filter === "all") return result;
    if (filter === "mine") return result.filter(t => String(t.assignedTo) === String(userId));
    if (filter === "unassigned") return result.filter(t => !t.assignedTo);
    return result.filter(t => t.status === filter);
  }, [tickets, filter, deptFilter, userId]);

  async function loadTicketDetail(id: number) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setTicketDetail(data); setSelectedTicket(data); }
    } catch {} finally { setLoadingDetail(false); }
  }

  async function handleReply() {
    if (!replyBody.trim() || !ticketDetail) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketDetail.id}/replies`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: replyBody, isInternal: replyInternal }),
      });
      if (res.ok) { setReplyBody(""); setReplyInternal(false); loadTicketDetail(ticketDetail.id); onRefresh(); toast({ title: replyInternal ? "Internal note added" : "Reply sent" }); }
    } catch {} finally { setSending(false); }
  }

  async function handleUpdateTicket(field: string, value: string) {
    if (!ticketDetail) return;
    setUpdatingField(true);
    try {
      const body: any = {};
      body[field] = field === "assignedTo" ? (value === "unassigned" ? null : parseInt(value)) : value;
      const res = await fetch(`/api/tickets/${ticketDetail.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) { loadTicketDetail(ticketDetail.id); onRefresh(); toast({ title: `Ticket ${field} updated` }); }
    } catch {} finally { setUpdatingField(false); }
  }

  async function handleCreateTicket() {
    if (!newTicket.subject.trim() || !newTicket.customerId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) { setShowNewModal(false); setNewTicket({ subject: "", body: "", category: "general", priority: "normal", customerId: "" }); onRefresh(); toast({ title: "Ticket created" }); }
    } catch {} finally { setCreating(false); }
  }

  if (ticketDetail) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center px-5 flex-shrink-0 gap-3">
          <button onClick={() => { setTicketDetail(null); setSelectedTicket(null); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium" data-testid="button-back-tickets">&larr; Back to Queue</button>
          <div className="h-5 w-px bg-slate-200" />
          <span className="text-sm font-semibold text-slate-900">Ticket #{ticketDetail.ticketNumber || ticketDetail.id}: {ticketDetail.subject}</span>
          <div className="flex-1" />
          <StatusBadge status={ticketDetail.priority} />
          <StatusBadge status={ticketDetail.status} showDot />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-5">
              <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3 shadow-sm">
                <div className="text-xs text-slate-500 mb-2">
                  Opened by <span className="font-medium text-slate-700">{ticketDetail.creatorName || "Unknown"}</span> ({ticketDetail.customerName || "Unknown"}) &middot; {new Date(ticketDetail.createdAt).toLocaleString()}
                </div>
                <div className="text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed">{ticketDetail.body}</div>
              </div>
              {ticketDetail.replies?.map((reply: any) => (
                <div key={reply.id} className={`border rounded-lg p-4 mb-2 shadow-sm ${reply.isInternal ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">{reply.authorName || "Unknown"}</span>
                    {reply.isInternal && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">INTERNAL NOTE</span>}
                    {reply.authorRole === "admin" && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">Staff</span>}
                    <span className="text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed">{reply.body}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex-shrink-0">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={replyInternal ? "Add internal note (not visible to customer)..." : "Type your reply..."}
                className={`w-full h-20 text-[13px] p-3 border rounded-md outline-none resize-none ${replyInternal ? "bg-amber-50 border-amber-200 focus:border-amber-400" : "bg-white border-slate-200 focus:border-blue-400"} focus:ring-1 focus:ring-blue-100`}
                data-testid="input-ticket-reply"
              />
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={replyInternal} onChange={(e) => setReplyInternal(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-amber-500" />
                  Internal Note
                </label>
                <div className="flex-1" />
                <button onClick={handleReply} disabled={!replyBody.trim() || sending} className={btnPrimary} data-testid="button-send-reply">
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : replyInternal ? "Add Note" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
          <div className="w-56 bg-white border-l border-slate-200 p-4 overflow-auto flex-shrink-0">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Properties</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Status</label>
                <select value={ticketDetail.status} onChange={(e) => handleUpdateTicket("status", e.target.value)}
                  className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400" data-testid="select-ticket-status">
                  {["new", "open", "in_progress", "waiting", "resolved", "closed"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Priority</label>
                <select value={ticketDetail.priority} onChange={(e) => handleUpdateTicket("priority", e.target.value)}
                  className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400" data-testid="select-ticket-priority">
                  {["low", "normal", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Assigned To</label>
                <select value={ticketDetail.assignedTo || "unassigned"} onChange={(e) => handleUpdateTicket("assignedTo", e.target.value)}
                  className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400" data-testid="select-ticket-assignee">
                  <option value="unassigned">Unassigned</option>
                  {adminUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Category</label>
                <div className="text-sm text-slate-700 capitalize">{ticketDetail.category?.replace("_", " ") || "—"}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Customer</label>
                <div className="text-sm text-slate-700">{ticketDetail.customerName || "—"}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Created</label>
                <div className="text-xs text-slate-500">{new Date(ticketDetail.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Updated</label>
                <div className="text-xs text-slate-500">{new Date(ticketDetail.updatedAt).toLocaleString()}</div>
              </div>
              {ticketDetail.closedAt && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Closed</label>
                  <div className="text-xs text-slate-500">{new Date(ticketDetail.closedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ticketColumns: ColumnDef<any>[] = [
    { key: "ticketNumber", label: "Ticket #", width: "90px", sortable: true, render: (row: any) => <span className="font-mono text-slate-500">#{row.ticketNumber || row.id}</span> },
    { key: "subject", label: "Subject", sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.subject}</span> },
    { key: "customerName", label: "Customer", sortable: true, render: (row) => <span>{row.customerName || "—"}</span> },
    { key: "category", label: "Category", sortable: true, render: (row) => <span className="capitalize">{row.category?.replace("_", " ") || "—"}</span> },
    { key: "priority", label: "Priority", render: (row) => <StatusBadge status={row.priority} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} showDot /> },
    { key: "assigneeName", label: "Owner", sortable: true, render: (row) => <span>{row.assigneeName || "Unassigned"}</span> },
    { key: "updatedAt", label: "Updated", align: "right", sortable: true, render: (row) => <span className="text-slate-500">{new Date(row.updatedAt).toLocaleDateString()}</span> },
  ];

  const queueTitle = deptFilter !== "all"
    ? `${deptFilter === "smart_hands" ? "SmartHands" : deptFilter.charAt(0).toUpperCase() + deptFilter.slice(1)} Queue`
    : "All Queues";
  const filterSuffix = filter !== "all"
    ? ` — ${filter === "mine" ? "My Tickets" : filter === "unassigned" ? "Unassigned" : filter.replace("_", " ")}`
    : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AdminTable
        data={filteredTickets}
        columns={ticketColumns}
        onRowClick={(row) => loadTicketDetail(row.id)}
        searchPlaceholder="Search tickets..."
        searchKeys={["subject", "customerName", "assigneeName"]}
        getRowId={(row) => row.id}
        rowTestIdPrefix="ticket"
        emptyMessage="No tickets match this filter"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{queueTitle}{filterSuffix} ({filteredTickets.length})</span>
            <button onClick={() => setShowNewModal(true)} className={btnPrimary} data-testid="button-new-ticket">
              <Plus className="w-4 h-4" />New Ticket
            </button>
          </div>
        }
        className="flex-1"
      />

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>Create a ticket on behalf of a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Customer</label>
              <select value={newTicket.customerId} onChange={(e) => setNewTicket(p => ({ ...p, customerId: e.target.value }))}
                className={inputCls} data-testid="select-new-ticket-customer">
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Subject</label>
              <input value={newTicket.subject} onChange={(e) => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                className={inputCls} data-testid="input-new-ticket-subject" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Description</label>
              <textarea value={newTicket.body} onChange={(e) => setNewTicket(p => ({ ...p, body: e.target.value }))}
                className="w-full text-[13px] px-3 py-2 border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400 h-24 resize-none" data-testid="input-new-ticket-body" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Category</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket(p => ({ ...p, category: e.target.value }))}
                  className={inputCls} data-testid="select-new-ticket-category">
                  <option value="support">Support</option><option value="sales">Sales</option>
                  <option value="billing">Billing</option><option value="provisioning">Provisioning</option>
                  <option value="smart_hands">SmartHands</option><option value="abuse">Abuse</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Priority</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                  className={inputCls} data-testid="select-new-ticket-priority">
                  <option value="low">Low</option><option value="normal">Normal</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreateTicket} disabled={!newTicket.subject.trim() || !newTicket.customerId || creating}
              className={`w-full ${btnPrimary} justify-center`} data-testid="button-create-ticket">
              {creating ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type BillingSettingsData = {
  id?: string; invoicePrefix: string; nextInvoiceNumber: number; paymentTerms: string;
  billingEmailSubject: string; billingEmailTemplate: string;
  invitationEmailSubject: string; invitationEmailTemplate: string;
  smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; smtpSecure?: boolean;
  imapHost?: string; imapPort?: number; imapUser?: string; imapPassword?: string; imapSecure?: boolean;
  supportEmailAddress?: string; ticketEmailSubject?: string; ticketEmailTemplate?: string;
};

const BILLING_PLACEHOLDERS = [
  { var: "{{customerName}}", desc: "Customer company name" },
  { var: "{{invoiceNumber}}", desc: "Invoice number" },
  { var: "{{totalAmount}}", desc: "Invoice total" },
  { var: "{{dueDate}}", desc: "Payment due date" },
  { var: "{{issueDate}}", desc: "Invoice issue date" },
  { var: "{{itemCount}}", desc: "Number of line items" },
];

const INVITATION_PLACEHOLDERS = [
  { var: "{{userName}}", desc: "User full name" },
  { var: "{{userEmail}}", desc: "User email address" },
  { var: "{{companyName}}", desc: "Company name" },
  { var: "{{portalUrl}}", desc: "Portal login URL" },
];

function SettingsView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"billing" | "email" | "email-server">("billing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BillingSettingsData>({
    invoicePrefix: "INV", nextInvoiceNumber: 1, paymentTerms: "Net 30",
    billingEmailSubject: "", billingEmailTemplate: "",
    invitationEmailSubject: "", invitationEmailTemplate: "",
  });
  const [previewType, setPreviewType] = useState<"billing" | "invitation" | null>(null);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing-settings", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSettings(await res.json());
    } catch { toast({ title: "Error", description: "Failed to load settings", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing-settings", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          invoicePrefix: settings.invoicePrefix, nextInvoiceNumber: settings.nextInvoiceNumber,
          paymentTerms: settings.paymentTerms, billingEmailSubject: settings.billingEmailSubject,
          billingEmailTemplate: settings.billingEmailTemplate, invitationEmailSubject: settings.invitationEmailSubject,
          invitationEmailTemplate: settings.invitationEmailTemplate,
          smtpHost: settings.smtpHost, smtpPort: settings.smtpPort, smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword, smtpSecure: settings.smtpSecure,
          imapHost: settings.imapHost, imapPort: settings.imapPort, imapUser: settings.imapUser,
          imapPassword: settings.imapPassword, imapSecure: settings.imapSecure,
          supportEmailAddress: settings.supportEmailAddress, ticketEmailSubject: settings.ticketEmailSubject,
          ticketEmailTemplate: settings.ticketEmailTemplate,
        }),
      });
      if (res.ok) { const updated = await res.json(); setSettings(updated); toast({ title: "Settings saved" }); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Failed to save settings", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to save settings", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  function renderPreview(template: string, type: "billing" | "invitation") {
    let result = template;
    if (type === "billing") {
      result = result.replace(/\{\{customerName\}\}/g, "Acme Corp").replace(/\{\{invoiceNumber\}\}/g, `${settings.invoicePrefix}-001`)
        .replace(/\{\{totalAmount\}\}/g, "1,250.00").replace(/\{\{dueDate\}\}/g, "01/15/2025")
        .replace(/\{\{issueDate\}\}/g, "12/15/2024").replace(/\{\{itemCount\}\}/g, "3");
    } else {
      result = result.replace(/\{\{userName\}\}/g, "John Smith").replace(/\{\{userEmail\}\}/g, "john@acme.com")
        .replace(/\{\{companyName\}\}/g, "Acme Corp").replace(/\{\{portalUrl\}\}/g, "https://portal.911dc.us");
    }
    return result;
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm" data-testid="settings-view"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading settings...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="settings-view">
      <div className="bg-white border-b border-slate-200 flex items-center px-5 flex-shrink-0">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab("billing")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "billing" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            data-testid="tab-billing-settings">Billing</button>
          <button onClick={() => setActiveTab("email")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "email" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            data-testid="tab-email-templates">Email Templates</button>
          <button onClick={() => setActiveTab("email-server")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "email-server" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            data-testid="tab-email-server">Email Server</button>
        </div>
        <div className="flex-1" />
        <button onClick={handleSave} disabled={saving} className={btnPrimary} data-testid="button-save-settings">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Settings
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "billing" && (
          <div className="max-w-xl space-y-4" data-testid="billing-settings-panel">
            <h3 className="text-base font-semibold text-slate-900">Invoice Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs text-slate-500 block mb-1">Invoice Prefix</label>
                <input value={settings.invoicePrefix} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} className={inputCls} data-testid="input-invoice-prefix" /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Next Invoice Number</label>
                <input type="number" min={1} value={settings.nextInvoiceNumber} onChange={(e) => setSettings({ ...settings, nextInvoiceNumber: parseInt(e.target.value) || 1 })} className={inputCls} data-testid="input-next-invoice-number" /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Payment Terms</label>
                <input value={settings.paymentTerms} onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })} className={inputCls} data-testid="input-payment-terms" /></div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Preview:</span> Next invoice will be numbered <code className="font-mono font-semibold text-blue-600">{settings.invoicePrefix}-{String(settings.nextInvoiceNumber).padStart(3, "0")}</code>
            </div>
          </div>
        )}
        {activeTab === "email-server" && (
          <div className="max-w-xl space-y-6" data-testid="email-server-panel">
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">SMTP Configuration</h3>
              <p className="text-xs text-slate-500 mb-3">Outbound email server for notifications, invoices, and ticket emails.</p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">SMTP Host</label>
                    <input value={settings.smtpHost || ""} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} placeholder="smtp.example.com" className={inputCls} data-testid="input-smtp-host" /></div>
                  <div><label className="text-xs text-slate-500 block mb-1">Port</label>
                    <input type="number" value={settings.smtpPort || ""} onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || undefined })} placeholder="465" className={inputCls} data-testid="input-smtp-port" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-slate-500 block mb-1">Username</label>
                    <input value={settings.smtpUser || ""} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} placeholder="user@example.com" className={inputCls} data-testid="input-smtp-user" /></div>
                  <div><label className="text-xs text-slate-500 block mb-1">Password</label>
                    <input type="password" value={settings.smtpPassword || ""} onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })} className={inputCls} data-testid="input-smtp-password" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="smtp-secure" checked={settings.smtpSecure ?? true} onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                  <label htmlFor="smtp-secure" className="text-sm text-slate-700">Use SSL/TLS (recommended)</label>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/test-smtp", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ smtpHost: (settings as any).smtpHost, smtpPort: (settings as any).smtpPort, smtpUser: (settings as any).smtpUser, smtpPassword: (settings as any).smtpPassword, smtpSecure: (settings as any).smtpSecure }) });
                      const data = await res.json();
                      if (res.ok) toast({ title: "SMTP Test Passed", description: data.message || "Connection successful" });
                      else toast({ title: "SMTP Test Failed", description: data.error || "Connection failed", variant: "destructive" });
                    } catch { toast({ title: "Error", description: "Failed to test SMTP connection", variant: "destructive" }); }
                  }}
                  className={btnSecondary}
                  data-testid="button-test-smtp"
                >
                  <Mail className="w-4 h-4" />Test SMTP Connection
                </button>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold text-slate-900 mb-1">IMAP Configuration</h3>
              <p className="text-xs text-slate-500 mb-3">Inbound email server — for future email-to-ticket integration.</p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">IMAP Host</label>
                    <input value={settings.imapHost || ""} onChange={(e) => setSettings({ ...settings, imapHost: e.target.value })} placeholder="imap.example.com" className={inputCls} data-testid="input-imap-host" /></div>
                  <div><label className="text-xs text-slate-500 block mb-1">Port</label>
                    <input type="number" value={settings.imapPort || ""} onChange={(e) => setSettings({ ...settings, imapPort: parseInt(e.target.value) || undefined })} placeholder="993" className={inputCls} data-testid="input-imap-port" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-slate-500 block mb-1">Username</label>
                    <input value={settings.imapUser || ""} onChange={(e) => setSettings({ ...settings, imapUser: e.target.value })} placeholder="user@example.com" className={inputCls} data-testid="input-imap-user" /></div>
                  <div><label className="text-xs text-slate-500 block mb-1">Password</label>
                    <input type="password" value={settings.imapPassword || ""} onChange={(e) => setSettings({ ...settings, imapPassword: e.target.value })} className={inputCls} data-testid="input-imap-password" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="imap-secure" checked={settings.imapSecure ?? true} onChange={(e) => setSettings({ ...settings, imapSecure: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                  <label htmlFor="imap-secure" className="text-sm text-slate-700">Use SSL/TLS</label>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Support Email</h3>
              <p className="text-xs text-slate-500 mb-3">Address for inbound support notifications and ticket email routing.</p>
              <div><label className="text-xs text-slate-500 block mb-1">Support Email Address</label>
                <input value={settings.supportEmailAddress || ""} onChange={(e) => setSettings({ ...settings, supportEmailAddress: e.target.value })} placeholder="support@911dc.us" className={inputCls} data-testid="input-support-email" /></div>
            </div>
            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Ticket Email Template</h3>
              <p className="text-xs text-slate-500 mb-3">Template used for ticket notification emails.</p>
              <div className="space-y-3">
                <div><label className="text-xs text-slate-500 block mb-1">Subject Template</label>
                  <input value={settings.ticketEmailSubject || ""} onChange={(e) => setSettings({ ...settings, ticketEmailSubject: e.target.value })} placeholder="[Ticket #{{ticketNumber}}] {{subject}}" className={inputCls} data-testid="input-ticket-email-subject" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Body Template</label>
                  <textarea value={settings.ticketEmailTemplate || ""} onChange={(e) => setSettings({ ...settings, ticketEmailTemplate: e.target.value })} rows={6}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400 font-mono resize-y" data-testid="textarea-ticket-email-template" /></div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Placeholders</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{"{{ticketNumber}}"}</code> <span className="text-slate-500">Ticket number</span></span>
                    <span><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{"{{subject}}"}</code> <span className="text-slate-500">Ticket subject</span></span>
                    <span><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{"{{customerName}}"}</code> <span className="text-slate-500">Company name</span></span>
                    <span><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{"{{body}}"}</code> <span className="text-slate-500">Message body</span></span>
                    <span><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{"{{authorName}}"}</code> <span className="text-slate-500">Author name</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "email" && (
          <div className="max-w-2xl space-y-6" data-testid="email-templates-panel">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">Billing Email Template</h3>
                <button onClick={() => setPreviewType(previewType === "billing" ? null : "billing")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" data-testid="button-preview-billing-email">
                  <Eye className="w-4 h-4" />{previewType === "billing" ? "Hide Preview" : "Preview"}
                </button>
              </div>
              <div className="space-y-3">
                <div><label className="text-xs text-slate-500 block mb-1">Subject</label>
                  <input value={settings.billingEmailSubject} onChange={(e) => setSettings({ ...settings, billingEmailSubject: e.target.value })} className={inputCls} data-testid="input-billing-email-subject" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Body Template</label>
                  <textarea value={settings.billingEmailTemplate} onChange={(e) => setSettings({ ...settings, billingEmailTemplate: e.target.value })} rows={8}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400 font-mono resize-y" data-testid="textarea-billing-email-template" /></div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Placeholders</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {BILLING_PLACEHOLDERS.map((p) => (
                      <span key={p.var} className="text-sm"><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{p.var}</code> <span className="text-slate-500">{p.desc}</span></span>
                    ))}
                  </div>
                </div>
                {previewType === "billing" && (
                  <div className="border border-slate-200 bg-white rounded-md p-4" data-testid="preview-billing-email">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview (sample data)</div>
                    <div className="text-sm text-slate-900 font-medium mb-1">Subject: {renderPreview(settings.billingEmailSubject, "billing")}</div>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{renderPreview(settings.billingEmailTemplate, "billing")}</pre>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">Invitation Email Template</h3>
                <button onClick={() => setPreviewType(previewType === "invitation" ? null : "invitation")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" data-testid="button-preview-invitation-email">
                  <Eye className="w-4 h-4" />{previewType === "invitation" ? "Hide Preview" : "Preview"}
                </button>
              </div>
              <div className="space-y-3">
                <div><label className="text-xs text-slate-500 block mb-1">Subject</label>
                  <input value={settings.invitationEmailSubject} onChange={(e) => setSettings({ ...settings, invitationEmailSubject: e.target.value })} className={inputCls} data-testid="input-invitation-email-subject" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Body Template</label>
                  <textarea value={settings.invitationEmailTemplate} onChange={(e) => setSettings({ ...settings, invitationEmailTemplate: e.target.value })} rows={8}
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400 font-mono resize-y" data-testid="textarea-invitation-email-template" /></div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Placeholders</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {INVITATION_PLACEHOLDERS.map((p) => (
                      <span key={p.var} className="text-sm"><code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{p.var}</code> <span className="text-slate-500">{p.desc}</span></span>
                    ))}
                  </div>
                </div>
                {previewType === "invitation" && (
                  <div className="border border-slate-200 bg-white rounded-md p-4" data-testid="preview-invitation-email">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview (sample data)</div>
                    <div className="text-sm text-slate-900 font-medium mb-1">Subject: {renderPreview(settings.invitationEmailSubject, "invitation")}</div>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{renderPreview(settings.invitationEmailTemplate, "invitation")}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DevicesView({ token, devices, onRefresh }: { token: string | null; devices: any[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deviceIps, setDeviceIps] = useState<any[]>([]);
  const [deviceInterfaces, setDeviceInterfaces] = useState<any[]>([]);
  const [childDevices, setChildDevices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [newIp, setNewIp] = useState({ ipAddress: "", description: "", type: "public", vlan: "", ptrRecord: "" });
  const [newInterface, setNewInterface] = useState({ name: "", status: "up", connectedPort: "", vlan: "", speed: "" });
  const [showIpForm, setShowIpForm] = useState(false);
  const [showInterfaceForm, setShowInterfaceForm] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch("/api/admin/customers", { headers: h }).then(r => r.ok ? r.json() : []).then(setCustomers).catch(() => {});
    fetch("/api/services", { headers: h }).then(r => r.ok ? r.json() : []).then(setServices).catch(() => {});
  }, [token]);

  async function loadDeviceDetail(id: string) {
    setLoadingDetail(true);
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [dev, ips, ifaces] = await Promise.all([
        fetch(`/api/admin/devices/${id}`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/devices/${id}/ips`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`/api/admin/devices/${id}/interfaces`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]);
      if (dev) { setDeviceDetail(dev); setSelectedDevice(dev); }
      setDeviceIps(ips);
      setDeviceInterfaces(ifaces);
      const children = devices.filter(d => d.parentDeviceId === id);
      setChildDevices(children);
    } catch {} finally { setLoadingDetail(false); }
  }

  async function handleDeleteDevice(id: string) {
    if (!confirm("Delete this device?")) return;
    try {
      const res = await fetch(`/api/admin/devices/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast({ title: "Device deleted" }); onRefresh(); setDeviceDetail(null); setSelectedDevice(null); }
    } catch { toast({ title: "Error", description: "Failed to delete device", variant: "destructive" }); }
  }

  async function handleAddIp() {
    if (!newIp.ipAddress.trim() || !deviceDetail) return;
    try {
      const res = await fetch(`/api/admin/devices/${deviceDetail.id}/ips`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newIp),
      });
      if (res.ok) { setNewIp({ ipAddress: "", description: "", type: "public", vlan: "", ptrRecord: "" }); setShowIpForm(false); loadDeviceDetail(deviceDetail.id); toast({ title: "IP added" }); }
    } catch { toast({ title: "Error", description: "Failed to add IP", variant: "destructive" }); }
  }

  async function handleDeleteIp(ipId: string) {
    if (!deviceDetail) return;
    try {
      const res = await fetch(`/api/admin/devices/${deviceDetail.id}/ips/${ipId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { loadDeviceDetail(deviceDetail.id); toast({ title: "IP removed" }); }
    } catch {}
  }

  async function handleAddInterface() {
    if (!newInterface.name.trim() || !deviceDetail) return;
    try {
      const res = await fetch(`/api/admin/devices/${deviceDetail.id}/interfaces`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newInterface),
      });
      if (res.ok) { setNewInterface({ name: "", status: "up", connectedPort: "", vlan: "", speed: "" }); setShowInterfaceForm(false); loadDeviceDetail(deviceDetail.id); toast({ title: "Interface added" }); }
    } catch { toast({ title: "Error", description: "Failed to add interface", variant: "destructive" }); }
  }

  async function handleDeleteInterface(ifId: string) {
    if (!deviceDetail) return;
    try {
      const res = await fetch(`/api/admin/devices/${deviceDetail.id}/interfaces/${ifId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { loadDeviceDetail(deviceDetail.id); toast({ title: "Interface removed" }); }
    } catch {}
  }

  if (deviceDetail) {
    const cust = customers.find((c: any) => c.id === deviceDetail.customerId);
    const svc = services.find((s: any) => s.id === deviceDetail.serviceId);
    return (
      <div className="flex-1 flex flex-col overflow-hidden" data-testid="device-detail-view">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center px-5 flex-shrink-0 gap-3">
          <button onClick={() => { setDeviceDetail(null); setSelectedDevice(null); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium" data-testid="button-back-devices">&larr; Back to Devices</button>
          <div className="h-5 w-px bg-slate-200" />
          <span className="text-sm font-semibold text-slate-900">Device #{deviceDetail.deviceNumber}: {deviceDetail.name}</span>
          <div className="flex-1" />
          <StatusBadge status={deviceDetail.status} showDot />
          <button onClick={() => { setEditingDevice(deviceDetail); setShowModal(true); }} className={btnSecondary} data-testid="button-edit-device"><Edit className="w-3.5 h-3.5" />Edit</button>
          <button onClick={() => handleDeleteDevice(deviceDetail.id)} className="inline-flex items-center gap-1.5 px-3 h-9 text-red-600 text-[13px] font-medium rounded-md border border-red-200 hover:bg-red-50 transition-colors" data-testid="button-delete-device"><Trash2 className="w-3.5 h-3.5" />Delete</button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Server className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold text-slate-900">Device Information</span></div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Device #:</span> <span className="text-slate-900 ml-1 font-mono">#{deviceDetail.deviceNumber}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="text-slate-900 ml-1 capitalize">{deviceDetail.deviceType}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-slate-900 ml-1 capitalize">{deviceDetail.status}</span></div>
                <div><span className="text-slate-500">Monitor:</span> <span className="text-slate-900 ml-1 capitalize">{deviceDetail.monitorStatus || "unknown"}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Description:</span> <span className="text-slate-900 ml-1">{deviceDetail.description || "—"}</span></div>
                <div><span className="text-slate-500">Customer:</span> <span className="text-slate-900 ml-1">{cust?.name || "—"}</span></div>
                <div><span className="text-slate-500">Service:</span> <span className="text-slate-900 ml-1">{svc?.name || "—"}</span></div>
                {deviceDetail.tags && <div className="col-span-2"><span className="text-slate-500">Tags:</span> <span className="text-slate-900 ml-1">{deviceDetail.tags}</span></div>}
                {deviceDetail.notes && <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="text-slate-900 ml-1">{deviceDetail.notes}</span></div>}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Globe className="w-4 h-4 text-teal-600" /><span className="text-sm font-semibold text-slate-900">Location</span></div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Facility:</span> <span className="text-slate-900 ml-1">{deviceDetail.facility || "—"}</span></div>
                <div><span className="text-slate-500">Zone:</span> <span className="text-slate-900 ml-1">{deviceDetail.zone || "—"}</span></div>
                <div><span className="text-slate-500">Cage:</span> <span className="text-slate-900 ml-1">{deviceDetail.cage || "—"}</span></div>
                <div><span className="text-slate-500">Row:</span> <span className="text-slate-900 ml-1">{deviceDetail.row || "—"}</span></div>
                <div><span className="text-slate-500">Rack:</span> <span className="text-slate-900 ml-1">{deviceDetail.rack || "—"}</span></div>
                <div><span className="text-slate-500">Position:</span> <span className="text-slate-900 ml-1">{deviceDetail.rackPosition || "—"}</span></div>
                <div><span className="text-slate-500">Height:</span> <span className="text-slate-900 ml-1">{deviceDetail.rackUnits ? `${deviceDetail.rackUnits}U` : "—"}</span></div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Network className="w-4 h-4 text-violet-600" /><span className="text-sm font-semibold text-slate-900">IP Assignments ({deviceIps.length})</span></div>
                <button onClick={() => setShowIpForm(!showIpForm)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid="button-add-ip"><Plus className="w-3.5 h-3.5" />Add IP</button>
              </div>
              <div className="p-4">
                {showIpForm && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input value={newIp.ipAddress} onChange={(e) => setNewIp({ ...newIp, ipAddress: e.target.value })} placeholder="IP Address" className={inputCls} data-testid="input-new-ip" />
                      <input value={newIp.description} onChange={(e) => setNewIp({ ...newIp, description: e.target.value })} placeholder="Description" className={inputCls} />
                      <select value={newIp.type} onChange={(e) => setNewIp({ ...newIp, type: e.target.value })} className={inputCls}>
                        <option value="public">Public</option><option value="private">Private</option><option value="local">Local</option><option value="service">Service</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddIp} className={btnPrimary} data-testid="button-save-ip">Add</button>
                      <button onClick={() => setShowIpForm(false)} className={btnSecondary}>Cancel</button>
                    </div>
                  </div>
                )}
                {deviceIps.length === 0 ? <div className="text-xs text-slate-400 italic">No IP assignments</div> : (
                  <table className="w-full" data-testid="table-device-ips">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">IP Address</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Type</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Description</th>
                      <th className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3"></th>
                    </tr></thead>
                    <tbody>
                      {deviceIps.map((ip: any, i: number) => (
                        <tr key={ip.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} data-testid={`row-ip-${ip.id}`}>
                          <td className="text-[13px] text-slate-900 py-2 px-3 font-mono">{ip.ipAddress}</td>
                          <td className="text-[13px] text-slate-500 py-2 px-3 capitalize">{ip.type}</td>
                          <td className="text-[13px] text-slate-500 py-2 px-3">{ip.description || "—"}</td>
                          <td className="py-2 px-3 text-center"><button onClick={() => handleDeleteIp(ip.id)} className="text-red-600 hover:text-red-700 text-xs" data-testid={`button-delete-ip-${ip.id}`}><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Cable className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold text-slate-900">Network Interfaces ({deviceInterfaces.length})</span></div>
                <button onClick={() => setShowInterfaceForm(!showInterfaceForm)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid="button-add-interface"><Plus className="w-3.5 h-3.5" />Add Interface</button>
              </div>
              <div className="p-4">
                {showInterfaceForm && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input value={newInterface.name} onChange={(e) => setNewInterface({ ...newInterface, name: e.target.value })} placeholder="eth0" className={inputCls} data-testid="input-new-interface" />
                      <select value={newInterface.status} onChange={(e) => setNewInterface({ ...newInterface, status: e.target.value })} className={inputCls}>
                        <option value="up">Up</option><option value="down">Down</option><option value="admin_down">Admin Down</option>
                      </select>
                      <input value={newInterface.speed} onChange={(e) => setNewInterface({ ...newInterface, speed: e.target.value })} placeholder="1Gbps" className={inputCls} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddInterface} className={btnPrimary} data-testid="button-save-interface">Add</button>
                      <button onClick={() => setShowInterfaceForm(false)} className={btnSecondary}>Cancel</button>
                    </div>
                  </div>
                )}
                {deviceInterfaces.length === 0 ? <div className="text-xs text-slate-400 italic">No interfaces</div> : (
                  <table className="w-full" data-testid="table-device-interfaces">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Speed</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">VLAN</th>
                      <th className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3"></th>
                    </tr></thead>
                    <tbody>
                      {deviceInterfaces.map((iface: any, i: number) => (
                        <tr key={iface.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} data-testid={`row-interface-${iface.id}`}>
                          <td className="text-[13px] text-slate-900 py-2 px-3 font-mono">{iface.name}</td>
                          <td className="py-2 px-3"><StatusBadge status={iface.status === "up" ? "active" : "suspended"} showDot /></td>
                          <td className="text-[13px] text-slate-500 py-2 px-3">{iface.speed || "—"}</td>
                          <td className="text-[13px] text-slate-500 py-2 px-3">{iface.vlan || "—"}</td>
                          <td className="py-2 px-3 text-center"><button onClick={() => handleDeleteInterface(iface.id)} className="text-red-600 hover:text-red-700 text-xs" data-testid={`button-delete-interface-${iface.id}`}><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {childDevices.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm col-span-full">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Server className="w-4 h-4 text-slate-600" /><span className="text-sm font-semibold text-slate-900">Child Devices ({childDevices.length})</span></div>
                <div className="p-4">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Device #</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Type</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                    </tr></thead>
                    <tbody>
                      {childDevices.map((d: any, i: number) => (
                        <tr key={d.id} className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} onClick={() => loadDeviceDetail(d.id)}>
                          <td className="text-[13px] text-slate-500 py-2 px-3 font-mono">#{d.deviceNumber}</td>
                          <td className="text-[13px] text-slate-900 py-2 px-3 font-medium">{d.name}</td>
                          <td className="text-[13px] text-slate-500 py-2 px-3 capitalize">{d.deviceType}</td>
                          <td className="py-2 px-3"><StatusBadge status={d.status} showDot /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {deviceDetail.grafanaUrl && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm col-span-full">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Activity className="w-4 h-4 text-green-600" /><span className="text-sm font-semibold text-slate-900">Monitoring</span></div>
                <div className="p-1">
                  <iframe
                    src={`${deviceDetail.grafanaUrl}/d-solo/${deviceDetail.grafanaDashboardUid}?orgId=${deviceDetail.grafanaOrgId || 1}&panelId=${deviceDetail.grafanaPanelId || 1}&from=now-24h&to=now`}
                    className="w-full h-[300px] border-0 rounded"
                    title="Grafana Monitoring"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <DeviceModal open={showModal} onOpenChange={setShowModal} editing={editingDevice} customers={customers} services={services} devices={devices} token={token} onSuccess={() => { setShowModal(false); onRefresh(); if (deviceDetail) loadDeviceDetail(deviceDetail.id); }} />
      </div>
    );
  }

  const deviceColumns: ColumnDef<any>[] = [
    { key: "deviceNumber", label: "Device #", width: "90px", sortable: true, render: (row: any) => <span className="font-mono text-slate-500">#{row.deviceNumber}</span> },
    { key: "name", label: "Name", sortable: true, render: (row: any) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: "deviceType", label: "Type", sortable: true, render: (row: any) => <span className="capitalize">{row.deviceType}</span> },
    { key: "status", label: "Status", render: (row: any) => <StatusBadge status={row.status} showDot /> },
    { key: "facility", label: "Facility", sortable: true, render: (row: any) => <span>{row.facility || "—"}</span> },
    { key: "rack", label: "Rack", render: (row: any) => <span>{row.rack ? `${row.rack}${row.rackPosition ? ` / U${row.rackPosition}` : ""}` : "—"}</span> },
    { key: "customerName", label: "Customer", sortable: true, render: (row: any) => <span>{row.customerName || "—"}</span> },
    { key: "actions", label: "", align: "center", render: (row: any) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); setEditingDevice(row); setShowModal(true); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium" data-testid={`button-edit-device-${row.id}`}>Edit</button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteDevice(row.id); }} className="text-red-600 hover:text-red-700 text-xs font-medium" data-testid={`button-delete-device-${row.id}`}>Delete</button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="devices-view">
      <AdminTable
        data={devices}
        columns={deviceColumns}
        onRowClick={(row) => loadDeviceDetail(row.id)}
        searchPlaceholder="Search devices..."
        searchKeys={["name", "deviceType", "facility", "customerName"]}
        getRowId={(row) => row.id}
        rowTestIdPrefix="device"
        actions={
          <button onClick={() => { setEditingDevice(null); setShowModal(true); }} className={btnPrimary} data-testid="button-add-device">
            <Plus className="w-4 h-4" />Add Device
          </button>
        }
        className="flex-1"
      />
      <DeviceModal open={showModal} onOpenChange={setShowModal} editing={editingDevice} customers={customers} services={services} devices={devices} token={token} onSuccess={() => { setShowModal(false); onRefresh(); }} />
    </div>
  );
}

function DeviceModal({ open, onOpenChange, editing, customers, services, devices, token, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; editing: any | null;
  customers: any[]; services: any[]; devices: any[]; token: string | null; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", deviceType: "server", status: "active", customerId: "", serviceId: "", parentDeviceId: "",
    facility: "", zone: "", cage: "", row: "", rack: "", rackPosition: "", rackUnits: "",
    tags: "", notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || "", description: editing.description || "", deviceType: editing.deviceType || "server",
        status: editing.status || "active", customerId: editing.customerId || "", serviceId: editing.serviceId || "",
        parentDeviceId: editing.parentDeviceId || "", facility: editing.facility || "", zone: editing.zone || "",
        cage: editing.cage || "", row: editing.row || "", rack: editing.rack || "", rackPosition: editing.rackPosition || "",
        rackUnits: editing.rackUnits?.toString() || "", tags: editing.tags || "", notes: editing.notes || "",
      });
    } else {
      setForm({ name: "", description: "", deviceType: "server", status: "active", customerId: "", serviceId: "", parentDeviceId: "", facility: "", zone: "", cage: "", row: "", rack: "", rackPosition: "", rackUnits: "", tags: "", notes: "" });
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Device name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const body: any = { ...form, rackUnits: form.rackUnits ? parseInt(form.rackUnits) : null };
      if (!body.customerId) body.customerId = null;
      if (!body.serviceId) body.serviceId = null;
      if (!body.parentDeviceId) body.parentDeviceId = null;
      const url = editing ? `/api/admin/devices/${editing.id}` : "/api/admin/devices";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { toast({ title: editing ? "Device updated" : "Device created" }); onSuccess(); }
      else { const err = await res.json(); toast({ title: "Error", description: err.error || "Failed to save", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to save device", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Device" : "Add Device"}</DialogTitle>
          <DialogDescription>{editing ? "Update device details." : "Register a new device."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Device Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="input-device-name" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Type</label>
              <select value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className={inputCls} data-testid="select-device-type">
                <option value="server">Server</option><option value="switch">Switch</option><option value="router">Router</option>
                <option value="firewall">Firewall</option><option value="pdu">PDU</option><option value="other">Other</option>
              </select></div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} data-testid="input-device-description" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls} data-testid="select-device-status">
                <option value="active">Active</option><option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option><option value="decommissioned">Decommissioned</option>
              </select></div>
            <div><label className="text-xs text-slate-500 block mb-1">Customer</label>
              <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className={inputCls} data-testid="select-device-customer">
                <option value="">— None —</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Linked Service</label>
              <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className={inputCls} data-testid="select-device-service">
                <option value="">— None —</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="text-xs text-slate-500 block mb-1">Parent Device</label>
              <select value={form.parentDeviceId} onChange={(e) => setForm({ ...form, parentDeviceId: e.target.value })} className={inputCls} data-testid="select-device-parent">
                <option value="">— None —</option>
                {devices.filter(d => d.id !== editing?.id).map((d: any) => <option key={d.id} value={d.id}>{d.name} (#{d.deviceNumber})</option>)}
              </select></div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-700 block mb-2">Location</span>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500 block mb-1">Facility</label><input value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })} className={inputCls} data-testid="input-device-facility" /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Zone</label><input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className={inputCls} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Cage</label><input value={form.cage} onChange={(e) => setForm({ ...form, cage: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              <div><label className="text-xs text-slate-500 block mb-1">Row</label><input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} className={inputCls} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Rack</label><input value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} className={inputCls} data-testid="input-device-rack" /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Position (U)</label><input value={form.rackPosition} onChange={(e) => setForm({ ...form, rackPosition: e.target.value })} className={inputCls} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Height (U)</label><input value={form.rackUnits} onChange={(e) => setForm({ ...form, rackUnits: e.target.value })} className={inputCls} /></div>
            </div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Tags (comma-separated)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputCls} /></div>
          <div><label className="text-xs text-slate-500 block mb-1">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary} data-testid="button-save-device">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailView({ token, customerId, onBack }: { token: string | null; customerId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", role: "", isPrimary: false });
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [contactBadges, setContactBadges] = useState<Record<string, any[]>>({});
  const [showBadgeForm, setShowBadgeForm] = useState<string | null>(null);
  const [newBadge, setNewBadge] = useState({ deviceId: "", facility: "", accessLevel: "escorted", notes: "", expiresAt: "" });

  async function loadContactBadges(contactId: string) {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}/access-badges`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const badges = await res.json();
        setContactBadges(prev => ({ ...prev, [contactId]: badges }));
      }
    } catch {}
  }

  async function handleAddBadge(contactId: string) {
    try {
      const body: any = { contactId, accessLevel: newBadge.accessLevel, notes: newBadge.notes || null };
      if (newBadge.deviceId) body.deviceId = newBadge.deviceId;
      if (newBadge.facility) body.facility = newBadge.facility;
      if (newBadge.expiresAt) body.expiresAt = new Date(newBadge.expiresAt).toISOString();
      const res = await fetch(`/api/admin/contacts/${contactId}/access-badges`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewBadge({ deviceId: "", facility: "", accessLevel: "escorted", notes: "", expiresAt: "" });
        setShowBadgeForm(null);
        loadContactBadges(contactId);
        toast({ title: "Access badge added" });
      }
    } catch { toast({ title: "Error", description: "Failed to add badge", variant: "destructive" }); }
  }

  async function handleDeleteBadge(contactId: string, badgeId: string) {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}/access-badges/${badgeId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { loadContactBadges(contactId); toast({ title: "Badge removed" }); }
    } catch { toast({ title: "Error", description: "Failed to delete badge", variant: "destructive" }); }
  }

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        setContacts(data.contacts || []);
        setNotes(data.notes || []);
      }
    } catch { toast({ title: "Error", description: "Failed to load customer detail", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadDetail(); }, [customerId]);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: newNote, isPublic: true }),
      });
      if (res.ok) { setNewNote(""); loadDetail(); toast({ title: "Note added" }); }
    } catch { toast({ title: "Error", description: "Failed to add note", variant: "destructive" }); }
    finally { setAddingNote(false); }
  }

  async function handleAddContact() {
    if (!newContact.name.trim()) return;
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/contacts`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newContact),
      });
      if (res.ok) { setNewContact({ name: "", email: "", phone: "", role: "", isPrimary: false }); setShowContactForm(false); loadDetail(); toast({ title: "Contact added" }); }
    } catch { toast({ title: "Error", description: "Failed to add contact", variant: "destructive" }); }
  }

  async function handleDeleteContact(contactId: string) {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/contacts/${contactId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { loadDetail(); toast({ title: "Contact removed" }); }
    } catch {}
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading client detail...</div>;
  }

  if (!detail) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Client not found</div>;
  }

  const cust = detail;
  const users = detail.users || [];
  const custServices = detail.services || [];
  const custTickets = detail.tickets || [];
  const custDevices = detail.devices || [];
  const custInvoices = detail.invoices || [];
  const invoiceBalance = detail.invoiceBalance || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="customer-detail-view">
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-5 flex-shrink-0 gap-3">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1" data-testid="button-back-customers">
          <ArrowLeft className="w-4 h-4" />Back to Customers
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <span className="text-sm font-semibold text-slate-900">Client #{cust.clientNumber}: {cust.name}</span>
        <div className="flex-1" />
        <StatusBadge status={cust.active ? "active" : "suspended"} showDot />
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold text-slate-900">General Information</span></div>
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              <div><span className="text-slate-500">Client #:</span> <span className="text-slate-900 ml-1 font-mono">#{cust.clientNumber}</span></div>
              <div><span className="text-slate-500">Account Type:</span> <span className="text-slate-900 ml-1 capitalize">{cust.accountType || "standard"}</span></div>
              <div><span className="text-slate-500">Company:</span> <span className="text-slate-900 ml-1 font-medium">{cust.name}</span></div>
              <div><span className="text-slate-500">Contact:</span> <span className="text-slate-900 ml-1">{cust.contactName || "—"}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="text-slate-900 ml-1">{cust.email || "—"}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="text-slate-900 ml-1">{cust.phone || "—"}</span></div>
              <div><span className="text-slate-500">Fax:</span> <span className="text-slate-900 ml-1">{cust.fax || "—"}</span></div>
              <div><span className="text-slate-500">Website:</span> <span className="text-slate-900 ml-1">{cust.website || "—"}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="text-slate-900 ml-1">{[cust.address, cust.city, cust.state, cust.zip].filter(Boolean).join(", ") || "—"}</span></div>
              {cust.tags && <div className="col-span-2"><span className="text-slate-500">Tags:</span> <span className="text-slate-900 ml-1">{cust.tags}</span></div>}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-slate-900">Billing Summary</span></div>
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              <div><span className="text-slate-500">Payment Terms:</span> <span className="text-slate-900 ml-1">{cust.paymentTerms || "Net 30"}</span></div>
              <div><span className="text-slate-500">Billing Method:</span> <span className="text-slate-900 ml-1 capitalize">{cust.billingMethod || "invoice"}</span></div>
              <div><span className="text-slate-500">Discount:</span> <span className="text-slate-900 ml-1">{cust.discount || "0"}%</span></div>
              <div><span className="text-slate-500">Grace Period:</span> <span className="text-slate-900 ml-1">{cust.gracePeriod || 0} days</span></div>
              <div><span className="text-slate-500">Delivery:</span> <span className="text-slate-900 ml-1 capitalize">{cust.deliveryMethod || "email"}</span></div>
              <div><span className="text-slate-500">Outstanding:</span> <span className={`ml-1 font-semibold ${invoiceBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>${Number(invoiceBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div><span className="text-slate-500">Total Invoices:</span> <span className="text-slate-900 ml-1">{custInvoices.length}</span></div>
              <div><span className="text-slate-500">Active Services:</span> <span className="text-slate-900 ml-1">{custServices.filter((s: any) => s.status === "active").length}</span></div>
            </div>
          </div>
          {(cust.contractStatus || cust.contractStartDate) && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><FileText className="w-4 h-4 text-violet-600" /><span className="text-sm font-semibold text-slate-900">Contract Details</span></div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                <div><span className="text-slate-500">Status:</span> <span className="text-slate-900 ml-1 capitalize">{cust.contractStatus || "—"}</span></div>
                <div><span className="text-slate-500">Term:</span> <span className="text-slate-900 ml-1">{cust.contractTermMonths ? `${cust.contractTermMonths} months` : "—"}</span></div>
                <div><span className="text-slate-500">Start:</span> <span className="text-slate-900 ml-1">{cust.contractStartDate ? new Date(cust.contractStartDate).toLocaleDateString() : "—"}</span></div>
                <div><span className="text-slate-500">End:</span> <span className="text-slate-900 ml-1">{cust.contractEndDate ? new Date(cust.contractEndDate).toLocaleDateString() : "—"}</span></div>
              </div>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold text-slate-900">Authorized Contacts ({contacts.length})</span></div>
              <button onClick={() => setShowContactForm(!showContactForm)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid="button-add-contact"><Plus className="w-3.5 h-3.5" />Add</button>
            </div>
            <div className="p-4">
              {showContactForm && (
                <div className="mb-3 p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Name" className={inputCls} data-testid="input-contact-name" />
                    <input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email" className={inputCls} data-testid="input-contact-email" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone" className={inputCls} />
                    <input value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} placeholder="Role (e.g. CTO)" className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddContact} className={btnPrimary} data-testid="button-save-contact">Add Contact</button>
                    <button onClick={() => setShowContactForm(false)} className={btnSecondary}>Cancel</button>
                  </div>
                </div>
              )}
              {contacts.length === 0 ? <div className="text-xs text-slate-400 italic">No authorized contacts</div> : (
                <div className="space-y-0" data-testid="table-contacts">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Email</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Phone</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Role</th>
                      <th className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Badges</th>
                      <th className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3"></th>
                    </tr></thead>
                    <tbody>
                      {contacts.map((c: any, i: number) => (
                        <React.Fragment key={c.id}>
                          <tr className={`border-b border-slate-100 cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"} hover:bg-blue-50/30`}
                            onClick={() => { const newId = expandedContactId === c.id ? null : c.id; setExpandedContactId(newId); if (newId) loadContactBadges(c.id); }}
                            data-testid={`row-contact-${c.id}`}>
                            <td className="text-[13px] text-slate-900 py-2 px-3">{c.name}{c.isPrimary && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Primary</span>}</td>
                            <td className="text-[13px] text-slate-500 py-2 px-3">{c.email || "—"}</td>
                            <td className="text-[13px] text-slate-500 py-2 px-3">{c.phone || "—"}</td>
                            <td className="text-[13px] text-slate-500 py-2 px-3">{c.role || "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{contactBadges[c.id]?.length || 0}</span>
                            </td>
                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleDeleteContact(c.id)} className="text-red-600 hover:text-red-700 text-xs" data-testid={`button-delete-contact-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                          {expandedContactId === c.id && (
                            <tr><td colSpan={6} className="p-0">
                              <div className="bg-slate-50 border-t border-b border-slate-200 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-600" />Access Badges for {c.name}</span>
                                  <button onClick={() => setShowBadgeForm(showBadgeForm === c.id ? null : c.id)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid={`button-add-badge-${c.id}`}><Plus className="w-3 h-3" />Add Badge</button>
                                </div>
                                {showBadgeForm === c.id && (
                                  <div className="mb-3 p-3 bg-white rounded-md border border-slate-200 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Device</label>
                                        <select value={newBadge.deviceId} onChange={(e) => setNewBadge({ ...newBadge, deviceId: e.target.value })} className={inputCls} data-testid="select-badge-device">
                                          <option value="">— Facility-level only —</option>
                                          {(detail?.devices || []).map((d: any) => <option key={d.id} value={d.id}>#{d.deviceNumber} - {d.name}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Facility</label>
                                        <input value={newBadge.facility} onChange={(e) => setNewBadge({ ...newBadge, facility: e.target.value })} placeholder="e.g. NAP of Americas" className={inputCls} data-testid="input-badge-facility" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Access Level</label>
                                        <select value={newBadge.accessLevel} onChange={(e) => setNewBadge({ ...newBadge, accessLevel: e.target.value })} className={inputCls} data-testid="select-badge-access">
                                          <option value="escorted">Escorted</option>
                                          <option value="unescorted">Unescorted</option>
                                          <option value="restricted">Restricted</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Expires</label>
                                        <input type="date" value={newBadge.expiresAt} onChange={(e) => setNewBadge({ ...newBadge, expiresAt: e.target.value })} className={inputCls} />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-0.5">Notes</label>
                                        <input value={newBadge.notes} onChange={(e) => setNewBadge({ ...newBadge, notes: e.target.value })} placeholder="Optional notes" className={inputCls} />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleAddBadge(c.id)} className={btnPrimary} data-testid="button-save-badge">Add Badge</button>
                                      <button onClick={() => setShowBadgeForm(null)} className={btnSecondary}>Cancel</button>
                                    </div>
                                  </div>
                                )}
                                {(contactBadges[c.id] || []).length === 0 ? (
                                  <div className="text-xs text-slate-400 italic">No access badges assigned</div>
                                ) : (
                                  <table className="w-full">
                                    <thead><tr className="border-b border-slate-200">
                                      <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2">Device / Facility</th>
                                      <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2">Access Level</th>
                                      <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2">Issued</th>
                                      <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2">Expires</th>
                                      <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2">Status</th>
                                      <th className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1.5 px-2"></th>
                                    </tr></thead>
                                    <tbody>
                                      {(contactBadges[c.id] || []).map((b: any) => {
                                        const isExpired = b.expiresAt && new Date(b.expiresAt) < new Date();
                                        return (
                                          <tr key={b.id} className="border-b border-slate-100">
                                            <td className="text-[12px] text-slate-900 py-1.5 px-2">
                                              {b.deviceName ? <span>#{b.deviceNumber} - {b.deviceName}</span> : <span className="italic text-slate-500">Facility only</span>}
                                              {b.facility && <span className="ml-1 text-[10px] text-slate-400">({b.facility})</span>}
                                            </td>
                                            <td className="text-[12px] py-1.5 px-2">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${b.accessLevel === "unescorted" ? "bg-green-100 text-green-700" : b.accessLevel === "restricted" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                {b.accessLevel}
                                              </span>
                                            </td>
                                            <td className="text-[12px] text-slate-500 py-1.5 px-2">{new Date(b.issuedAt).toLocaleDateString()}</td>
                                            <td className="text-[12px] text-slate-500 py-1.5 px-2">{b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : "Never"}</td>
                                            <td className="text-[12px] py-1.5 px-2">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isExpired ? "bg-red-100 text-red-700" : b.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                {isExpired ? "Expired" : b.active ? "Active" : "Inactive"}
                                              </span>
                                            </td>
                                            <td className="py-1.5 px-2 text-center">
                                              <button onClick={() => handleDeleteBadge(c.id, b.id)} className="text-red-600 hover:text-red-700 text-xs" data-testid={`button-delete-badge-${b.id}`}><Trash2 className="w-3 h-3" /></button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td></tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold text-slate-900">User Accounts ({users.length})</span></div>
            <div className="p-4">
              {users.length === 0 ? <div className="text-xs text-slate-400 italic">No user accounts</div> : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Username</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Email</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u: any, i: number) => (
                      <tr key={u.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} data-testid={`row-user-${u.id}`}>
                        <td className="text-[13px] text-slate-900 py-2 px-3">{u.name}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3">{u.username}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3"><StatusBadge status={u.active ? "active" : "suspended"} showDot /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Server className="w-4 h-4 text-teal-600" /><span className="text-sm font-semibold text-slate-900">Services ({custServices.length})</span></div>
            <div className="p-4">
              {custServices.length === 0 ? <div className="text-xs text-slate-400 italic">No services</div> : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Service</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Type</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                    <th className="text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Monthly</th>
                  </tr></thead>
                  <tbody>
                    {custServices.map((s: any, i: number) => (
                      <tr key={s.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="text-[13px] text-slate-900 py-2 px-3 font-medium">{s.name}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3 capitalize">{s.type}</td>
                        <td className="py-2 px-3"><StatusBadge status={s.status} showDot /></td>
                        <td className="text-[13px] text-slate-900 py-2 px-3 text-right">${s.monthlyPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Ticket className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold text-slate-900">Recent Tickets ({custTickets.length})</span></div>
            <div className="p-4">
              {custTickets.length === 0 ? <div className="text-xs text-slate-400 italic">No tickets</div> : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Ticket #</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Subject</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Priority</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                  </tr></thead>
                  <tbody>
                    {custTickets.map((t: any, i: number) => (
                      <tr key={t.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="text-[13px] text-slate-500 py-2 px-3 font-mono">#{t.ticketNumber || t.id}</td>
                        <td className="text-[13px] text-slate-900 py-2 px-3 font-medium">{t.subject}</td>
                        <td className="py-2 px-3"><StatusBadge status={t.priority} /></td>
                        <td className="py-2 px-3"><StatusBadge status={t.status} showDot /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Monitor className="w-4 h-4 text-slate-600" /><span className="text-sm font-semibold text-slate-900">Devices ({custDevices.length})</span></div>
            <div className="p-4">
              {custDevices.length === 0 ? <div className="text-xs text-slate-400 italic">No devices</div> : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Device #</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Type</th>
                    <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Status</th>
                  </tr></thead>
                  <tbody>
                    {custDevices.map((d: any, i: number) => (
                      <tr key={d.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="text-[13px] text-slate-500 py-2 px-3 font-mono">#{d.deviceNumber}</td>
                        <td className="text-[13px] text-slate-900 py-2 px-3 font-medium">{d.name}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3 capitalize">{d.deviceType}</td>
                        <td className="py-2 px-3"><StatusBadge status={d.status} showDot /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm col-span-full">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><StickyNote className="w-4 h-4 text-slate-600" /><span className="text-sm font-semibold text-slate-900">Notes & Comments ({notes.length})</span></div>
            <div className="p-4">
              <div className="mb-3 flex gap-2">
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." className={`${inputCls} flex-1`} data-testid="input-customer-note" />
                <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote} className={btnPrimary} data-testid="button-add-note">
                  <Plus className="w-4 h-4" />{addingNote ? "Adding..." : "Add Note"}
                </button>
              </div>
              {notes.length === 0 ? <div className="text-xs text-slate-400 italic">No notes yet</div> : (
                <div className="space-y-2">
                  {notes.map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-md border border-slate-200" data-testid={`note-${n.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{n.authorName || "Admin"}</span>
                        <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-[13px] text-slate-800">{n.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ open, onOpenChange, editingInvoice, customers, token, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; editingInvoice: InvoiceData | null;
  customers: CustomerOption[]; token: string | null; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "", invoiceNumber: "", status: "draft",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: "", tax: "0", total: "",
  });

  useEffect(() => {
    if (open) {
      if (editingInvoice) {
        setFormData({
          userId: editingInvoice.userId, invoiceNumber: editingInvoice.invoiceNumber, status: editingInvoice.status,
          issueDate: new Date(editingInvoice.issueDate).toISOString().split("T")[0],
          dueDate: new Date(editingInvoice.dueDate).toISOString().split("T")[0],
          subtotal: editingInvoice.subtotal, tax: editingInvoice.tax, total: editingInvoice.total,
        });
      } else {
        setFormData({
          userId: customers[0]?.id || "", invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, status: "draft",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          subtotal: "", tax: "0", total: "",
        });
      }
    }
  }, [open, editingInvoice, customers]);

  useEffect(() => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax) || 0;
    setFormData(prev => ({ ...prev, total: (subtotal + tax).toFixed(2) }));
  }, [formData.subtotal, formData.tax]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingInvoice ? `/api/admin/invoices/${editingInvoice.id}` : "/api/admin/invoices";
      const method = editingInvoice ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, issueDate: new Date(formData.issueDate), dueDate: new Date(formData.dueDate) }),
      });
      if (res.ok) { toast({ title: "Success", description: editingInvoice ? "Invoice updated" : "Invoice created" }); onSuccess(); }
      else { const data = await res.json(); toast({ title: "Error", description: data.error || "Failed to save invoice", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Failed to save invoice", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          <DialogDescription>{editingInvoice ? "Update invoice details" : "Create a new customer invoice"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Customer</label>
              <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.filter(c => c.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-slate-500 block mb-1">Invoice Number</label>
              <input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} className={inputCls} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Issue Date</label><input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className={inputCls} required /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Due Date</label><input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className={inputCls} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-slate-500 block mb-1">Subtotal ($)</label><input type="number" step="0.01" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} className={inputCls} required /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Tax ($)</label><input type="number" step="0.01" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-slate-500 block mb-1">Total ($)</label><input value={formData.total} className={`${inputCls} bg-slate-50`} readOnly /></div>
          </div>
          <div><label className="text-xs text-slate-500 block mb-1">Status</label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem><SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="open">Open</SelectItem><SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => onOpenChange(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={loading} className={btnPrimary}>{loading ? "Saving..." : editingInvoice ? "Update" : "Create"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
