import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Bell,
  Cable,
  ChevronDown,
  CreditCard,
  FileText,
  Globe,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  Network,
  Phone,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Ticket,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type Invoice = {
  id: string;
  number: string;
  status: "paid" | "open" | "past_due";
  date: string;
  total: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: "technical" | "billing" | "smart_hands";
  priority: "low" | "normal" | "high" | "urgent";
  status: "new" | "open" | "waiting" | "resolved";
  updatedAt: string;
};

type Service = {
  id: string;
  name: string;
  type: string;
  status: "active" | "provisioning" | "suspended";
  location: string;
  details: string;
};

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

const fade = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    provisioning: "bg-blue-50 text-blue-700 border-blue-200",
    suspended: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    past_due: "bg-rose-50 text-rose-700 border-rose-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status.replace("_", " ")}
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

export default function PortalPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  async function handleLogout() {
    await logout();
    setLocation("/portal/login");
  }

  const services: Service[] = [
    { id: "svc-001", name: "Cabinet C12 (42U)", type: "Colocation", status: "active", location: "iM Critical Miami", details: "2kW · 2x 20A circuits" },
    { id: "svc-002", name: "DIA 100Mbps", type: "Internet", status: "active", location: "iM Critical Miami", details: "Dedicated Internet Access" },
    { id: "svc-003", name: "Cross-connect MMF LC", type: "Network", status: "provisioning", location: "iM Critical Miami", details: "ETA 2-3 business days" },
  ];

  const invoices: Invoice[] = [
    { id: "inv-01", number: "INV-10241", status: "paid", date: "2026-01-05", total: "$1,840.00" },
    { id: "inv-02", number: "INV-10302", status: "open", date: "2026-02-01", total: "$1,840.00" },
    { id: "inv-03", number: "INV-10310", status: "past_due", date: "2025-12-01", total: "$120.00" },
  ];

  const tickets: Ticket[] = [
    { id: "t-001", subject: "SmartHands: install replacement SSD", category: "smart_hands", priority: "normal", status: "open", updatedAt: "2h ago" },
    { id: "t-002", subject: "Billing: credit applied to INV-10310", category: "billing", priority: "low", status: "waiting", updatedAt: "yesterday" },
    { id: "t-003", subject: "Network: packet loss on cross-connect", category: "technical", priority: "urgent", status: "new", updatedAt: "10m ago" },
  ];

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => [s.name, s.type, s.location].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

  return (
    <div className="min-h-dvh flex bg-slate-50" data-testid="page-portal">
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
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Customer Portal</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-2">Overview</div>
          <NavItem icon={LayoutDashboard} label="Dashboard" active />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Services</div>
          <NavItem icon={Server} label="My Services" badge={3} />
          <NavItem icon={MapPin} label="Locations" />
          <NavItem icon={Network} label="Network" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Billing</div>
          <NavItem icon={FileText} label="Invoices" badge={1} />
          <NavItem icon={CreditCard} label="Payments" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Support</div>
          <NavItem icon={Ticket} label="My Tickets" badge={3} />
          <NavItem icon={Cable} label="SmartHands" />

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Account</div>
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
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">ExampleCo</span>
            <span className="text-[10px] text-slate-400">Account #1001</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Request
            </Button>
            <Separator orientation="vertical" className="h-5 bg-slate-200" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium text-slate-900">{user?.name || "User"}</div>
                <div className="text-[10px] text-slate-500">{user?.companyName || "Customer"}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
            {/* Page Header */}
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage your services, billing, and support</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Active Services</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">3</div>
                    <div className="mt-0.5 text-[10px] text-blue-600">1 provisioning</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Server className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Open Invoices</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">1</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">Due Feb 15</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Active Tickets</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">3</div>
                    <div className="mt-0.5 text-[10px] text-rose-600">1 urgent</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <Ticket className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">SmartHands</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">2</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">Active requests</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <HardHat className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-5">
              {/* Services */}
              <Card className="col-span-8 border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">My Services</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Active allocations and provisioning</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-7 w-40 pl-7 text-xs border-slate-200" />
                  </div>
                </div>
                <div className="p-4 grid gap-3">
                  {filteredServices.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{s.name}</span>
                            <StatusBadge status={s.status} />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{s.location}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{s.details}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">{s.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="col-span-4 border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Common requests</p>
                </div>
                <div className="p-4 space-y-2">
                  <Button className="w-full justify-start h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    <Ticket className="mr-2 h-3.5 w-3.5" />
                    <span className="flex-1 text-left">Open Support Ticket</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-9 border-slate-200 text-slate-700 text-xs hover:bg-slate-50">
                    <Cable className="mr-2 h-3.5 w-3.5 text-blue-600" />
                    <span className="flex-1 text-left">Request SmartHands</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-9 border-slate-200 text-slate-700 text-xs hover:bg-slate-50">
                    <CreditCard className="mr-2 h-3.5 w-3.5 text-blue-600" />
                    <span className="flex-1 text-left">Update Payment</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Separator className="bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                      <MapPin className="h-3 w-3" />
                      Primary Site
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-slate-900">iM Critical Miami</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">24/7 badge access</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                      <Globe className="h-3 w-3" />
                      Network
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-slate-900">100Mbps DIA Active</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">IPv4 + IPv6 allocated</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-5">
              {/* Invoices */}
              <Card className="border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Recent Invoices</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Billing history</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-blue-600 hover:text-blue-700">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-slate-100">
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Invoice</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Date</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <TableCell className="text-xs font-medium text-slate-900">{inv.number}</TableCell>
                        <TableCell className="text-xs text-slate-600">{inv.date}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900 text-right">{inv.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Tickets */}
              <Card className="border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">My Tickets</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Recent activity</p>
                  </div>
                  <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700 text-white text-[10px]">
                    New Ticket
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-slate-100">
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Subject</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <TableCell className="text-xs font-medium text-slate-900 max-w-[200px] truncate">{t.subject}</TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell className="text-xs text-slate-500 text-right">{t.updatedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
