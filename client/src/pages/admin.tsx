import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Building2,
  Cable,
  CheckCircle2,
  CircleSlash2,
  Clock,
  CreditCard,
  Database,
  FileText,
  HardHat,
  Search,
  Server,
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
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

function Pill({ label, tone }: { label: string; tone: "good" | "warn" | "info" | "neutral" | "bad" }) {
  const map: Record<typeof tone, string> = {
    good: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
    warn: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    info: "bg-sky-500/15 text-sky-200 border-sky-500/25",
    neutral: "bg-white/10 text-white/75 border-white/10",
    bad: "bg-rose-500/15 text-rose-200 border-rose-500/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${map[tone]}`} data-testid={`pill-${label}`}>
      {label}
    </span>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" data-testid="page-admin">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-background/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-admin-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/10" aria-hidden />
            <div>
              <div className="font-display text-sm font-semibold" data-testid="text-admin-title">
                Admin Console
              </div>
              <div className="text-xs text-white/55" data-testid="text-admin-subtitle">
                Ops  Billing  Support  Inventory
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80" data-testid="badge-admin-role">
              Role: Administrator
            </span>
            <Button size="sm" className="h-9" data-testid="button-admin-create">
              Create
            </Button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-hero-grid opacity-60" />
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-hero-noise opacity-[0.35]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">{children}</div>
      </div>
    </div>
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
    { id: "inv-asset-01", name: "Dell R720 (Customer)", owner: "customer", location: "DC-01  Row C  C12  U18", status: "in_service" },
    { id: "inv-asset-02", name: "Juniper EX (Datacenter)", owner: "datacenter", location: "DC-01  Row N  N02  U42", status: "in_service" },
    { id: "inv-asset-03", name: "Spare PSU - 750W", owner: "datacenter", location: "DC-01  Storage  Shelf 3", status: "spare" },
  ];

  const tickets: AdminTicket[] = [
    {
      id: "adm-t-01",
      subject: "Smart Hands: fiber light levels check",
      category: "remote_hands",
      priority: "high",
      status: "open",
      assignee: "J. Patel",
      updatedAt: "25m ago",
    },
    {
      id: "adm-t-02",
      subject: "Billing: refund request for overage",
      category: "billing",
      priority: "normal",
      status: "waiting",
      assignee: "Billing",
      updatedAt: "today",
    },
    {
      id: "adm-t-03",
      subject: "Network: cross-connect LOA verification",
      category: "technical",
      priority: "urgent",
      status: "new",
      assignee: "Unassigned",
      updatedAt: "8m ago",
    },
  ];

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <AdminShell>
      <motion.div variants={fade} initial="hidden" animate="show" className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-12">
          <Card className="border-white/10 bg-white/5 p-5 md:col-span-7" data-testid="card-admin-operational">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-base font-semibold" data-testid="text-admin-overview-title">
                  Operational overview
                </div>
                <div className="text-sm text-white/60" data-testid="text-admin-overview-subtitle">
                  What needs attention right now.
                </div>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <Pill label="SLA" tone="info" />
                <Pill label="Billing" tone="neutral" />
                <Pill label="Inventory" tone="neutral" />
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-admin-open-tickets">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-admin-tickets-label">
                    Open tickets
                  </div>
                  <Ticket className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-admin-tickets-value">
                  2
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-admin-tickets-footnote">
                  1 urgent new
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-admin-mrr">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-admin-mrr-label">
                    MRR
                  </div>
                  <BadgeDollarSign className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-admin-mrr-value">
                  $3,280
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-admin-mrr-footnote">
                  +2 services provisioning
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-admin-inventory-alerts">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-admin-inventory-label">
                    Inventory alerts
                  </div>
                  <Activity className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-admin-inventory-value">
                  1
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-admin-inventory-footnote">
                  low spare PSU count
                </div>
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-white/10 bg-white/5 p-4" data-testid="card-admin-quick-remotehands">
                <div className="flex items-center gap-3">
                  <HardHat className="h-4.5 w-4.5 text-white/70" />
                  <div className="font-display text-sm font-semibold" data-testid="text-admin-remotehands-title">
                    Remote Hands queue
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-admin-remotehands-desc">
                    1 high priority
                  </div>
                  <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-admin-remotehands-open">
                    View
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-4" data-testid="card-admin-billing">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4.5 w-4.5 text-white/70" />
                  <div className="font-display text-sm font-semibold" data-testid="text-admin-billing-title">
                    Billing tasks
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-admin-billing-desc">
                    1 pending refund
                  </div>
                  <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-admin-billing-open">
                    View
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-4" data-testid="card-admin-inventory">
                <div className="flex items-center gap-3">
                  <Database className="h-4.5 w-4.5 text-white/70" />
                  <div className="font-display text-sm font-semibold" data-testid="text-admin-inventory-title">
                    Inventory
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-admin-inventory-desc">
                    3 assets tracked
                  </div>
                  <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-admin-inventory-open">
                    View
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/5 p-5 md:col-span-5" data-testid="card-admin-search">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-base font-semibold" data-testid="text-admin-search-title">
                  Search
                </div>
                <div className="text-sm text-white/60" data-testid="text-admin-search-subtitle">
                  Jump to customers, assets, or services.
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80" data-testid="badge-admin-mock">
                Mock data
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search companies"
                  className="h-10 border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/45"
                  data-testid="input-admin-search"
                />
              </div>

              <div className="grid gap-2" data-testid="list-admin-search-results">
                {filteredCompanies.map((c) => (
                  <Card
                    key={c.id}
                    className="border-white/10 bg-white/5 p-3 hover:bg-white/[0.07]"
                    data-testid={`row-company-${c.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-sm font-semibold" data-testid={`text-company-name-${c.id}`}>
                          {c.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                          <span className="inline-flex items-center gap-1" data-testid={`text-company-users-${c.id}`}>
                            <Users className="h-3.5 w-3.5" /> {c.users} users
                          </span>
                          <span className="inline-flex items-center gap-1" data-testid={`text-company-services-${c.id}`}>
                            <Server className="h-3.5 w-3.5" /> {c.services} services
                          </span>
                        </div>
                      </div>
                      {c.status === "active" ? <Pill label="active" tone="good" /> : <Pill label="suspended" tone="warn" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-white/55" data-testid={`text-company-mrr-${c.id}`}>
                        MRR: <span className="font-medium text-white/80">{c.mrr}</span>
                      </div>
                      <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid={`button-company-open-${c.id}`}>
                        Open
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="bg-white/10" />

              <div className="grid gap-2 md:grid-cols-2" data-testid="grid-admin-shortcuts">
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-companies">
                  <Building2 className="mr-2 h-4 w-4" />
                  Companies
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-services">
                  <Zap className="mr-2 h-4 w-4" />
                  Services
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Invoices
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-inventory">
                  <Boxes className="mr-2 h-4 w-4" />
                  Inventory
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-remotehands">
                  <HardHat className="mr-2 h-4 w-4" />
                  Remote Hands
                </Button>
                <Button variant="outline" className="border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-open-users">
                  <Shield className="mr-2 h-4 w-4" />
                  Roles & users
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          <Card className="border-white/10 bg-white/5 p-5 md:col-span-7" data-testid="card-admin-tickets">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-base font-semibold" data-testid="text-admin-tickets-title">
                  Tickets
                </div>
                <div className="text-sm text-white/60" data-testid="text-admin-tickets-subtitle">
                  Assignment + SLA posture.
                </div>
              </div>
              <Button size="sm" className="h-9" data-testid="button-admin-new-ticket">
                New
              </Button>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="overflow-hidden rounded-xl border border-white/10" data-testid="tablewrap-admin-tickets">
              <Table data-testid="table-admin-tickets">
                <TableHeader>
                  <TableRow className="border-white/10" data-testid="row-admin-tickets-header">
                    <TableHead className="text-white/70">Subject</TableHead>
                    <TableHead className="text-white/70">Category</TableHead>
                    <TableHead className="text-white/70">Priority</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead className="text-white/70">Assignee</TableHead>
                    <TableHead className="text-right text-white/70">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className="border-white/10" data-testid={`row-admin-ticket-${t.id}`}>
                      <TableCell className="font-medium" data-testid={`text-admin-ticket-subject-${t.id}`}>
                        {t.subject}
                      </TableCell>
                      <TableCell className="text-white/70" data-testid={`text-admin-ticket-category-${t.id}`}>
                        {t.category.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell data-testid={`cell-admin-ticket-priority-${t.id}`}>
                        {t.priority === "urgent" ? <Pill label="urgent" tone="bad" /> : t.priority === "high" ? <Pill label="high" tone="warn" /> : <Pill label={t.priority} tone="neutral" />}
                      </TableCell>
                      <TableCell data-testid={`cell-admin-ticket-status-${t.id}`}>
                        {t.status === "new" ? <Pill label="new" tone="info" /> : t.status === "open" ? <Pill label="open" tone="info" /> : t.status === "waiting" ? <Pill label="waiting" tone="warn" /> : <Pill label="resolved" tone="good" />}
                      </TableCell>
                      <TableCell className="text-white/70" data-testid={`text-admin-ticket-assignee-${t.id}`}>
                        {t.assignee}
                      </TableCell>
                      <TableCell className="text-right text-white/70" data-testid={`text-admin-ticket-updated-${t.id}`}>
                        {t.updatedAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/55" data-testid="text-admin-tickets-footnote">
              <div className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />Live queues will be wired later.
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />SLA tracking placeholder
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/5 p-5 md:col-span-5" data-testid="card-admin-inventory">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-base font-semibold" data-testid="text-admin-inventory-title">
                  Inventory
                </div>
                <div className="text-sm text-white/60" data-testid="text-admin-inventory-subtitle">
                  Physical assets + location mapping.
                </div>
              </div>
              <Button variant="outline" className="h-9 border-white/15 bg-white/5 text-white/85 hover:bg-white/10" data-testid="button-admin-add-inventory">
                Add
              </Button>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3" data-testid="list-admin-inventory">
              {inventory.map((i) => (
                <Card key={i.id} className="border-white/10 bg-white/5 p-4 hover:bg-white/[0.07]" data-testid={`card-admin-inventory-${i.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm font-semibold" data-testid={`text-inventory-name-${i.id}`}>
                        {i.name}
                      </div>
                      <div className="mt-1 text-xs text-white/55" data-testid={`text-inventory-location-${i.id}`}>
                        {i.location}
                      </div>
                    </div>
                    {i.status === "in_service" ? <Pill label="in service" tone="good" /> : i.status === "spare" ? <Pill label="spare" tone="neutral" /> : <Pill label="retired" tone="warn" />}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80" data-testid={`badge-inventory-owner-${i.id}`}>
                      {i.owner}
                    </span>
                    <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid={`button-inventory-open-${i.id}`}>
                      Open
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-2 md:grid-cols-2" data-testid="grid-admin-kpis">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="kpi-assets-customer">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-kpi-assets-customer-label">
                    Customer assets
                  </div>
                  <Server className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-kpi-assets-customer-value">
                  1
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="kpi-assets-dc">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-kpi-assets-dc-label">
                    Datacenter assets
                  </div>
                  <Boxes className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-kpi-assets-dc-value">
                  2
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="kpi-spares">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-kpi-spares-label">
                    Spares
                  </div>
                  <CircleSlash2 className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-kpi-spares-value">
                  1
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="kpi-retired">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-kpi-retired-label">
                    Retired
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-kpi-retired-value">
                  0
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </AdminShell>
  );
}
