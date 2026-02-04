import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Ticket,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type Company = {
  id: string;
  name: string;
  status: "active" | "suspended";
  users: number;
  services: number;
  mrr: string;
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

function StatusBadge({ status, type }: { status: string; type: "status" | "priority" }) {
  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspended: "bg-amber-50 text-amber-700 border-amber-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const priorityColors: Record<string, string> = {
    low: "bg-slate-50 text-slate-600 border-slate-200",
    normal: "bg-slate-50 text-slate-600 border-slate-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    urgent: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const colors = type === "priority" ? priorityColors : statusColors;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function NavItem({ icon: Icon, label, active, badge }: { icon: typeof LayoutDashboard; label: string; active?: boolean; badge?: number }) {
  return (
    <button className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs font-medium transition-all ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${active ? "bg-white/20" : "bg-blue-100 text-blue-700"}`}>{badge}</span>
      )}
    </button>
  );
}

export default function AdminPage() {
  const [query, setQuery] = useState("");

  const companies: Company[] = [
    { id: "co-01", name: "ExampleCo", status: "active", users: 4, services: 3, mrr: "$1,840" },
    { id: "co-02", name: "Northbridge Labs", status: "active", users: 2, services: 1, mrr: "$720" },
    { id: "co-03", name: "Kestrel Systems", status: "suspended", users: 1, services: 0, mrr: "$0" },
  ];

  const tickets: AdminTicket[] = [
    { id: "t-01", subject: "SmartHands: fiber light levels check", category: "smart_hands", priority: "high", status: "open", assignee: "J. Patel", updatedAt: "25m ago" },
    { id: "t-02", subject: "Billing: refund request for overage", category: "billing", priority: "normal", status: "waiting", assignee: "Billing", updatedAt: "today" },
    { id: "t-03", subject: "Network: cross-connect LOA verification", category: "technical", priority: "urgent", status: "new", assignee: "Unassigned", updatedAt: "8m ago" },
  ];

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

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
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Activity} label="Live Activity" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Operations</div>
          <NavItem icon={HardHat} label="SmartHands" badge={2} />
          <NavItem icon={Ticket} label="Tickets" badge={3} />
          <NavItem icon={MapPin} label="Dispatch" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Business</div>
          <NavItem icon={Building2} label="Customers" />
          <NavItem icon={Server} label="Services" />
          <NavItem icon={CreditCard} label="Billing" />
          <NavItem icon={FileText} label="Invoices" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Assets</div>
          <NavItem icon={Boxes} label="Inventory" badge={1} />
          <NavItem icon={MapPin} label="Locations" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">System</div>
          <NavItem icon={Users} label="Users" />
          <NavItem icon={Shield} label="Permissions" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-3 border-t border-slate-100">
          <Link href="/">
            <Button variant="ghost" className="w-full h-8 text-xs text-slate-600 hover:text-slate-900 justify-start">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Exit to Website
            </Button>
          </Link>
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
              <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">AD</div>
              <div className="leading-tight">
                <div className="text-xs font-medium text-slate-900">Admin</div>
                <div className="text-[10px] text-slate-500">Administrator</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
            {/* Page Header */}
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

            {/* Stats Row */}
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

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-5">
              {/* Tickets Table */}
              <Card className="col-span-8 border-slate-200 bg-white overflow-hidden">
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

              {/* Customers Panel */}
              <Card className="col-span-4 border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">Customers</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Quick access</p>
                </div>
                <div className="p-3">
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-8 pl-7 text-xs border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    {filteredCompanies.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">{c.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span>{c.users} users</span>
                              <span>·</span>
                              <span>{c.services} services</span>
                            </div>
                          </div>
                          <StatusBadge status={c.status} type="status" />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900">{c.mrr}</span>
                          <span className="text-[10px] text-slate-400">MRR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-6 gap-3">
                {[
                  { icon: Building2, label: "Customers" },
                  { icon: Server, label: "Services" },
                  { icon: FileText, label: "Invoices" },
                  { icon: Boxes, label: "Inventory" },
                  { icon: HardHat, label: "SmartHands" },
                  { icon: MapPin, label: "Locations" },
                ].map((action, i) => (
                  <Button key={i} variant="outline" className="h-16 flex-col gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300">
                    <action.icon className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
