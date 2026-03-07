import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  HardHat,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

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
    <div className="space-y-[6px]" data-testid="permission-grid">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[9px] font-semibold text-[#999] uppercase tracking-wider mb-[2px]">{group.label}</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-[1px]">
            {group.keys.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-[4px] text-[10px] text-[#1e1e1e] cursor-pointer hover:bg-[#eef1f6] px-1 py-[1px]">
                <input
                  type="checkbox"
                  checked={perms[key]}
                  onChange={(e) => onChange({ ...perms, [key]: e.target.checked })}
                  className="h-[10px] w-[10px]"
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

type AdminTicket = {
  id: string;
  subject: string;
  category: "technical" | "billing" | "smart_hands";
  priority: "low" | "normal" | "high" | "urgent";
  status: "new" | "open" | "waiting" | "resolved";
  assignee: string;
  updatedAt: string;
};

type AdminView = "dashboard" | "users" | "services" | "invoices" | "customers";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-[#dff6dd] text-[#1e7b34]",
    suspended: "bg-[#fff4ce] text-[#9d6b00]",
    new: "bg-[#cce4f7] text-[#2563eb]",
    open: "bg-[#cce4f7] text-[#2563eb]",
    waiting: "bg-[#fff4ce] text-[#9d6b00]",
    resolved: "bg-[#dce3ed] text-[#666]",
    low: "bg-[#dce3ed] text-[#666]",
    normal: "bg-[#dce3ed] text-[#666]",
    high: "bg-[#fff4ce] text-[#9d6b00]",
    urgent: "bg-[#fde7e9] text-[#c42b1c]",
    admin: "bg-[#e8daef] text-[#6c3483]",
    customer: "bg-[#cce4f7] text-[#2563eb]",
    pending: "bg-[#fff4ce] text-[#9d6b00]",
    paid: "bg-[#dff6dd] text-[#1e7b34]",
    past_due: "bg-[#fde7e9] text-[#c42b1c]",
    provisioning: "bg-[#cce4f7] text-[#2563eb]",
  };
  return (
    <span className={`inline-block px-[4px] py-[1px] text-[10px] font-medium ${colors[status] || "bg-[#dce3ed] text-[#666]"}`} style={{ lineHeight: "14px" }}>
      {status.replace("_", " ")}
    </span>
  );
}

function DraggableDivider({ onDrag }: { onDrag: (deltaY: number) => void }) {
  const dragging = useRef(false);
  const lastY = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastY.current = e.clientY;
    e.preventDefault();
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = e.clientY - lastY.current;
      lastY.current = e.clientY;
      onDrag(delta);
    }
    function handleMouseUp() {
      dragging.current = false;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="h-[4px] cursor-row-resize bg-[#dce3ed] border-t border-b border-[#b8c4d4] hover:bg-[#2563eb] active:bg-[#2563eb] flex-shrink-0"
      style={{ minHeight: 4 }}
      data-testid="draggable-divider"
    />
  );
}

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const tickets: AdminTicket[] = [
    { id: "t-01", subject: "SmartHands: fiber light levels check", category: "smart_hands", priority: "high", status: "open", assignee: "J. Patel", updatedAt: "25m ago" },
    { id: "t-02", subject: "Billing: refund request for overage", category: "billing", priority: "normal", status: "waiting", assignee: "Billing", updatedAt: "today" },
    { id: "t-03", subject: "Network: cross-connect LOA verification", category: "technical", priority: "urgent", status: "new", assignee: "Unassigned", updatedAt: "8m ago" },
  ];

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllUsers(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (currentView === "users") {
      loadUsers();
    }
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
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => [u.username, u.name, u.email, u.companyName].some((v) => v?.toLowerCase().includes(q)));
  }, [query, allUsers]);

  const viewLabels: Record<AdminView, string> = {
    dashboard: "Dashboard",
    users: "User Management",
    services: "Services",
    invoices: "Invoices & Billing",
    customers: "Customer Accounts",
  };

  const sidebarItems: { section: string; items: { icon: typeof LayoutDashboard; label: string; view?: AdminView; badge?: number }[] }[] = [
    {
      section: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
        { icon: Activity, label: "Live Activity" },
      ],
    },
    {
      section: "Operations",
      items: [
        { icon: HardHat, label: "SmartHands", badge: 2 },
        { icon: Ticket, label: "Tickets", badge: 3 },
        { icon: MapPin, label: "Dispatch" },
      ],
    },
    {
      section: "Business",
      items: [
        { icon: Building2, label: "Customers", view: "customers" },
        { icon: Server, label: "Services", view: "services" },
        { icon: CreditCard, label: "Billing", view: "invoices" },
      ],
    },
    {
      section: "System",
      items: [
        { icon: Users, label: "Users", view: "users", badge: allUsers.length || undefined },
        { icon: Shield, label: "Permissions" },
        { icon: Settings, label: "Settings" },
      ],
    },
  ];

  return (
    <div className="h-dvh flex flex-col bg-[#eef1f6] overflow-hidden" data-testid="page-admin" style={{ fontSize: "11px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Menu bar */}
      <div className="h-[22px] bg-[#1b2a4a] border-b border-[#152240] flex items-center px-2 flex-shrink-0" data-testid="menu-bar">
        <span className="font-semibold text-[11px] text-white mr-4">911-DC Admin</span>
        <div className="flex items-center gap-3 text-[11px] text-[#8ea4c8]">
          <button className="hover:text-white hover:bg-[#243656] px-1">File</button>
          <button className="hover:text-white hover:bg-[#243656] px-1">Edit</button>
          <button className="hover:text-white hover:bg-[#243656] px-1">View</button>
          <button className="hover:text-white hover:bg-[#243656] px-1">Tools</button>
          <button className="hover:text-white hover:bg-[#243656] px-1">Help</button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px] text-[#8ea4c8]">
          <span>{user?.name || "Admin"}</span>
          <button onClick={handleLogout} className="hover:text-white hover:bg-[#243656] px-1" data-testid="button-logout">Sign Out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="h-[26px] bg-[#243656] border-b border-[#1b2a4a] flex items-end px-1 flex-shrink-0" data-testid="tab-bar">
        {(["dashboard", "customers", "services", "invoices", "users"] as AdminView[]).map((v) => (
          <button
            key={v}
            onClick={() => setCurrentView(v)}
            className={`px-3 h-[24px] text-[11px] border border-b-0 mr-[1px] flex items-center ${
              currentView === v
                ? "bg-[#ffffff] text-[#1e1e1e] font-medium border-[#b8c4d4] border-b-[#ffffff] -mb-[1px] z-10"
                : "bg-[#1e3050] text-[#8ea4c8] border-[#1b2a4a] hover:bg-[#2c4060] hover:text-white"
            }`}
            data-testid={`tab-${v}`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Breadcrumb bar */}
      <div className="h-[18px] bg-[#f0f2f5] border-b border-[#b8c4d4] flex items-center px-2 flex-shrink-0 text-[10px] text-[#5a6a82]" data-testid="breadcrumb-bar">
        <span>911-DC</span>
        <ChevronRight className="h-[10px] w-[10px] mx-1" />
        <span>Admin</span>
        <ChevronRight className="h-[10px] w-[10px] mx-1" />
        <span className="text-[#1e1e1e] font-medium">{viewLabels[currentView]}</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-[10px] w-[10px] text-[#8a96a8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-[16px] w-[140px] pl-4 pr-1 text-[10px] bg-[#ffffff] border border-[#b8c4d4] outline-none focus:border-[#2563eb]"
            data-testid="input-global-search"
          />
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[140px] bg-[#2c3e5a] border-r border-[#1b2a4a] flex flex-col overflow-y-auto flex-shrink-0" data-testid="sidebar">
          {sidebarItems.map((group) => (
            <div key={group.section}>
              <div className="px-2 pt-2 pb-[2px] text-[9px] font-semibold text-[#6b8ab5] uppercase tracking-wider">{group.section}</div>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.view && setCurrentView(item.view)}
                  className={`w-full flex items-center gap-[4px] px-2 py-[2px] text-left text-[11px] ${
                    item.view && currentView === item.view
                      ? "bg-[#3b82f6] text-white font-medium"
                      : "text-[#c8d6e5] hover:bg-[#374f6f] hover:text-white"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="h-[12px] w-[12px] flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[9px] text-[#c8d6e5] bg-[#1b2a4a] px-[3px] rounded-sm">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[4px] px-2 py-[3px] text-[11px] text-[#8ea4c8] hover:bg-[#374f6f] hover:text-white border-t border-[#1b2a4a]"
            data-testid="button-sidebar-logout"
          >
            <LogOut className="h-[12px] w-[12px]" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === "dashboard" && <DashboardView tickets={tickets} onManageUsers={() => setCurrentView("users")} />}
          {currentView === "users" && (
            <UsersView
              users={filteredUsers}
              loading={loadingUsers}
              query={query}
              setQuery={setQuery}
              onNewUser={handleNewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
          {currentView === "services" && <ServicesView token={token} />}
          {currentView === "invoices" && <InvoicesView token={token} />}
          {currentView === "customers" && <CustomersView token={token} />}
        </div>
      </div>

      {/* Status bar */}
      <div className="h-[18px] bg-[#1b2a4a] flex items-center px-2 flex-shrink-0 text-[10px] text-[#8ea4c8]" data-testid="status-bar">
        <span>Ready</span>
        <div className="flex-1" />
        <span className="mr-3">{allUsers.length} users</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>

      <UserModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        editingUser={editingUser}
        token={token}
        onSuccess={() => { setShowUserModal(false); loadUsers(); }}
      />
    </div>
  );
}

function DashboardView({ tickets, onManageUsers }: { tickets: AdminTicket[]; onManageUsers: () => void }) {
  const [topHeight, setTopHeight] = useState(260);
  const onDrag = useCallback((delta: number) => {
    setTopHeight((h) => Math.max(100, Math.min(500, h + delta)));
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top panel: Stats + tickets */}
      <div style={{ height: topHeight }} className="flex-shrink-0 overflow-auto bg-[#ffffff]">
        <div className="p-2">
          <div className="text-[12px] font-semibold text-[#1e1e1e] mb-2">Operations Overview</div>
          <div className="grid grid-cols-4 gap-[1px] bg-[#b8c4d4] border border-[#b8c4d4] mb-2">
            {[
              { label: "Open Tickets", value: "3", sub: "1 urgent", color: "#c42b1c" },
              { label: "SmartHands Queue", value: "2", sub: "1 high priority", color: "#9d6b00" },
              { label: "Monthly Revenue", value: "$3,280", sub: "+2 services", color: "#1e7b34" },
              { label: "Active Customers", value: "12", sub: "2 pending", color: "#666" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#ffffff] p-2">
                <div className="text-[9px] text-[#666] uppercase tracking-wide">{stat.label}</div>
                <div className="text-[16px] font-bold text-[#1e1e1e]">{stat.value}</div>
                <div className="text-[9px]" style={{ color: stat.color }}>{stat.sub}</div>
              </div>
            ))}
          </div>
          <table className="w-full border-collapse" data-testid="table-tickets">
            <thead>
              <tr className="bg-[#dce3ed]">
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Subject</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Category</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Priority</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Status</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Assignee</th>
                <th className="text-right text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr key={t.id} className={`${i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} hover:bg-[#d4e4f7] cursor-pointer`} data-testid={`row-ticket-${t.id}`}>
                  <td className="text-[11px] text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">{t.subject}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4] capitalize">{t.category.replace("_", " ")}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={t.priority} /></td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={t.status} /></td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{t.assignee}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4] text-right">{t.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DraggableDivider onDrag={onDrag} />

      {/* Bottom panel: Quick actions */}
      <div className="flex-1 overflow-auto bg-[#ffffff] border-t-0">
        <div className="p-2">
          <div className="text-[11px] font-semibold text-[#1e1e1e] mb-2">Quick Actions</div>
          <div className="grid grid-cols-6 gap-[1px] bg-[#b8c4d4] border border-[#b8c4d4]">
            {[
              { icon: Building2, label: "Customers" },
              { icon: Server, label: "Services" },
              { icon: FileText, label: "Invoices" },
              { icon: Boxes, label: "Inventory" },
              { icon: HardHat, label: "SmartHands" },
              { icon: Users, label: "Users", onClick: onManageUsers },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="bg-[#ffffff] hover:bg-[#d4e4f7] p-2 flex flex-col items-center gap-1"
                data-testid={`button-quick-${action.label.toLowerCase()}`}
              >
                <action.icon className="h-[14px] w-[14px] text-[#2563eb]" />
                <span className="text-[10px] text-[#1e1e1e]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersView({
  users,
  loading,
  query,
  setQuery,
  onNewUser,
  onEditUser,
  onDeleteUser,
}: {
  users: UserData[];
  loading: boolean;
  query: string;
  setQuery: (q: string) => void;
  onNewUser: () => void;
  onEditUser: (u: UserData) => void;
  onDeleteUser: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topHeight, setTopHeight] = useState(300);
  const onDrag = useCallback((delta: number) => {
    setTopHeight((h) => Math.max(100, Math.min(600, h + delta)));
  }, []);

  const selectedUser = users.find((u) => u.id === selectedId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-[24px] bg-[#eef1f6] border-b border-[#b8c4d4] flex items-center px-2 flex-shrink-0 gap-2">
        <button onClick={onNewUser} className="flex items-center gap-[3px] text-[10px] text-[#1e1e1e] hover:bg-[#dce3ed] px-1 py-[1px] border border-[#b8c4d4] bg-[#ffffff]" data-testid="button-new-user">
          <Plus className="h-[10px] w-[10px]" />New User
        </button>
        <div className="h-[14px] w-[1px] bg-[#b8c4d4]" />
        <span className="text-[10px] text-[#666]">{users.length} users</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-[10px] w-[10px] text-[#999]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter users..."
            className="h-[18px] w-[150px] pl-4 pr-1 text-[10px] bg-[#ffffff] border border-[#b8c4d4] outline-none focus:border-[#2563eb]"
            data-testid="input-search-users"
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ height: topHeight }} className="flex-shrink-0 overflow-auto bg-[#ffffff]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#666]">
            <Loader2 className="h-4 w-4 animate-spin mr-1" />Loading...
          </div>
        ) : (
          <table className="w-full border-collapse" data-testid="table-users">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#dce3ed]">
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Name</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Username</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Email</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Role</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Permissions</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Company</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Status</th>
                <th className="text-center text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`cursor-pointer ${selectedId === u.id ? "bg-[#cce4f7]" : i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} hover:bg-[#d4e4f7]`}
                  data-testid={`row-user-${u.id}`}
                >
                  <td className="text-[11px] text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">{u.name}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{u.username}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{u.email}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={u.role} /></td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]">
                    {u.role === "customer" ? (
                      <div className="flex flex-wrap gap-[2px]" data-testid={`perms-summary-${u.id}`}>
                        {getPermSummaryBadges(u).map((b) => (
                          <span key={b} className="inline-block px-[3px] py-0 text-[8px] font-medium bg-[#e8daef] text-[#6c3483]" style={{ lineHeight: "12px" }}>{b}</span>
                        ))}
                        {getPermSummaryBadges(u).length === 0 && <span className="text-[9px] text-[#999]">none</span>}
                      </div>
                    ) : (
                      <span className="text-[9px] text-[#999]">all</span>
                    )}
                  </td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{u.companyName || "—"}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={u.active ? "active" : "suspended"} /></td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4] text-center">
                    <button onClick={(e) => { e.stopPropagation(); onEditUser(u); }} className="text-[#2563eb] hover:underline text-[10px] mr-2" data-testid={`button-edit-user-${u.id}`}>Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteUser(u.id); }} className="text-[#c42b1c] hover:underline text-[10px]" data-testid={`button-delete-user-${u.id}`}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DraggableDivider onDrag={onDrag} />

      {/* Detail panel */}
      <div className="flex-1 overflow-auto bg-[#ffffff] p-2">
        {selectedUser ? (
          <div>
            <div className="text-[11px] font-semibold text-[#1e1e1e] mb-1 border-b border-[#b8c4d4] pb-1">User Details - {selectedUser.name}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-[2px] text-[11px]">
              <div><span className="text-[#666]">Username:</span> <span className="text-[#1e1e1e]">{selectedUser.username}</span></div>
              <div><span className="text-[#666]">Email:</span> <span className="text-[#1e1e1e]">{selectedUser.email}</span></div>
              <div><span className="text-[#666]">Role:</span> <span className="text-[#1e1e1e]">{selectedUser.role}</span></div>
              <div><span className="text-[#666]">Company:</span> <span className="text-[#1e1e1e]">{selectedUser.companyName || "—"}</span></div>
              <div><span className="text-[#666]">Status:</span> <span className="text-[#1e1e1e]">{selectedUser.active ? "Active" : "Suspended"}</span></div>
              <div><span className="text-[#666]">Created:</span> <span className="text-[#1e1e1e]">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-[#666]">Last Login:</span> <span className="text-[#1e1e1e]">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Never"}</span></div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[#666] italic">Select a user to view details</div>
        )}
      </div>
    </div>
  );
}

function UserModal({
  open,
  onOpenChange,
  editingUser,
  token,
  onSuccess,
}: {
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
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "customer",
    customerId: "",
    active: true,
  });
  const [perms, setPerms] = useState<PermissionKeys>({ ...DEFAULT_PERMS });

  useEffect(() => {
    if (open && token) {
      fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => setCustomerList(data))
        .catch(() => {});
    }
  }, [open, token]);

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setFormData({
          username: editingUser.username,
          password: "",
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          customerId: editingUser.customerId || "",
          active: editingUser.active,
        });
        setPerms({
          permPortalAccess: editingUser.permPortalAccess ?? true,
          permBillingView: editingUser.permBillingView ?? false,
          permBillingReceiveInvoices: editingUser.permBillingReceiveInvoices ?? false,
          permBillingMakePayments: editingUser.permBillingMakePayments ?? false,
          permServicesView: editingUser.permServicesView ?? false,
          permServicesManage: editingUser.permServicesManage ?? false,
          permTechnicalView: editingUser.permTechnicalView ?? false,
          permTechnicalManage: editingUser.permTechnicalManage ?? false,
          permSupportView: editingUser.permSupportView ?? false,
          permSupportCreate: editingUser.permSupportCreate ?? false,
          permSupportSmarthands: editingUser.permSupportSmarthands ?? false,
          permNotifyMaintenance: editingUser.permNotifyMaintenance ?? false,
          permNotifyBilling: editingUser.permNotifyBilling ?? false,
          permNotifyIncidents: editingUser.permNotifyIncidents ?? false,
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
      if (selectedCustomer) {
        body.companyName = selectedCustomer.name;
      } else {
        body.customerId = null;
        body.companyName = null;
      }
      if (formData.role === "customer") {
        Object.assign(body, perms);
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: editingUser ? "User updated" : "User created" });
        onSuccess();
      } else {
        toast({ title: "Error", description: data.error || "Failed to save user", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save user", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !rounded-none !border !border-[#b8c4d4] !shadow-none !p-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-[#eef1f6] border-b border-[#b8c4d4] px-3 py-[6px]">
          <DialogTitle className="text-[12px] font-semibold text-[#1e1e1e]">{editingUser ? "Edit User" : "New User"}</DialogTitle>
          <DialogDescription className="text-[10px] text-[#666]">
            {editingUser ? "Update user details and permissions" : "Create a new admin or customer account"}
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Username</label>
              <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]" required disabled={!!editingUser} data-testid="input-new-username" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Password {editingUser && <span className="text-[#999]">(blank=keep)</span>}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full h-[22px] px-1 pr-5 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]" required={!editingUser} data-testid="input-new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#1e1e1e]">
                  {showPassword ? <EyeOff className="h-[12px] w-[12px]" /> : <Eye className="h-[12px] w-[12px]" />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Full Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]" required data-testid="input-new-name" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]" required data-testid="input-new-email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">System Role</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]" data-testid="select-role"><SelectValue /></SelectTrigger>
                <SelectContent className="!rounded-none border-[#b8c4d4]">
                  <SelectItem value="customer" className="text-[11px]">Customer</SelectItem>
                  <SelectItem value="admin" className="text-[11px]">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Company</label>
              <Select value={formData.customerId || "none"} onValueChange={(v) => setFormData({ ...formData, customerId: v === "none" ? "" : v })}>
                <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]" data-testid="select-company"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent className="!rounded-none border-[#b8c4d4]">
                  <SelectItem value="none" className="text-[11px]">— None —</SelectItem>
                  {customerList.map((c) => <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-3 w-3" />
            <label htmlFor="active" className="text-[10px] text-[#666]">Account Active</label>
          </div>

          {formData.role === "customer" && (
            <div className="border border-[#b8c4d4] bg-[#fafafa]">
              <div className="bg-[#dce3ed] px-2 py-[3px] flex items-center justify-between border-b border-[#b8c4d4]">
                <span className="text-[10px] font-semibold text-[#1e1e1e]">Portal Permissions</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#666]">Template:</span>
                  <Select value={roleTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="h-[18px] w-[180px] text-[10px] !rounded-none border-[#b8c4d4] bg-white" data-testid="select-role-template"><SelectValue /></SelectTrigger>
                    <SelectContent className="!rounded-none border-[#b8c4d4]">
                      {ROLE_TEMPLATES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-[10px]">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-2">
                <PermissionCheckboxGrid perms={perms} onChange={(p) => { setPerms(p); setRoleTemplate("custom"); }} />
              </div>
              <div className="bg-[#eef1f6] border-t border-[#b8c4d4] px-2 py-[2px] text-[9px] text-[#666]">
                {getActivePermCount(perms)} of 15 permissions enabled
              </div>
            </div>
          )}

          <div className="flex justify-end gap-1 pt-1 border-t border-[#b8c4d4]">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 h-[22px] text-[11px] border border-[#b8c4d4] bg-[#dce3ed] hover:bg-[#c8d3e3] text-[#1e1e1e]">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 h-[22px] text-[11px] border border-[#2563eb] bg-[#2563eb] hover:bg-[#1d4ed8] text-white" data-testid="button-save-user">
              {loading ? "Saving..." : editingUser ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CompanyData = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  notes: string | null;
  active: boolean;
};

type CompanyUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  customerRole: string | null;
  active: boolean;
} & Partial<PermissionKeys>;

function CustomersView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [addToCustomerId, setAddToCustomerId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topHeight, setTopHeight] = useState(300);
  const onDrag = useCallback((delta: number) => {
    setTopHeight((h) => Math.max(100, Math.min(600, h + delta)));
  }, []);

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCompanies(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyUsers(customerId: string) {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setExpandedUsers(data.users || []);
      }
    } catch {
      setExpandedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    if (expandedId !== id) {
      setExpandedId(id);
      loadCompanyUsers(id);
    }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm("Delete this customer and unlink all associated users?")) return;
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "Customer deleted" });
        loadCompanies();
        if (expandedId === id) { setExpandedId(null); setExpandedUsers([]); }
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" });
    }
  }

  async function handleRemoveUser(customerId: string, userId: string) {
    if (!confirm("Remove this user from the customer?")) return;
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "User removed" });
        loadCompanyUsers(customerId);
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove user", variant: "destructive" });
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contactName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === selectedId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="customers-view">
      {/* Toolbar */}
      <div className="h-[24px] bg-[#eef1f6] border-b border-[#b8c4d4] flex items-center px-2 flex-shrink-0 gap-2">
        <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }} className="flex items-center gap-[3px] text-[10px] text-[#1e1e1e] hover:bg-[#dce3ed] px-1 py-[1px] border border-[#b8c4d4] bg-[#ffffff]" data-testid="button-add-customer">
          <Plus className="h-[10px] w-[10px]" />Add Customer
        </button>
        <div className="h-[14px] w-[1px] bg-[#b8c4d4]" />
        <span className="text-[10px] text-[#666]">{companies.length} customers</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-[10px] w-[10px] text-[#999]" />
          <input placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-[18px] w-[150px] pl-4 pr-1 text-[10px] bg-[#ffffff] border border-[#b8c4d4] outline-none focus:border-[#2563eb]" data-testid="input-customer-search" />
        </div>
      </div>

      {/* Table */}
      <div style={{ height: topHeight }} className="flex-shrink-0 overflow-auto bg-[#ffffff]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#666]">Loading...</div>
        ) : (
          <table className="w-full border-collapse" data-testid="table-customers">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#dce3ed]">
                <th className="w-[16px] py-[2px] px-1 border border-[#b8c4d4]"></th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Company Name</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Contact</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Email</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Phone</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Status</th>
                <th className="text-center text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className={`cursor-pointer ${selectedId === c.id ? "bg-[#cce4f7]" : i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} hover:bg-[#d4e4f7]`}
                  data-testid={`card-customer-${c.id}`}
                >
                  <td className="py-[2px] px-1 border border-[#b8c4d4] text-center">
                    {expandedId === c.id ? <ChevronDown className="h-[10px] w-[10px] inline" /> : <ChevronRight className="h-[10px] w-[10px] inline" />}
                  </td>
                  <td className="text-[11px] text-[#1e1e1e] font-medium py-[2px] px-2 border border-[#b8c4d4]">
                    {c.name}
                    {!c.active && <span className="ml-1 text-[9px] text-[#c42b1c]">[Inactive]</span>}
                  </td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{c.contactName || "—"}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{c.email || "—"}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{c.phone || "—"}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={c.active ? "active" : "suspended"} /></td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4] text-center">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCompany(c); setShowCompanyModal(true); }} className="text-[#2563eb] hover:underline text-[10px] mr-2" data-testid={`button-edit-customer-${c.id}`}>Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCompany(c.id); }} className="text-[#c42b1c] hover:underline text-[10px]" data-testid={`button-delete-customer-${c.id}`}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DraggableDivider onDrag={onDrag} />

      {/* Detail panel */}
      <div className="flex-1 overflow-auto bg-[#ffffff] p-2">
        {selectedCompany ? (
          <div>
            <div className="text-[11px] font-semibold text-[#1e1e1e] mb-1 border-b border-[#b8c4d4] pb-1">
              Customer Details - {selectedCompany.name}
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-[2px] text-[11px] mb-2">
              <div><span className="text-[#666]">Address:</span> <span className="text-[#1e1e1e]">{[selectedCompany.address, selectedCompany.city, selectedCompany.state, selectedCompany.zip].filter(Boolean).join(", ") || "—"}</span></div>
              <div><span className="text-[#666]">Contact:</span> <span className="text-[#1e1e1e]">{selectedCompany.contactName || "—"}</span></div>
              <div><span className="text-[#666]">Email:</span> <span className="text-[#1e1e1e]">{selectedCompany.email || "—"}</span></div>
              <div><span className="text-[#666]">Phone:</span> <span className="text-[#1e1e1e]">{selectedCompany.phone || "—"}</span></div>
              <div><span className="text-[#666]">Notes:</span> <span className="text-[#1e1e1e]">{selectedCompany.notes || "—"}</span></div>
            </div>

            <div className="flex items-center justify-between mb-1 border-b border-[#b8c4d4] pb-1">
              <span className="text-[10px] font-semibold text-[#1e1e1e]">Associated Users</span>
              <button onClick={() => { setAddToCustomerId(selectedCompany.id); setShowUserModal(true); }} className="flex items-center gap-[2px] text-[10px] text-[#2563eb] hover:underline" data-testid={`button-add-user-${selectedCompany.id}`}>
                <Plus className="h-[10px] w-[10px]" />Add User
              </button>
            </div>
            {loadingUsers ? (
              <div className="text-[10px] text-[#666]">Loading users...</div>
            ) : expandedUsers.length === 0 ? (
              <div className="text-[10px] text-[#666] italic">No users associated.</div>
            ) : (
              <table className="w-full border-collapse" data-testid="table-customer-users">
                <thead>
                  <tr className="bg-[#dce3ed]">
                    <th className="text-left text-[10px] font-semibold py-[2px] px-2 border border-[#b8c4d4]">Name</th>
                    <th className="text-left text-[10px] font-semibold py-[2px] px-2 border border-[#b8c4d4]">Username</th>
                    <th className="text-left text-[10px] font-semibold py-[2px] px-2 border border-[#b8c4d4]">Email</th>
                    <th className="text-left text-[10px] font-semibold py-[2px] px-2 border border-[#b8c4d4]">Permissions</th>
                    <th className="text-center text-[10px] font-semibold py-[2px] px-2 border border-[#b8c4d4]"></th>
                  </tr>
                </thead>
                <tbody>
                  {expandedUsers.map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} data-testid={`row-customer-user-${u.id}`}>
                      <td className="text-[11px] text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">{u.name}</td>
                      <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{u.username}</td>
                      <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{u.email}</td>
                      <td className="py-[2px] px-2 border border-[#b8c4d4]">
                        <div className="flex flex-wrap gap-[2px]">
                          {getPermSummaryBadges(u).map((b) => (
                            <span key={b} className="inline-block px-[3px] py-0 text-[8px] font-medium bg-[#e8daef] text-[#6c3483]" style={{ lineHeight: "12px" }}>{b}</span>
                          ))}
                          {getPermSummaryBadges(u).length === 0 && <span className="text-[9px] text-[#999]">none</span>}
                        </div>
                      </td>
                      <td className="py-[2px] px-2 border border-[#b8c4d4] text-center">
                        <button onClick={() => handleRemoveUser(selectedCompany.id, u.id)} className="text-[#c42b1c] hover:underline text-[10px]" data-testid={`button-remove-user-${u.id}`}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-[#666] italic">Select a customer to view details</div>
        )}
      </div>

      <CompanyModal open={showCompanyModal} onOpenChange={setShowCompanyModal} editing={editingCompany} token={token} onSuccess={() => { setShowCompanyModal(false); loadCompanies(); }} />
      <CustomerUserModal open={showUserModal} onOpenChange={setShowUserModal} customerId={addToCustomerId} token={token} onSuccess={() => { setShowUserModal(false); if (addToCustomerId) loadCompanyUsers(addToCustomerId); }} />
    </div>
  );
}

function CompanyModal({ open, onOpenChange, editing, token, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CompanyData | null;
  token: string | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", phone: "", email: "", contactName: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, address: editing.address || "", city: editing.city || "", state: editing.state || "", zip: editing.zip || "", phone: editing.phone || "", email: editing.email || "", contactName: editing.contactName || "", notes: editing.notes || "" });
    } else {
      setForm({ name: "", address: "", city: "", state: "", zip: "", phone: "", email: "", contactName: "", notes: "" });
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Company name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/customers/${editing.id}` : "/api/admin/customers";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (res.ok) {
        toast({ title: editing ? "Customer updated" : "Customer created" });
        onSuccess();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save customer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !rounded-none !border !border-[#b8c4d4] !shadow-none !p-0">
        <div className="bg-[#eef1f6] border-b border-[#b8c4d4] px-3 py-[6px]">
          <DialogTitle className="text-[12px] font-semibold text-[#1e1e1e]">{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription className="text-[10px] text-[#666]">{editing ? "Update company details." : "Create a new customer (company)."}</DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <div>
            <label className="text-[10px] text-[#666] block mb-[2px]">Company Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="input-company-name" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] block mb-[2px]">Contact Name</label>
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} data-testid="input-contact-name" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="input-company-email" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} data-testid="input-company-phone" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#666] block mb-[2px]">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} data-testid="input-company-address" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} data-testid="input-company-city" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} data-testid="input-company-state" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">ZIP</label>
              <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} data-testid="input-company-zip" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#666] block mb-[2px]">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} data-testid="input-company-notes" />
          </div>
          <div className="flex justify-end gap-1 pt-1 border-t border-[#b8c4d4]">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 h-[22px] text-[11px] border border-[#b8c4d4] bg-[#dce3ed] hover:bg-[#c8d3e3] text-[#1e1e1e]">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 h-[22px] text-[11px] border border-[#2563eb] bg-[#2563eb] hover:bg-[#1d4ed8] text-white" data-testid="button-save-customer">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerUserModal({ open, onOpenChange, customerId, token, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  token: string | null;
  onSuccess: () => void;
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
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, ...perms }),
      });
      if (res.ok) {
        toast({ title: "User added" });
        onSuccess();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to add user", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add user", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !rounded-none !border !border-[#b8c4d4] !shadow-none !p-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-[#eef1f6] border-b border-[#b8c4d4] px-3 py-[6px]">
          <DialogTitle className="text-[12px] font-semibold text-[#1e1e1e]">Add User to Customer</DialogTitle>
          <DialogDescription className="text-[10px] text-[#666]">Create a new user account linked to this company.</DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="input-user-name" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Username *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} data-testid="input-user-username" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Email *</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="input-user-email" />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} data-testid="input-user-password" />
            </div>
          </div>

          <div className="border border-[#b8c4d4] bg-[#fafafa]">
            <div className="bg-[#dce3ed] px-2 py-[3px] flex items-center justify-between border-b border-[#b8c4d4]">
              <span className="text-[10px] font-semibold text-[#1e1e1e]">Portal Permissions</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#666]">Template:</span>
                <Select value={roleTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="h-[18px] w-[180px] text-[10px] !rounded-none border-[#b8c4d4] bg-white" data-testid="select-role-template"><SelectValue /></SelectTrigger>
                  <SelectContent className="!rounded-none border-[#b8c4d4]">
                    {ROLE_TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-[10px]">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-2">
              <PermissionCheckboxGrid perms={perms} onChange={(p) => { setPerms(p); setRoleTemplate("custom"); }} />
            </div>
            <div className="bg-[#eef1f6] border-t border-[#b8c4d4] px-2 py-[2px] text-[9px] text-[#666]">
              {getActivePermCount(perms)} of 15 permissions enabled
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-1 border-t border-[#b8c4d4]">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 h-[22px] text-[11px] border border-[#b8c4d4] bg-[#dce3ed] hover:bg-[#c8d3e3] text-[#1e1e1e]">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 h-[22px] text-[11px] border border-[#2563eb] bg-[#2563eb] hover:bg-[#1d4ed8] text-white" data-testid="button-save-user">
              {saving ? "Saving..." : "Add User"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ServiceData = {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: string;
  location: string;
  details: string | null;
  monthlyPrice: string;
  startDate: string;
  grafanaUrl?: string | null;
  grafanaDashboardUid?: string | null;
  grafanaPanelId?: string | null;
  grafanaOrgId?: string | null;
  grafanaVar?: string | null;
  snmpHost?: string | null;
  snmpPort?: number | null;
  snmpCommunity?: string | null;
  snmpVersion?: string | null;
  snmpOidStatus?: string | null;
  snmpOidControl?: string | null;
  pduPortNumber?: number | null;
};

type CustomerOption = {
  id: string;
  name: string;
  companyName?: string | null;
};

function ServicesView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topHeight, setTopHeight] = useState(300);
  const onDrag = useCallback((delta: number) => {
    setTopHeight((h) => Math.max(100, Math.min(600, h + delta)));
  }, []);

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setServices(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/api/admin/customer-users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    } catch {}
  }

  useEffect(() => { loadServices(); loadCustomers(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "Success", description: "Service deleted" });
        loadServices();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    }
  }

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => [s.name, s.type, s.location].some((v) => v?.toLowerCase().includes(q)));
  }, [query, services]);

  const selectedService = services.find(s => s.id === selectedId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-[24px] bg-[#eef1f6] border-b border-[#b8c4d4] flex items-center px-2 flex-shrink-0 gap-2">
        <button onClick={() => { setEditingService(null); setShowModal(true); }} className="flex items-center gap-[3px] text-[10px] text-[#1e1e1e] hover:bg-[#dce3ed] px-1 py-[1px] border border-[#b8c4d4] bg-[#ffffff]" data-testid="button-new-service">
          <Plus className="h-[10px] w-[10px]" />New Service
        </button>
        <div className="h-[14px] w-[1px] bg-[#b8c4d4]" />
        <span className="text-[10px] text-[#666]">{services.length} services</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-[10px] w-[10px] text-[#999]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter..." className="h-[18px] w-[150px] pl-4 pr-1 text-[10px] bg-[#ffffff] border border-[#b8c4d4] outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      {/* Table */}
      <div style={{ height: topHeight }} className="flex-shrink-0 overflow-auto bg-[#ffffff]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#666]"><Loader2 className="h-4 w-4 animate-spin mr-1" />Loading...</div>
        ) : (
          <table className="w-full border-collapse" data-testid="table-services">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#dce3ed]">
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Service</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Type</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Location</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Status</th>
                <th className="text-right text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Monthly</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Monitoring</th>
                <th className="text-center text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`cursor-pointer ${selectedId === s.id ? "bg-[#cce4f7]" : i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} hover:bg-[#d4e4f7]`}
                  data-testid={`row-service-${s.id}`}
                >
                  <td className="text-[11px] text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">
                    <div>{s.name}</div>
                    {s.details && <div className="text-[9px] text-[#666]">{s.details}</div>}
                  </td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{s.type}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{s.location}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={s.status} /></td>
                  <td className="text-[11px] text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4] text-right font-medium">${Number(s.monthlyPrice).toFixed(2)}</td>
                  <td className="text-[10px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">
                    {s.grafanaUrl ? "Grafana" : s.snmpHost ? "SNMP/PDU" : "—"}
                  </td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4] text-center">
                    <button onClick={(e) => { e.stopPropagation(); setEditingService(s); setShowModal(true); }} className="text-[#2563eb] hover:underline text-[10px] mr-2">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-[#c42b1c] hover:underline text-[10px]">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DraggableDivider onDrag={onDrag} />

      {/* Detail panel */}
      <div className="flex-1 overflow-auto bg-[#ffffff] p-2">
        {selectedService ? (
          <div>
            <div className="text-[11px] font-semibold text-[#1e1e1e] mb-1 border-b border-[#b8c4d4] pb-1">Service Details - {selectedService.name}</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-[2px] text-[11px] mb-2">
              <div><span className="text-[#666]">Type:</span> <span className="text-[#1e1e1e]">{selectedService.type}</span></div>
              <div><span className="text-[#666]">Location:</span> <span className="text-[#1e1e1e]">{selectedService.location}</span></div>
              <div><span className="text-[#666]">Status:</span> <StatusBadge status={selectedService.status} /></div>
              <div><span className="text-[#666]">Monthly:</span> <span className="text-[#1e1e1e]">${Number(selectedService.monthlyPrice).toFixed(2)}</span></div>
              <div><span className="text-[#666]">Start Date:</span> <span className="text-[#1e1e1e]">{new Date(selectedService.startDate).toLocaleDateString()}</span></div>
              <div><span className="text-[#666]">Details:</span> <span className="text-[#1e1e1e]">{selectedService.details || "—"}</span></div>
            </div>
            {selectedService.grafanaUrl && (
              <div className="mb-2">
                <div className="text-[10px] font-semibold text-[#1e1e1e] border-b border-[#b8c4d4] pb-1 mb-1">Grafana Configuration</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-[2px] text-[11px]">
                  <div><span className="text-[#666]">URL:</span> <span className="text-[#1e1e1e]">{selectedService.grafanaUrl}</span></div>
                  <div><span className="text-[#666]">Dashboard UID:</span> <span className="text-[#1e1e1e]">{selectedService.grafanaDashboardUid || "—"}</span></div>
                  <div><span className="text-[#666]">Panel ID:</span> <span className="text-[#1e1e1e]">{selectedService.grafanaPanelId || "—"}</span></div>
                  <div><span className="text-[#666]">Org ID:</span> <span className="text-[#1e1e1e]">{selectedService.grafanaOrgId || "—"}</span></div>
                  <div><span className="text-[#666]">Variable:</span> <span className="text-[#1e1e1e]">{selectedService.grafanaVar || "—"}</span></div>
                </div>
              </div>
            )}
            {selectedService.snmpHost && (
              <div>
                <div className="text-[10px] font-semibold text-[#1e1e1e] border-b border-[#b8c4d4] pb-1 mb-1">SNMP/PDU Configuration</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-[2px] text-[11px]">
                  <div><span className="text-[#666]">Host:</span> <span className="text-[#1e1e1e]">{selectedService.snmpHost}</span></div>
                  <div><span className="text-[#666]">Port:</span> <span className="text-[#1e1e1e]">{selectedService.snmpPort || 161}</span></div>
                  <div><span className="text-[#666]">Community:</span> <span className="text-[#1e1e1e]">{selectedService.snmpCommunity || "—"}</span></div>
                  <div><span className="text-[#666]">Version:</span> <span className="text-[#1e1e1e]">{selectedService.snmpVersion || "—"}</span></div>
                  <div><span className="text-[#666]">Status OID:</span> <span className="text-[#1e1e1e]">{selectedService.snmpOidStatus || "—"}</span></div>
                  <div><span className="text-[#666]">Control OID:</span> <span className="text-[#1e1e1e]">{selectedService.snmpOidControl || "—"}</span></div>
                  <div><span className="text-[#666]">PDU Port #:</span> <span className="text-[#1e1e1e]">{selectedService.pduPortNumber ?? "—"}</span></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-[#666] italic">Select a service to view details</div>
        )}
      </div>

      <ServiceModal
        open={showModal}
        onOpenChange={setShowModal}
        editingService={editingService}
        customers={customers}
        token={token}
        onSuccess={() => { setShowModal(false); loadServices(); }}
      />
    </div>
  );
}

function ServiceModal({ open, onOpenChange, editingService, customers, token, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: ServiceData | null;
  customers: CustomerOption[];
  token: string | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "grafana" | "snmp">("general");
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    type: "Colocation",
    status: "active",
    location: "iM Critical Miami",
    details: "",
    monthlyPrice: "",
    startDate: new Date().toISOString().split("T")[0],
    grafanaUrl: "",
    grafanaDashboardUid: "",
    grafanaPanelId: "",
    grafanaOrgId: "",
    grafanaVar: "",
    snmpHost: "",
    snmpPort: "161",
    snmpCommunity: "",
    snmpVersion: "v2c",
    snmpOidStatus: "",
    snmpOidControl: "",
    pduPortNumber: "",
  });

  useEffect(() => {
    if (open) {
      setActiveTab("general");
      if (editingService) {
        setFormData({
          userId: editingService.userId,
          name: editingService.name,
          type: editingService.type,
          status: editingService.status,
          location: editingService.location,
          details: editingService.details || "",
          monthlyPrice: editingService.monthlyPrice,
          startDate: new Date(editingService.startDate).toISOString().split("T")[0],
          grafanaUrl: editingService.grafanaUrl || "",
          grafanaDashboardUid: editingService.grafanaDashboardUid || "",
          grafanaPanelId: editingService.grafanaPanelId || "",
          grafanaOrgId: editingService.grafanaOrgId || "",
          grafanaVar: editingService.grafanaVar || "",
          snmpHost: editingService.snmpHost || "",
          snmpPort: String(editingService.snmpPort || 161),
          snmpCommunity: editingService.snmpCommunity || "",
          snmpVersion: editingService.snmpVersion || "v2c",
          snmpOidStatus: editingService.snmpOidStatus || "",
          snmpOidControl: editingService.snmpOidControl || "",
          pduPortNumber: editingService.pduPortNumber != null ? String(editingService.pduPortNumber) : "",
        });
      } else {
        setFormData({
          userId: customers[0]?.id || "",
          name: "",
          type: "Colocation",
          status: "active",
          location: "iM Critical Miami",
          details: "",
          monthlyPrice: "",
          startDate: new Date().toISOString().split("T")[0],
          grafanaUrl: "",
          grafanaDashboardUid: "",
          grafanaPanelId: "",
          grafanaOrgId: "",
          grafanaVar: "",
          snmpHost: "",
          snmpPort: "161",
          snmpCommunity: "",
          snmpVersion: "v2c",
          snmpOidStatus: "",
          snmpOidControl: "",
          pduPortNumber: "",
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
        ...formData,
        startDate: new Date(formData.startDate),
        snmpPort: formData.snmpPort ? parseInt(formData.snmpPort) : null,
        pduPortNumber: formData.pduPortNumber ? parseInt(formData.pduPortNumber) : null,
        grafanaUrl: formData.grafanaUrl || null,
        grafanaDashboardUid: formData.grafanaDashboardUid || null,
        grafanaPanelId: formData.grafanaPanelId || null,
        grafanaOrgId: formData.grafanaOrgId || null,
        grafanaVar: formData.grafanaVar || null,
        snmpHost: formData.snmpHost || null,
        snmpCommunity: formData.snmpCommunity || null,
        snmpVersion: formData.snmpVersion || null,
        snmpOidStatus: formData.snmpOidStatus || null,
        snmpOidControl: formData.snmpOidControl || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Success", description: editingService ? "Service updated" : "Service created" });
        onSuccess();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to save service", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save service", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const locations = [
    "iM Critical Miami", "Equinix Miami", "Digital Realty Miami",
    "365 Data Centers FLL", "EdgeConneX Miami", "QTS MIA1", "CoreSite MI1", "South Reach Networks",
  ];
  const serviceTypes = ["Colocation", "Internet", "Network", "Cross-Connect", "SmartHands", "DDoS Protection"];
  const inputCls = "w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !rounded-none !border !border-[#b8c4d4] !shadow-none !p-0">
        <div className="bg-[#eef1f6] border-b border-[#b8c4d4] px-3 py-[6px]">
          <DialogTitle className="text-[12px] font-semibold text-[#1e1e1e]">{editingService ? "Edit Service" : "New Service"}</DialogTitle>
          <DialogDescription className="text-[10px] text-[#666]">
            {editingService ? "Update service details" : "Create a new customer service"}
          </DialogDescription>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#ececec] border-b border-[#b8c4d4]">
          {(["general", "grafana", "snmp"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-[4px] text-[11px] border-r border-[#b8c4d4] ${
                activeTab === tab ? "bg-[#ffffff] font-medium text-[#1e1e1e]" : "text-[#666] hover:bg-[#eef1f6]"
              }`}
            >
              {tab === "general" ? "General" : tab === "grafana" ? "Grafana" : "SNMP/PDU"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
          {activeTab === "general" && (
            <>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">Customer</label>
                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                  <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent className="!rounded-none border-[#b8c4d4]">
                    {customers.filter(c => c.id).map((c) => <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {customers.length > 0 && customers.filter(c => c.id).length === 0 && (
                  <p className="text-[9px] text-[#c42b1c] mt-[2px]">No companies have users yet. Create a user for a company first.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Service Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required placeholder="e.g., Cabinet C12 (42U)" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Type</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue /></SelectTrigger>
                    <SelectContent className="!rounded-none border-[#b8c4d4]">
                      {serviceTypes.map((t) => <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Location</label>
                  <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                    <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue /></SelectTrigger>
                    <SelectContent className="!rounded-none border-[#b8c4d4]">
                      {locations.map((l) => <SelectItem key={l} value={l} className="text-[11px]">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue /></SelectTrigger>
                    <SelectContent className="!rounded-none border-[#b8c4d4]">
                      <SelectItem value="active" className="text-[11px]">Active</SelectItem>
                      <SelectItem value="provisioning" className="text-[11px]">Provisioning</SelectItem>
                      <SelectItem value="suspended" className="text-[11px]">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">Details</label>
                <input value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className={inputCls} placeholder="e.g., 2kW, 2x 20A circuits" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Monthly Price ($)</label>
                  <input type="number" step="0.01" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputCls} required />
                </div>
              </div>
            </>
          )}

          {activeTab === "grafana" && (
            <>
              <div className="text-[10px] text-[#666] bg-[#eef1f6] border border-[#b8c4d4] p-2 mb-1">
                Configure Grafana panel embedding for network traffic monitoring. The customer portal will display the specified panel as an iframe.
              </div>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">Grafana URL</label>
                <input value={formData.grafanaUrl} onChange={(e) => setFormData({ ...formData, grafanaUrl: e.target.value })} className={inputCls} placeholder="https://grafana.911dc.us" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Dashboard UID</label>
                  <input value={formData.grafanaDashboardUid} onChange={(e) => setFormData({ ...formData, grafanaDashboardUid: e.target.value })} className={inputCls} placeholder="e.g., abc123xyz" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Panel ID</label>
                  <input value={formData.grafanaPanelId} onChange={(e) => setFormData({ ...formData, grafanaPanelId: e.target.value })} className={inputCls} placeholder="e.g., 2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Org ID</label>
                  <input value={formData.grafanaOrgId} onChange={(e) => setFormData({ ...formData, grafanaOrgId: e.target.value })} className={inputCls} placeholder="Optional (e.g., 1)" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Host Variable</label>
                  <input value={formData.grafanaVar} onChange={(e) => setFormData({ ...formData, grafanaVar: e.target.value })} className={inputCls} placeholder="e.g., hostname or host ID" />
                </div>
              </div>
            </>
          )}

          {activeTab === "snmp" && (
            <>
              <div className="text-[10px] text-[#666] bg-[#eef1f6] border border-[#b8c4d4] p-2 mb-1">
                Configure SNMP for PDU port management. Requires read/write community string for reboot capability.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">SNMP Host</label>
                  <input value={formData.snmpHost} onChange={(e) => setFormData({ ...formData, snmpHost: e.target.value })} className={inputCls} placeholder="IP or hostname" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">SNMP Port</label>
                  <input type="number" value={formData.snmpPort} onChange={(e) => setFormData({ ...formData, snmpPort: e.target.value })} className={inputCls} placeholder="161" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">Community String</label>
                  <input value={formData.snmpCommunity} onChange={(e) => setFormData({ ...formData, snmpCommunity: e.target.value })} className={inputCls} placeholder="e.g., private" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] block mb-[2px]">SNMP Version</label>
                  <Select value={formData.snmpVersion} onValueChange={(v) => setFormData({ ...formData, snmpVersion: v })}>
                    <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue /></SelectTrigger>
                    <SelectContent className="!rounded-none border-[#b8c4d4]">
                      <SelectItem value="v1" className="text-[11px]">v1</SelectItem>
                      <SelectItem value="v2c" className="text-[11px]">v2c</SelectItem>
                      <SelectItem value="v3" className="text-[11px]">v3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">Status OID (read port state)</label>
                <input value={formData.snmpOidStatus} onChange={(e) => setFormData({ ...formData, snmpOidStatus: e.target.value })} className={inputCls} placeholder="e.g., 1.3.6.1.4.1.318.1.1.12.3.3.1.1.4" />
              </div>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">Control OID (set port state)</label>
                <input value={formData.snmpOidControl} onChange={(e) => setFormData({ ...formData, snmpOidControl: e.target.value })} className={inputCls} placeholder="e.g., 1.3.6.1.4.1.318.1.1.12.3.3.1.1.4" />
              </div>
              <div>
                <label className="text-[10px] text-[#666] block mb-[2px]">PDU Port Number</label>
                <input type="number" value={formData.pduPortNumber} onChange={(e) => setFormData({ ...formData, pduPortNumber: e.target.value })} className={inputCls} placeholder="Outlet number assigned to customer" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-1 pt-1 border-t border-[#b8c4d4]">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 h-[22px] text-[11px] border border-[#b8c4d4] bg-[#dce3ed] hover:bg-[#c8d3e3] text-[#1e1e1e]">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 h-[22px] text-[11px] border border-[#2563eb] bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
              {loading ? "Saving..." : editingService ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type InvoiceData = {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
};

function InvoicesView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [query, setQuery] = useState("");
  const [billingRunning, setBillingRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topHeight, setTopHeight] = useState(300);
  const onDrag = useCallback((delta: number) => {
    setTopHeight((h) => Math.max(100, Math.min(600, h + delta)));
  }, []);

  async function handleRunBilling() {
    if (!confirm("This will generate invoices for all customers with active services for this month. Continue?")) return;
    setBillingRunning(true);
    try {
      const res = await fetch("/api/admin/billing/run", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Billing Complete",
          description: `${data.generated} invoice(s) generated, ${data.skipped} skipped${data.errors.length > 0 ? `, ${data.errors.length} error(s)` : ""}`,
        });
        loadInvoices();
      } else {
        toast({ title: "Error", description: data.error || "Failed to run billing", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to run billing cycle", variant: "destructive" });
    } finally {
      setBillingRunning(false);
    }
  }

  async function handleDownloadPdf(invoiceId: string, invoiceNumber: string) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
  }

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setInvoices(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/api/admin/customer-users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    } catch {}
  }

  useEffect(() => { loadInvoices(); loadCustomers(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "Success", description: "Invoice deleted" });
        loadInvoices();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" });
    }
  }

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => inv.invoiceNumber.toLowerCase().includes(q));
  }, [query, invoices]);

  const selectedInvoice = invoices.find(inv => inv.id === selectedId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-[24px] bg-[#eef1f6] border-b border-[#b8c4d4] flex items-center px-2 flex-shrink-0 gap-2">
        <button onClick={handleRunBilling} disabled={billingRunning} className="flex items-center gap-[3px] text-[10px] text-[#1e1e1e] hover:bg-[#dce3ed] px-1 py-[1px] border border-[#b8c4d4] bg-[#ffffff] disabled:opacity-50" data-testid="button-run-billing">
          {billingRunning ? <Loader2 className="h-[10px] w-[10px] animate-spin" /> : <CreditCard className="h-[10px] w-[10px]" />}Run Billing
        </button>
        <button onClick={() => { setEditingInvoice(null); setShowModal(true); }} className="flex items-center gap-[3px] text-[10px] text-[#1e1e1e] hover:bg-[#dce3ed] px-1 py-[1px] border border-[#b8c4d4] bg-[#ffffff]" data-testid="button-new-invoice">
          <Plus className="h-[10px] w-[10px]" />New Invoice
        </button>
        <div className="h-[14px] w-[1px] bg-[#b8c4d4]" />
        <span className="text-[10px] text-[#666]">{invoices.length} invoices</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-[10px] w-[10px] text-[#999]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter..." className="h-[18px] w-[150px] pl-4 pr-1 text-[10px] bg-[#ffffff] border border-[#b8c4d4] outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      {/* Table */}
      <div style={{ height: topHeight }} className="flex-shrink-0 overflow-auto bg-[#ffffff]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#666]"><Loader2 className="h-4 w-4 animate-spin mr-1" />Loading...</div>
        ) : (
          <table className="w-full border-collapse" data-testid="table-invoices">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#dce3ed]">
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Invoice #</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Issue Date</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Due Date</th>
                <th className="text-left text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Status</th>
                <th className="text-right text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Total</th>
                <th className="text-center text-[10px] font-semibold text-[#1e1e1e] py-[2px] px-2 border border-[#b8c4d4]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`cursor-pointer ${selectedId === inv.id ? "bg-[#cce4f7]" : i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f0f2f7]"} hover:bg-[#d4e4f7]`}
                  data-testid={`invoice-${inv.id}`}
                >
                  <td className="text-[11px] text-[#1e1e1e] font-medium py-[2px] px-2 border border-[#b8c4d4]">{inv.invoiceNumber}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="text-[11px] text-[#666] py-[2px] px-2 border border-[#b8c4d4]">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4]"><StatusBadge status={inv.status} /></td>
                  <td className="text-[11px] text-[#1e1e1e] font-semibold py-[2px] px-2 border border-[#b8c4d4] text-right">${Number(inv.total).toFixed(2)}</td>
                  <td className="py-[2px] px-2 border border-[#b8c4d4] text-center">
                    <button onClick={(e) => { e.stopPropagation(); handleDownloadPdf(inv.id, inv.invoiceNumber); }} className="text-[#2563eb] hover:underline text-[10px] mr-1" data-testid={`button-download-pdf-${inv.id}`} title="Download PDF">PDF</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingInvoice(inv); setShowModal(true); }} className="text-[#2563eb] hover:underline text-[10px] mr-1">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }} className="text-[#c42b1c] hover:underline text-[10px]">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DraggableDivider onDrag={onDrag} />

      {/* Detail panel */}
      <div className="flex-1 overflow-auto bg-[#ffffff] p-2">
        {selectedInvoice ? (
          <div>
            <div className="text-[11px] font-semibold text-[#1e1e1e] mb-1 border-b border-[#b8c4d4] pb-1">Invoice Details - {selectedInvoice.invoiceNumber}</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-[2px] text-[11px]">
              <div><span className="text-[#666]">Status:</span> <StatusBadge status={selectedInvoice.status} /></div>
              <div><span className="text-[#666]">Issue Date:</span> <span className="text-[#1e1e1e]">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span></div>
              <div><span className="text-[#666]">Due Date:</span> <span className="text-[#1e1e1e]">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></div>
              <div><span className="text-[#666]">Subtotal:</span> <span className="text-[#1e1e1e]">${Number(selectedInvoice.subtotal).toFixed(2)}</span></div>
              <div><span className="text-[#666]">Tax:</span> <span className="text-[#1e1e1e]">${Number(selectedInvoice.tax).toFixed(2)}</span></div>
              <div><span className="text-[#666]">Total:</span> <span className="text-[#1e1e1e] font-semibold">${Number(selectedInvoice.total).toFixed(2)}</span></div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[#666] italic">Select an invoice to view details</div>
        )}
      </div>

      <InvoiceModal
        open={showModal}
        onOpenChange={setShowModal}
        editingInvoice={editingInvoice}
        customers={customers}
        token={token}
        onSuccess={() => { setShowModal(false); loadInvoices(); }}
      />
    </div>
  );
}

function InvoiceModal({ open, onOpenChange, editingInvoice, customers, token, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingInvoice: InvoiceData | null;
  customers: CustomerOption[];
  token: string | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    invoiceNumber: "",
    status: "pending",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: "",
    tax: "0",
    total: "",
  });

  useEffect(() => {
    if (open) {
      if (editingInvoice) {
        setFormData({
          userId: editingInvoice.userId,
          invoiceNumber: editingInvoice.invoiceNumber,
          status: editingInvoice.status,
          issueDate: new Date(editingInvoice.issueDate).toISOString().split("T")[0],
          dueDate: new Date(editingInvoice.dueDate).toISOString().split("T")[0],
          subtotal: editingInvoice.subtotal,
          tax: editingInvoice.tax,
          total: editingInvoice.total,
        });
      } else {
        const nextNum = `INV-${Date.now().toString().slice(-6)}`;
        setFormData({
          userId: customers[0]?.id || "",
          invoiceNumber: nextNum,
          status: "pending",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          subtotal: "",
          tax: "0",
          total: "",
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
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, issueDate: new Date(formData.issueDate), dueDate: new Date(formData.dueDate) }),
      });
      if (res.ok) {
        toast({ title: "Success", description: editingInvoice ? "Invoice updated" : "Invoice created" });
        onSuccess();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to save invoice", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save invoice", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full h-[22px] px-1 text-[11px] border border-[#b8c4d4] bg-[#ffffff] outline-none focus:border-[#2563eb]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !rounded-none !border !border-[#b8c4d4] !shadow-none !p-0">
        <div className="bg-[#eef1f6] border-b border-[#b8c4d4] px-3 py-[6px]">
          <DialogTitle className="text-[12px] font-semibold text-[#1e1e1e]">{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          <DialogDescription className="text-[10px] text-[#666]">
            {editingInvoice ? "Update invoice details" : "Create a new customer invoice"}
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Customer</label>
              <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent className="!rounded-none border-[#b8c4d4]">
                  {customers.filter(c => c.id).map((c) => <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Invoice Number</label>
              <input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Issue Date</label>
              <input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Subtotal ($)</label>
              <input type="number" step="0.01" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Tax ($)</label>
              <input type="number" step="0.01" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-[#666] block mb-[2px]">Total ($)</label>
              <input value={formData.total} className={`${inputCls} bg-[#eef1f6]`} readOnly />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#666] block mb-[2px]">Status</label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger className="h-[22px] text-[11px] !rounded-none border-[#b8c4d4]"><SelectValue /></SelectTrigger>
              <SelectContent className="!rounded-none border-[#b8c4d4]">
                <SelectItem value="pending" className="text-[11px]">Pending</SelectItem>
                <SelectItem value="open" className="text-[11px]">Open</SelectItem>
                <SelectItem value="paid" className="text-[11px]">Paid</SelectItem>
                <SelectItem value="past_due" className="text-[11px]">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-1 pt-1 border-t border-[#b8c4d4]">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 h-[22px] text-[11px] border border-[#b8c4d4] bg-[#dce3ed] hover:bg-[#c8d3e3] text-[#1e1e1e]">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 h-[22px] text-[11px] border border-[#2563eb] bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
              {loading ? "Saving..." : editingInvoice ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
