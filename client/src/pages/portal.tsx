import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Cable,
  ChevronDown,
  ClipboardList,
  Clock,
  Cpu,
  CreditCard,
  FileText,
  HardHat,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Network,
  Plus,
  Search,
  Server,
  Settings,
  Ticket,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type InvoiceStatus = "draft" | "open" | "paid" | "void" | "past_due";

type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  date: string;
  total: string;
};

type TicketPriority = "low" | "normal" | "high" | "urgent";

type Ticket = {
  id: string;
  subject: string;
  category: "technical" | "billing" | "remote_hands";
  priority: TicketPriority;
  status: "new" | "open" | "waiting" | "resolved";
  updatedAt: string;
};

type Service = {
  id: string;
  name: string;
  kind: "colo" | "power" | "cross_connect" | "ip" | "bandwidth" | "managed";
  status: "active" | "provisioning" | "suspended";
  location: string;
  summary: string;
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
              <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Customer Portal</div>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-4 pb-2">Overview</div>
        <SidebarLink icon={LayoutDashboard} label="Dashboard" active />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Services</div>
        <SidebarLink icon={Server} label="My Services" badge={3} />
        <SidebarLink icon={MapPin} label="Locations" />
        <SidebarLink icon={Network} label="Network" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Billing</div>
        <SidebarLink icon={FileText} label="Invoices" badge={1} />
        <SidebarLink icon={CreditCard} label="Payments" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Support</div>
        <SidebarLink icon={Ticket} label="My Tickets" badge={3} />
        <SidebarLink icon={Cable} label="Smart Hands" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 pt-6 pb-2">Account</div>
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
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">ExampleCo • DC-01</Badge>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
          <Plus className="mr-2 h-3.5 w-3.5" />
          New Ticket
        </Button>
        <Separator orientation="vertical" className="h-6 bg-blue-100" />
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50 relative">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 pl-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">JD</div>
          <div className="leading-tight">
            <div className="text-xs font-bold text-blue-900">John Doe</div>
            <div className="text-[10px] text-blue-500">ExampleCo</div>
          </div>
          <ChevronDown className="h-4 w-4 text-blue-400" />
        </div>
      </div>
    </header>
  );
}

