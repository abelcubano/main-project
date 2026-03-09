import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Globe,
  HardHat,
  Headset,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Server,
  Settings,
  Shield,
  Ticket,
  Save,
  Users,
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
} & Partial<PermissionKeys>;

type AdminView = "dashboard" | "users" | "services" | "invoices" | "customers" | "settings" | "tickets";

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

  function navigateToSection(section: AdminSection) {
    setCurrentSection(section);
    const defaultViews: Record<AdminSection, AdminView> = {
      home: "dashboard",
      clients: "customers",
      support: "tickets",
      devices: "dashboard",
      orders: "services",
      sales: "invoices",
      settings: "settings",
    };
    setCurrentView(defaultViews[section]);
  }

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
        return [{ title: "Devices", items: [{ icon: Server, label: "Coming Soon", id: "devices-placeholder" }] }];
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

  return (
    <>
      <AdminLayout
        currentSection={currentSection}
        onSectionChange={navigateToSection}
        sidebarGroups={sidebarGroups}
        breadcrumbs={breadcrumbs}
        userName={user?.name || "Admin"}
        onLogout={handleLogout}
        supportBadge={openTicketCount}
      >
        {currentView === "dashboard" && (
          <DashboardView
            tickets={allTickets}
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
        {currentView === "customers" && <CustomersView token={token} />}
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

function DashboardView({ tickets, token, onNavigate }: { tickets: any[]; token: string | null; onNavigate: (section: AdminSection) => void }) {
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

          <AdminCard title="Device Manager" subtitle="Coming Soon" icon={Server} accentColor="slate"
            footer={
              <span className="text-[13px] text-slate-400 font-medium flex items-center gap-1">
                Coming Soon
              </span>
            }>
            <KpiRow items={[
              { label: "Locations", value: 8 },
              { label: "Main Hub", value: "iM Critical" },
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
    { key: "role", label: "Role", sortable: true, render: (row) => <StatusBadge status={row.role} /> },
    { key: "permissions", label: "Permissions", render: (row) => (
      row.role === "customer" ? (
        <div className="flex flex-wrap gap-1" data-testid={`perms-summary-${row.id}`}>
          {getPermSummaryBadges(row).map((b) => (
            <span key={b} className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 rounded-full">{b}</span>
          ))}
          {getPermSummaryBadges(row).length === 0 && <span className="text-xs text-slate-400">none</span>}
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
  const [formData, setFormData] = useState({ username: "", password: "", name: "", email: "", role: "customer", customerId: "", active: true });
  const [perms, setPerms] = useState<PermissionKeys>({ ...DEFAULT_PERMS });

  useEffect(() => {
    if (open && token) {
      fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(data => setCustomerList(data)).catch(() => {});
    }
  }, [open, token]);

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
        setRoleTemplate("custom");
      } else {
        setFormData({ username: "", password: "", name: "", email: "", role: "customer", customerId: "", active: true });
        setPerms({ ...DEFAULT_PERMS });
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

function CustomersView({ token }: { token: string | null }) {
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
            onRowClick={(row) => handleSelect(row.id)}
            searchPlaceholder="Search customers..."
            searchKeys={["name", "email", "contactName"]}
            selectedId={selectedId}
            getRowId={(row) => row.id}
            rowTestIdPrefix="customer"
            actions={
              <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className={btnPrimary} data-testid="button-add-customer">
                <Plus className="w-4 h-4" />Add Customer
              </button>
            }
            className="flex-1"
          />
          {selectedCompany && (
            <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0 max-h-[280px] overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Customer Details — {selectedCompany.name}</h3>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-[13px] mb-4">
                <div><span className="text-slate-500">Address:</span> <span className="text-slate-900 ml-1">{[selectedCompany.address, selectedCompany.city, selectedCompany.state, selectedCompany.zip].filter(Boolean).join(", ") || "—"}</span></div>
                <div><span className="text-slate-500">Contact:</span> <span className="text-slate-900 ml-1">{selectedCompany.contactName || "—"}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-slate-900 ml-1">{selectedCompany.email || "—"}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="text-slate-900 ml-1">{selectedCompany.phone || "—"}</span></div>
                <div><span className="text-slate-500">Notes:</span> <span className="text-slate-900 ml-1">{selectedCompany.notes || "—"}</span></div>
              </div>
              <div className="flex items-center justify-between mb-2 border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-900">Associated Users</span>
                <button onClick={() => { setAddToCustomerId(selectedCompany.id); setShowUserModal(true); }} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid={`button-add-user-${selectedCompany.id}`}>
                  <Plus className="w-3.5 h-3.5" />Add User
                </button>
              </div>
              {loadingUsers ? (
                <div className="text-xs text-slate-500">Loading users...</div>
              ) : expandedUsers.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No users associated.</div>
              ) : (
                <table className="w-full" data-testid="table-customer-users">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Name</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Username</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Email</th>
                      <th className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3">Permissions</th>
                      <th className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expandedUsers.map((u, i) => (
                      <tr key={u.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} data-testid={`row-customer-user-${u.id}`}>
                        <td className="text-[13px] text-slate-900 py-2 px-3">{u.name}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3">{u.username}</td>
                        <td className="text-[13px] text-slate-500 py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {getPermSummaryBadges(u).map((b) => (
                              <span key={b} className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 rounded-full">{b}</span>
                            ))}
                            {getPermSummaryBadges(u).length === 0 && <span className="text-xs text-slate-400">none</span>}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button onClick={() => handleRemoveUser(selectedCompany.id, u.id)} className="text-red-600 hover:text-red-700 text-xs font-medium" data-testid={`button-remove-user-${u.id}`}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
          <span className="text-sm font-semibold text-slate-900">Ticket #{ticketDetail.id}: {ticketDetail.subject}</span>
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
    { key: "id", label: "#", width: "60px", sortable: true, render: (row) => <span className="text-slate-500">{row.id}</span> },
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
  const [activeTab, setActiveTab] = useState<"billing" | "email">("billing");
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
