import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Boxes,
  Building2,
  Cable,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Database,
  FileText,
  HardHat,
  Home,
  LayoutDashboard,
  MapPin,
  Search,
  Server,
  Settings,
  Shield,
  Ticket,
  Users,
  Zap,
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

type InventoryItem = {
  id: string;
  name: string;
  owner: "customer" | "datacenter";
  location: string;
  status: "in_service" | "spare" | "retired";
};

type AdminTicket = {
  id: string;
  subject: string;
  category: "technical" | "billing" | "remote_hands";
  priority: "low" | "normal" | "high" | "urgent";
  status: "new" | "open" | "waiting" | "resolved";
  assignee: string;
  updatedAt: string;
};

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

const fade = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

function Pill({ label, tone }: { label: string; tone: "good" | "warn" | "info" | "neutral" | "bad" }) {
  const map: Record<typeof tone, string> = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[tone]}`}>
      {label}
    </span>
  );
}

function SidebarLink({ icon: Icon, label, active, badge }: { icon: typeof Home; label: string; active?: boolean; badge?: number }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-semibold transition-all ${
        active ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-blue-900/70 hover:bg-blue-50 hover:text-blue-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-blue-100 flex flex-col">
      <div className="p-4 border-b border-blue-100">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <HardHat className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-black uppercase italic tracking-tight text-blue-900">SF Smart Hands</div>
              <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Admin Console</div>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-4 pb-2">Overview</div>
        <SidebarLink icon={LayoutDashboard} label="Dashboard" active />
        <SidebarLink icon={Activity} label="Live Activity" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Operations</div>
        <SidebarLink icon={HardHat} label="Smart Hands" badge={2} />
        <SidebarLink icon={Ticket} label="Tickets" badge={3} />
        <SidebarLink icon={MapPin} label="Dispatch" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Business</div>
        <SidebarLink icon={Building2} label="Companies" />
        <SidebarLink icon={Server} label="Services" />
        <SidebarLink icon={CreditCard} label="Billing" />
        <SidebarLink icon={FileText} label="Invoices" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Assets</div>
        <SidebarLink icon={Boxes} label="Inventory" badge={1} />
        <SidebarLink icon={Database} label="Locations" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">System</div>
        <SidebarLink icon={Users} label="Users" />
        <SidebarLink icon={Shield} label="Roles" />
        <SidebarLink icon={Settings} label="Settings" />
      </nav>

      <div className="p-3 border-t border-blue-100">
        <Link href="/">
          <Button variant="outline" className="w-full h-9 border-blue-100 text-blue-900 hover:bg-blue-50 text-xs font-bold">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Home
          </Button>
        </Link>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-blue-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
          <Input
            placeholder="Search companies, tickets, assets..."
            className="h-9 w-80 pl-9 border-blue-100 text-sm bg-blue-50/50 placeholder:text-blue-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
        </Button>
        <Separator orientation="vertical" className="h-6 bg-blue-100" />
        <div className="flex items-center gap-2 pl-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">AD</div>
          <div className="leading-tight">
            <div className="text-xs font-bold text-blue-900">Admin User</div>
            <div className="text-[10px] text-blue-500">Administrator</div>
          </div>
          <ChevronDown className="h-4 w-4 text-blue-400" />
        </div>
      </div>
    </header>
  );
}

export default function AdminPage() {
  const [query, setQuery] = useState("");

  const companies: Company[] = [
    { id: "co-01", name: "ExampleCo", status: "active", users: 4, services: 3, mrr: "$1,840" },
    { id: "co-02", name: "Northbridge Labs", status: "active", users: 2, services: 1, mrr: "$720" },
    { id: "co-03", name: "Kestrel Systems", status: "suspended", users: 1, services: 0, mrr: "$0" },
  ];

  const inventory: InventoryItem[] = [
    { id: "inv-asset-01", name: "Dell R720 (Customer)", owner: "customer", location: "DC-01 Row C C12 U18", status: "in_service" },
    { id: "inv-asset-02", name: "Juniper EX (Datacenter)", owner: "datacenter", location: "DC-01 Row N N02 U42", status: "in_service" },
    { id: "inv-asset-03", name: "Spare PSU - 750W", owner: "datacenter", location: "DC-01 Storage Shelf 3", status: "spare" },
  ];

  const tickets: AdminTicket[] = [
    { id: "adm-t-01", subject: "Smart Hands: fiber light levels check", category: "remote_hands", priority: "high", status: "open", assignee: "J. Patel", updatedAt: "25m ago" },
    { id: "adm-t-02", subject: "Billing: refund request for overage", category: "billing", priority: "normal", status: "waiting", assignee: "Billing", updatedAt: "today" },
    { id: "adm-t-03", subject: "Network: cross-connect LOA verification", category: "technical", priority: "urgent", status: "new", assignee: "Unassigned", updatedAt: "8m ago" },
  ];

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-dvh flex bg-blue-50/30" data-testid="page-admin">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div variants={fade} initial="hidden" animate="show" className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Open Tickets</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">3</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">1 urgent new</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                    <Ticket className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Smart Hands Queue</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">2</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">1 high priority</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                    <HardHat className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Monthly Revenue</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">$3,280</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">+2 services</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Inventory Alerts</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">1</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">Low PSU count</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Tickets Table */}
              <Card className="col-span-8 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-blue-950">Recent Tickets</div>
                    <div className="text-xs text-blue-500 mt-0.5">Assignment + SLA posture</div>
                  </div>
                  <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    New Ticket
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/50 border-blue-100">
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Subject</TableHead>
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Category</TableHead>
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Priority</TableHead>
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Assignee</TableHead>
                        <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider text-right">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((t) => (
                        <TableRow key={t.id} className="border-blue-50 hover:bg-blue-50/30 cursor-pointer">
                          <TableCell className="font-semibold text-blue-900 text-sm">{t.subject}</TableCell>
                          <TableCell className="text-blue-600 text-xs capitalize">{t.category.replace("_", " ")}</TableCell>
                          <TableCell>
                            {t.priority === "urgent" ? <Pill label="urgent" tone="bad" /> : t.priority === "high" ? <Pill label="high" tone="warn" /> : <Pill label={t.priority} tone="neutral" />}
                          </TableCell>
                          <TableCell>
                            {t.status === "new" ? <Pill label="new" tone="info" /> : t.status === "open" ? <Pill label="open" tone="info" /> : t.status === "waiting" ? <Pill label="waiting" tone="warn" /> : <Pill label="resolved" tone="good" />}
                          </TableCell>
                          <TableCell className="text-blue-600 text-xs">{t.assignee}</TableCell>
                          <TableCell className="text-blue-500 text-xs text-right">{t.updatedAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Companies Panel */}
              <Card className="col-span-4 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50">
                  <div className="font-display text-base font-bold text-blue-950">Companies</div>
                  <div className="text-xs text-blue-500 mt-0.5">Quick access</div>
                </div>
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search..."
                      className="h-9 pl-9 border-blue-100 text-sm bg-blue-50/30"
                    />
                  </div>
                  <div className="space-y-2">
                    {filteredCompanies.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl border border-blue-100 bg-blue-50/20 hover:bg-blue-50 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-blue-900 text-sm truncate">{c.name}</div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-blue-500">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.users}</span>
                              <span className="flex items-center gap-1"><Server className="h-3 w-3" /> {c.services}</span>
                            </div>
                          </div>
                          {c.status === "active" ? <Pill label="active" tone="good" /> : <Pill label="suspended" tone="warn" />}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-950">{c.mrr}</span>
                          <ArrowRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-12 gap-6">
              {/* Inventory */}
              <Card className="col-span-6 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-blue-950">Inventory</div>
                    <div className="text-xs text-blue-500 mt-0.5">Physical assets + location</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50">
                    Add Asset
                  </Button>
                </div>
                <div className="p-4 space-y-2">
                  {inventory.map((i) => (
                    <div key={i.id} className="p-3 rounded-xl border border-blue-100 bg-blue-50/20 hover:bg-blue-50 transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-blue-900 text-sm">{i.name}</div>
                          <div className="text-[10px] text-blue-500 mt-1">{i.location}</div>
                        </div>
                        {i.status === "in_service" ? <Pill label="in service" tone="good" /> : i.status === "spare" ? <Pill label="spare" tone="neutral" /> : <Pill label="retired" tone="warn" />}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{i.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="col-span-6 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50">
                  <div className="font-display text-base font-bold text-blue-950">Quick Actions</div>
                  <div className="text-xs text-blue-500 mt-0.5">Jump to common tasks</div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Building2, label: "Companies" },
                      { icon: Zap, label: "Services" },
                      { icon: FileText, label: "Invoices" },
                      { icon: Boxes, label: "Inventory" },
                      { icon: HardHat, label: "Smart Hands" },
                      { icon: Shield, label: "Roles" },
                    ].map((action, i) => (
                      <Button key={i} variant="outline" className="h-20 flex-col gap-2 border-blue-100 text-blue-900 hover:bg-blue-50 hover:border-blue-200">
                        <action.icon className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-bold">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