export default function PortalPage() {
  const [query, setQuery] = useState("");

  const services: Service[] = [
    { id: "svc-001", name: "Cabinet C12 (42U)", kind: "colo", status: "active", location: "DC-01 • Row C • C12", summary: "2kW allocation • 2x 20A circuits" },
    { id: "svc-002", name: "Power Circuit A-20A-214", kind: "power", status: "active", location: "DC-01 • PDU A • Feed 214", summary: "20A @ 208V • Metered" },
    { id: "svc-003", name: "Cross-connect: MMF LC", kind: "cross_connect", status: "provisioning", location: "DC-01 • MMR • Panel 7", summary: "Delivery ETA 2–3 days" },
  ];

  const invoices: Invoice[] = [
    { id: "inv-01", number: "INV-10241", status: "paid", date: "2026-01-05", total: "$1,840.00" },
    { id: "inv-02", number: "INV-10302", status: "open", date: "2026-02-01", total: "$1,840.00" },
    { id: "inv-03", number: "INV-10310", status: "past_due", date: "2025-12-01", total: "$120.00" },
  ];

  const tickets: Ticket[] = [
    { id: "t-001", subject: "Request: install replacement SSD in server R720", category: "remote_hands", priority: "normal", status: "open", updatedAt: "2h ago" },
    { id: "t-002", subject: "Billing question: credit applied to INV-10310", category: "billing", priority: "low", status: "waiting", updatedAt: "yesterday" },
    { id: "t-003", subject: "Network issue: packet loss on cross-connect", category: "technical", priority: "urgent", status: "new", updatedAt: "10m ago" },
  ];

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => [s.name, s.kind, s.location, s.summary].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

  return (
    <div className="min-h-dvh flex bg-blue-50/30" data-testid="page-portal">
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
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Active Services</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">3</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">1 provisioning</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                    <Cpu className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Open Invoices</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">1</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">Next auto-bill: Feb 3</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">My Tickets</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">3</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">1 urgent</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-blue-100 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Smart Hands</div>
                    <div className="mt-2 text-3xl font-display font-black text-blue-950 tracking-tight">2</div>
                    <div className="mt-1 text-[11px] font-medium text-blue-600">Active requests</div>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <HardHat className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Services */}
              <Card className="col-span-8 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-blue-950">My Services</div>
                    <div className="text-xs text-blue-500 mt-0.5">Active allocations and provisioning</div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search services..."
                      className="h-9 w-56 pl-9 border-blue-100 text-sm bg-blue-50/30"
                    />
                  </div>
                </div>
                <div className="p-4 grid gap-3">
                  {filteredServices.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 hover:bg-blue-50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="font-bold text-blue-900 text-sm">{s.name}</div>
                            {s.status === "active" ? <Pill label="active" tone="good" /> : s.status === "provisioning" ? <Pill label="provisioning" tone="info" /> : <Pill label="suspended" tone="warn" />}
                          </div>
                          <div className="text-xs text-blue-500 mt-1">{s.location}</div>
                          <div className="text-xs text-blue-600/70 mt-2">{s.summary}</div>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] font-bold uppercase">{s.kind.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="col-span-4 border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50">
                  <div className="font-display text-base font-bold text-blue-950">Quick Actions</div>
                  <div className="text-xs text-blue-500 mt-0.5">Common requests</div>
                </div>
                <div className="p-4 space-y-2">
                  <Button className="w-full justify-start h-11 bg-blue-600 hover:bg-blue-700 text-white">
                    <LifeBuoy className="mr-3 h-4 w-4" />
                    <span className="flex-1 text-left text-sm font-bold">Open Support Ticket</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-11 border-blue-200 text-blue-900 hover:bg-blue-50">
                    <Cable className="mr-3 h-4 w-4 text-blue-600" />
                    <span className="flex-1 text-left text-sm font-bold">Request Smart Hands</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-11 border-blue-200 text-blue-900 hover:bg-blue-50">
                    <CreditCard className="mr-3 h-4 w-4 text-blue-600" />
                    <span className="flex-1 text-left text-sm font-bold">Update Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <Separator className="bg-blue-100" />

                <div className="p-4 space-y-3">
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                      <MapPin className="h-3.5 w-3.5" />
                      Primary Site
                    </div>
                    <div className="mt-2 font-bold text-blue-900 text-sm">DC-01 • MMR access included</div>
                    <div className="text-[10px] text-blue-500 mt-1">24/7 badge + scheduled escort</div>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                      <Network className="h-3.5 w-3.5" />
                      Network
                    </div>
                    <div className="mt-2 font-bold text-blue-900 text-sm">10Gb cross-connect ready</div>
                    <div className="text-[10px] text-blue-500 mt-1">IPv4 + IPv6 allocations available</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Invoices */}
              <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-blue-950">Recent Invoices</div>
                    <div className="text-xs text-blue-500 mt-0.5">Billing history</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50">
                    View All
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50 border-blue-100">
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Invoice</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-blue-50 hover:bg-blue-50/30 cursor-pointer">
                        <TableCell className="font-semibold text-blue-900 text-sm">{inv.number}</TableCell>
                        <TableCell className="text-blue-600 text-xs">{inv.date}</TableCell>
                        <TableCell>
                          {inv.status === "paid" ? <Pill label="paid" tone="good" /> : inv.status === "open" ? <Pill label="open" tone="info" /> : inv.status === "past_due" ? <Pill label="past due" tone="warn" /> : <Pill label={inv.status} tone="neutral" />}
                        </TableCell>
                        <TableCell className="text-blue-950 text-sm font-bold text-right">{inv.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Tickets */}
              <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="font-display text-base font-bold text-blue-950">My Tickets</div>
                    <div className="text-xs text-blue-500 mt-0.5">Recent activity</div>
                  </div>
                  <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    New Ticket
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50 border-blue-100">
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Subject</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Priority</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-blue-600 text-[10px] font-bold uppercase tracking-wider text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id} className="border-blue-50 hover:bg-blue-50/30 cursor-pointer">
                        <TableCell className="font-semibold text-blue-900 text-sm max-w-[200px] truncate">{t.subject}</TableCell>
                        <TableCell>
                          {t.priority === "urgent" ? <Pill label="urgent" tone="bad" /> : t.priority === "high" ? <Pill label="high" tone="warn" /> : <Pill label={t.priority} tone="neutral" />}
                        </TableCell>
                        <TableCell>
                          {t.status === "new" ? <Pill label="new" tone="info" /> : t.status === "open" ? <Pill label="open" tone="info" /> : t.status === "waiting" ? <Pill label="waiting" tone="warn" /> : <Pill label="resolved" tone="good" />}
                        </TableCell>
                        <TableCell className="text-blue-500 text-xs text-right">{t.updatedAt}</TableCell>
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
