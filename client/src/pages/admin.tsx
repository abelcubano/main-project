import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  CreditCard,
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
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

type UserData = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
};

type AdminTicket = {
  id: string;
  subject: string;
  category: "technical" | "billing" | "smart_hands";
  priority: "low" | "normal" | "high" | "urgent";
  status: "new" | "open" | "waiting" | "resolved";
  assignee: string;
  updatedAt: string;
};

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

const fade = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

function StatusBadge({ status, type }: { status: string; type: "status" | "priority" | "role" }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspended: "bg-amber-50 text-amber-700 border-amber-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-600 border-slate-200",
    low: "bg-slate-50 text-slate-600 border-slate-200",
    normal: "bg-slate-50 text-slate-600 border-slate-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    urgent: "bg-rose-50 text-rose-700 border-rose-200",
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    customer: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function NavItem({ icon: Icon, label, active, badge, onClick }: { icon: typeof LayoutDashboard; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs font-medium transition-all ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${active ? "bg-white/20" : "bg-blue-100 text-blue-700"}`}>{badge}</span>
      )}
    </button>
  );
}

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<"dashboard" | "users" | "services" | "invoices">("dashboard");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
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
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
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
    if (!q) return users;
    return users.filter((u) => [u.username, u.name, u.email, u.companyName].some((v) => v?.toLowerCase().includes(q)));
  }, [query, users]);

  return (
    <div className="min-h-dvh flex bg-slate-50" data-testid="page-admin">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <HardHat className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-900">911-DC</div>
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Admin Console</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-2">Overview</div>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === "dashboard"} onClick={() => setCurrentView("dashboard")} />
          <NavItem icon={Activity} label="Live Activity" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Operations</div>
          <NavItem icon={HardHat} label="SmartHands" badge={2} />
          <NavItem icon={Ticket} label="Tickets" badge={3} />
          <NavItem icon={MapPin} label="Dispatch" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Business</div>
          <NavItem icon={Building2} label="Customers" />
          <NavItem icon={Server} label="Services" active={currentView === "services"} onClick={() => setCurrentView("services")} />
          <NavItem icon={CreditCard} label="Billing" />
          <NavItem icon={FileText} label="Invoices" active={currentView === "invoices"} onClick={() => setCurrentView("invoices")} />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">System</div>
          <NavItem icon={Users} label="Users" active={currentView === "users"} onClick={() => setCurrentView("users")} badge={users.length || undefined} />
          <NavItem icon={Shield} label="Permissions" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-3 border-t border-slate-100">
          <Button variant="ghost" onClick={handleLogout} className="w-full h-8 text-xs text-slate-600 hover:text-slate-900 justify-start" data-testid="button-logout">
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search..." className="h-8 w-64 pl-8 text-xs border-slate-200 bg-slate-50" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            </Button>
            <Separator orientation="vertical" className="h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "AD"}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium text-slate-900">{user?.name || "Admin"}</div>
                <div className="text-[10px] text-slate-500">Administrator</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard/Users/Services/Invoices Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {currentView === "dashboard" && (
            <DashboardView tickets={tickets} onManageUsers={() => setCurrentView("users")} />
          )}
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
          {currentView === "services" && (
            <ServicesView token={token} />
          )}
          {currentView === "invoices" && (
            <InvoicesView token={token} />
          )}
        </main>
      </div>

      {/* User Modal */}
      <UserModal 
        open={showUserModal}
        onOpenChange={setShowUserModal}
        editingUser={editingUser}
        token={token}
        onSuccess={() => {
          setShowUserModal(false);
          loadUsers();
        }}
      />
    </div>
  );
}

function DashboardView({ tickets, onManageUsers }: { tickets: AdminTicket[]; onManageUsers: () => void }) {
  return (
    <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Operations overview and quick actions</p>
        </div>
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Open Tickets</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">3</div>
              <div className="mt-0.5 text-[10px] text-slate-500">1 urgent</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">SmartHands Queue</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">2</div>
              <div className="mt-0.5 text-[10px] text-slate-500">1 high priority</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <HardHat className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Monthly Revenue</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">$3,280</div>
              <div className="mt-0.5 text-[10px] text-emerald-600">+2 services</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Active Customers</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">12</div>
              <div className="mt-0.5 text-[10px] text-slate-500">2 pending</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Tickets</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Active requests requiring attention</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-blue-600 hover:text-blue-700">
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-slate-100">
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Subject</TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Priority</TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Assignee</TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50 cursor-pointer">
                <TableCell className="text-xs font-medium text-slate-900">{t.subject}</TableCell>
                <TableCell className="text-xs text-slate-600 capitalize">{t.category.replace("_", " ")}</TableCell>
                <TableCell><StatusBadge status={t.priority} type="priority" /></TableCell>
                <TableCell><StatusBadge status={t.status} type="status" /></TableCell>
                <TableCell className="text-xs text-slate-600">{t.assignee}</TableCell>
                <TableCell className="text-xs text-slate-500 text-right">{t.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-6 gap-3">
          {[
            { icon: Building2, label: "Customers" },
            { icon: Server, label: "Services" },
            { icon: FileText, label: "Invoices" },
            { icon: Boxes, label: "Inventory" },
            { icon: HardHat, label: "SmartHands" },
            { icon: Users, label: "Users", onClick: onManageUsers },
          ].map((action, i) => (
            <Button key={i} variant="outline" onClick={action.onClick} className="h-16 flex-col gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300">
              <action.icon className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function UsersView({ 
  users, 
  loading, 
  query, 
  setQuery, 
  onNewUser, 
  onEditUser, 
  onDeleteUser 
}: { 
  users: UserData[]; 
  loading: boolean;
  query: string;
  setQuery: (q: string) => void;
  onNewUser: () => void;
  onEditUser: (u: UserData) => void;
  onDeleteUser: (id: string) => void;
}) {
  return (
    <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Create and manage admin and customer accounts</p>
        </div>
        <Button size="sm" onClick={onNewUser} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" data-testid="button-new-user">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New User
        </Button>
      </div>

      <Card className="border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search users..." 
              className="h-8 w-64 pl-8 text-xs border-slate-200" 
              data-testid="input-search-users"
            />
          </div>
          <div className="text-xs text-slate-500">{users.length} users</div>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-slate-100">
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">User</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Role</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Company</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Last Login</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <div className="text-xs font-medium text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.username} · {u.email}</div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={u.role} type="role" /></TableCell>
                  <TableCell className="text-xs text-slate-600">{u.companyName || "—"}</TableCell>
                  <TableCell><StatusBadge status={u.active ? "active" : "suspended"} type="status" /></TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditUser(u)} 
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        data-testid={`button-edit-user-${u.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDeleteUser(u.id)} 
                        className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                        data-testid={`button-delete-user-${u.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </motion.div>
  );
}

function UserModal({ 
  open, 
  onOpenChange, 
  editingUser, 
  token,
  onSuccess 
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
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "customer",
    companyName: "",
    active: true,
  });

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setFormData({
          username: editingUser.username,
          password: "",
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          companyName: editingUser.companyName || "",
          active: editingUser.active,
        });
      } else {
        setFormData({
          username: "",
          password: "",
          name: "",
          email: "",
          role: "customer",
          companyName: "",
          active: true,
        });
      }
    }
  }, [open, editingUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";
      
      const body: any = { ...formData };
      if (editingUser && !body.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editingUser ? "Edit User" : "New User"}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {editingUser ? "Update user details" : "Create a new admin or customer account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-9 text-sm"
                required
                disabled={!!editingUser}
                data-testid="input-new-username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Password {editingUser && <span className="text-slate-400">(leave blank to keep)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-9 text-sm pr-9"
                  required={!editingUser}
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm"
                required
                data-testid="input-new-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 text-sm"
                required
                data-testid="input-new-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-medium">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-9 text-sm" data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs font-medium">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="h-9 text-sm"
                placeholder="Optional"
                data-testid="input-new-company"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="active" className="text-xs font-medium">Account Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-9 bg-blue-600 hover:bg-blue-700 text-xs" data-testid="button-save-user">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingUser ? "Update" : "Create")}
            </Button>
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
};

type CustomerOption = {
  id: string;
  name: string;
  companyName: string | null;
};

function ServicesView({ token }: { token: string | null }) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [query, setQuery] = useState("");

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setServices(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch {}
  }

  useEffect(() => {
    loadServices();
    loadCustomers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  return (
    <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Services</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer services and allocations</p>
        </div>
        <Button size="sm" onClick={() => { setEditingService(null); setShowModal(true); }} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" data-testid="button-new-service">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Service
        </Button>
      </div>

      <Card className="border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services..." className="h-8 w-64 pl-8 text-xs border-slate-200" />
          </div>
          <div className="text-xs text-slate-500">{services.length} services</div>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-slate-100">
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Service</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Location</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Monthly</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((s) => (
                <TableRow key={s.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <div className="text-xs font-medium text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.details}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{s.type}</TableCell>
                  <TableCell className="text-xs text-slate-600">{s.location}</TableCell>
                  <TableCell><StatusBadge status={s.status} type="status" /></TableCell>
                  <TableCell className="text-xs font-medium text-slate-900">${Number(s.monthlyPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingService(s); setShowModal(true); }} className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ServiceModal
        open={showModal}
        onOpenChange={setShowModal}
        editingService={editingService}
        customers={customers}
        token={token}
        onSuccess={() => { setShowModal(false); loadServices(); }}
      />
    </motion.div>
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
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    type: "Colocation",
    status: "active",
    location: "iM Critical Miami",
    details: "",
    monthlyPrice: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
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
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, startDate: new Date(formData.startDate) }),
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
    "iM Critical Miami",
    "Equinix Miami",
    "Digital Realty Miami",
    "365 Data Centers FLL",
    "EdgeConneX Miami",
    "QTS MIA1",
    "CoreSite MI1",
    "South Reach Networks",
  ];

  const serviceTypes = ["Colocation", "Internet", "Network", "Cross-Connect", "SmartHands", "DDoS Protection"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editingService ? "Edit Service" : "New Service"}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {editingService ? "Update service details" : "Create a new customer service"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Customer</Label>
            <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.companyName && `(${c.companyName})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Service Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 text-sm" required placeholder="e.g., Cabinet C12 (42U)" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Location</Label>
              <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="provisioning">Provisioning</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Details</Label>
            <Input value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className="h-9 text-sm" placeholder="e.g., 2kW · 2x 20A circuits" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Monthly Price ($)</Label>
              <Input type="number" step="0.01" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} className="h-9 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Start Date</Label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-9 text-sm" required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">Cancel</Button>
            <Button type="submit" disabled={loading} className="h-9 bg-blue-600 hover:bg-blue-700 text-xs">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingService ? "Update" : "Create")}
            </Button>
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

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch {
      toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch {}
  }

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  return (
    <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer invoices and billing</p>
        </div>
        <Button size="sm" onClick={() => { setEditingInvoice(null); setShowModal(true); }} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" data-testid="button-new-invoice">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Invoice
        </Button>
      </div>

      <Card className="border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices..." className="h-8 w-64 pl-8 text-xs border-slate-200" />
          </div>
          <div className="text-xs text-slate-500">{invoices.length} invoices</div>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-slate-100">
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Invoice #</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Issue Date</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Due Date</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Total</TableHead>
                <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-xs font-medium text-slate-900">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-xs text-slate-600">{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={inv.status} type="status" /></TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">${Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingInvoice(inv); setShowModal(true); }} className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InvoiceModal
        open={showModal}
        onOpenChange={setShowModal}
        editingInvoice={editingInvoice}
        customers={customers}
        token={token}
        onSuccess={() => { setShowModal(false); loadInvoices(); }}
      />
    </motion.div>
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
        body: JSON.stringify({
          ...formData,
          issueDate: new Date(formData.issueDate),
          dueDate: new Date(formData.dueDate),
        }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {editingInvoice ? "Update invoice details" : "Create a new customer invoice"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Customer</Label>
              <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.companyName && `(${c.companyName})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Invoice Number</Label>
              <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} className="h-9 text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Issue Date</Label>
              <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="h-9 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Due Date</Label>
              <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="h-9 text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subtotal ($)</Label>
              <Input type="number" step="0.01" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} className="h-9 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tax ($)</Label>
              <Input type="number" step="0.01" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Total ($)</Label>
              <Input value={formData.total} className="h-9 text-sm bg-slate-50" readOnly />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">Cancel</Button>
            <Button type="submit" disabled={loading} className="h-9 bg-blue-600 hover:bg-blue-700 text-xs">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingInvoice ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
