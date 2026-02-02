import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Cable,
  ClipboardList,
  Clock,
  Cpu,
  CreditCard,
  FileText,
  LifeBuoy,
  MapPin,
  Network,
  Plus,
  Search,
  Server,
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
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
    open: "bg-sky-500/15 text-sky-200 border-sky-500/25",
    past_due: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    void: "bg-zinc-500/15 text-zinc-200 border-zinc-500/25",
    draft: "bg-zinc-500/15 text-zinc-200 border-white/10",
    active: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
    provisioning: "bg-sky-500/15 text-sky-200 border-sky-500/25",
    suspended: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    new: "bg-sky-500/15 text-sky-200 border-sky-500/25",
    waiting: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    resolved: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  };

  const cls = map[status] ?? "bg-white/10 text-white/80 border-white/10";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
      data-testid={`status-${status}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, string> = {
    low: "bg-white/10 text-white/75 border-white/10",
    normal: "bg-white/10 text-white/75 border-white/10",
    high: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    urgent: "bg-rose-500/15 text-rose-200 border-rose-500/25",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${map[priority]}`}
      data-testid={`priority-${priority}`}
    >
      {priority}
    </span>
  );
}

function PortalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh" data-testid="page-portal">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-background/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                className="h-9 px-2 text-white/80 hover:text-white"
                data-testid="button-portal-back-home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/10" aria-hidden />
            <div>
              <div className="font-display text-sm font-semibold" data-testid="text-portal-title">
                {title}
              </div>
              <div className="text-xs text-white/55" data-testid="text-portal-subtitle">
                {subtitle}
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Badge className="border-white/10 bg-white/5 text-white/80" data-testid="badge-portal-company">
              ExampleCo • DC-01
            </Badge>
            <Button size="sm" className="h-9" data-testid="button-portal-new-ticket">
              <Plus className="mr-2 h-4 w-4" />
              New ticket
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

export default function PortalPage() {
  const [query, setQuery] = useState("");

  const services: Service[] = [
    {
      id: "svc-001",
      name: "Cabinet C12 (42U)",
      kind: "colo",
      status: "active",
      location: "DC-01 • Row C • C12",
      summary: "2kW allocation • 2x 20A circuits • 10Gb cross-connect ready",
    },
    {
      id: "svc-002",
      name: "Power Circuit A-20A-214",
      kind: "power",
      status: "active",
      location: "DC-01 • PDU A • Feed 214",
      summary: "20A @ 208V • Metered • Alerts enabled",
    },
    {
      id: "svc-003",
      name: "Cross-connect: MMF LC",
      kind: "cross_connect",
      status: "provisioning",
      location: "DC-01 • MMR • Panel 7",
      summary: "Fiber test scheduled • Delivery ETA 2–3 business days",
    },
  ];

  const invoices: Invoice[] = [
    { id: "inv-01", number: "INV-10241", status: "paid", date: "2026-01-05", total: "$1,840.00" },
    { id: "inv-02", number: "INV-10302", status: "open", date: "2026-02-01", total: "$1,840.00" },
    { id: "inv-03", number: "INV-10310", status: "past_due", date: "2025-12-01", total: "$120.00" },
  ];

  const tickets: Ticket[] = [
    {
      id: "t-001",
      subject: "Request: install replacement SSD in server R720",
      category: "remote_hands",
      priority: "normal",
      status: "open",
      updatedAt: "2h ago",
    },
    {
      id: "t-002",
      subject: "Billing question: credit applied to INV-10310",
      category: "billing",
      priority: "low",
      status: "waiting",
      updatedAt: "yesterday",
    },
    {
      id: "t-003",
      subject: "Network issue: packet loss on cross-connect",
      category: "technical",
      priority: "urgent",
      status: "new",
      updatedAt: "10m ago",
    },
  ];

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) =>
      [s.name, s.kind, s.location, s.summary].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <PortalShell title="Customer Portal" subtitle="Services, invoices, and support">
      <motion.div variants={fade} initial="hidden" animate="show" className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-12">
          <Card className="border-white/10 bg-white/5 p-5 md:col-span-8" data-testid="card-portal-overview">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-display text-base font-semibold" data-testid="text-overview-title">
                  Overview
                </div>
                <div className="text-sm text-white/60" data-testid="text-overview-subtitle">
                  Quick access to what you need right now.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                  data-testid="button-view-all-services"
                >
                  <Server className="mr-2 h-4 w-4" />
                  Services
                </Button>
                <Button
                  variant="outline"
                  className="h-9 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                  data-testid="button-view-all-invoices"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Invoices
                </Button>
                <Button
                  variant="outline"
                  className="h-9 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                  data-testid="button-view-all-tickets"
                >
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Tickets
                </Button>
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-active-services">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-services-label">
                    Active services
                  </div>
                  <Cpu className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-services-value">
                  3
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-services-footnote">
                  1 provisioning
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-open-invoices">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-invoices-label">
                    Open invoices
                  </div>
                  <BadgeDollarSign className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-invoices-value">
                  1
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-invoices-footnote">
                  Next auto-bill: Feb 3
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="stat-new-tickets">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60" data-testid="text-stat-tickets-label">
                    Tickets
                  </div>
                  <ClipboardList className="h-4 w-4 text-white/60" />
                </div>
                <div className="mt-2 font-display text-2xl font-semibold" data-testid="text-stat-tickets-value">
                  3
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-stat-tickets-footnote">
                  1 urgent
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/5 p-5 md:col-span-4" data-testid="card-portal-actions">
            <div className="font-display text-base font-semibold" data-testid="text-actions-title">
              Create
            </div>
            <div className="mt-1 text-sm text-white/60" data-testid="text-actions-subtitle">
              Start common requests.
            </div>

            <div className="mt-4 grid gap-2">
              <Button className="justify-start" data-testid="button-create-ticket">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Open a support ticket
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="justify-start border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                data-testid="button-create-remotehands"
              >
                <Cable className="mr-2 h-4 w-4" />
                Request Remote Hands
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="justify-start border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                data-testid="button-update-payment"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Update payment method
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </div>

            <Separator className="my-5 bg-white/10" />

            <div className="grid gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="card-location">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-location-label">Primary site</span>
                </div>
                <div className="mt-2 font-display text-sm font-semibold" data-testid="text-location-value">
                  DC-01 • MMR access included
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-location-footnote">
                  24/7 badge + scheduled escort
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="card-network">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Network className="h-4 w-4" />
                  <span data-testid="text-network-label">Network</span>
                </div>
                <div className="mt-2 font-display text-sm font-semibold" data-testid="text-network-value">
                  10Gb cross-connect ready
                </div>
                <div className="mt-1 text-xs text-white/55" data-testid="text-network-footnote">
                  IPv4 + IPv6 allocations available
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/5 p-5" data-testid="card-portal-lists">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-display text-base font-semibold" data-testid="text-lists-title">
                Your workspace
              </div>
              <div className="text-sm text-white/60" data-testid="text-lists-subtitle">
                Search across services and recent activity.
              </div>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="h-10 border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/45"
                data-testid="input-service-search"
              />
            </div>
          </div>

          <Separator className="my-5 bg-white/10" />

          <Tabs defaultValue="services" className="w-full" data-testid="tabs-portal">
            <TabsList className="bg-white/5" data-testid="tabslist-portal">
              <TabsTrigger value="services" className="data-[state=active]:bg-white/10" data-testid="tab-services">
                Services
              </TabsTrigger>
              <TabsTrigger value="invoices" className="data-[state=active]:bg-white/10" data-testid="tab-invoices">
                Invoices
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-white/10" data-testid="tab-tickets">
                Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-5" data-testid="tabcontent-services">
              <div className="grid gap-3 md:grid-cols-3" data-testid="grid-services">
                {filteredServices.map((s) => (
                  <Card
                    key={s.id}
                    className="border-white/10 bg-white/5 p-4 hover:bg-white/[0.07]"
                    data-testid={`card-service-${s.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-sm font-semibold" data-testid={`text-service-name-${s.id}`}>
                          {s.name}
                        </div>
                        <div className="mt-1 text-xs text-white/55" data-testid={`text-service-location-${s.id}`}>
                          {s.location}
                        </div>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                    <div className="mt-3 text-sm text-white/60" data-testid={`text-service-summary-${s.id}`}>
                      {s.summary}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge className="border-white/10 bg-white/5 text-white/80" data-testid={`badge-service-kind-${s.id}`}>
                        {s.kind.replaceAll("_", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        className="h-9 px-2 text-white/80 hover:text-white"
                        data-testid={`button-service-open-${s.id}`}
                      >
                        Open
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-5" data-testid="tabcontent-invoices">
              <div className="overflow-hidden rounded-xl border border-white/10" data-testid="tablewrap-invoices">
                <Table data-testid="table-invoices">
                  <TableHeader>
                    <TableRow className="border-white/10" data-testid="row-invoices-header">
                      <TableHead className="text-white/70">Invoice</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                      <TableHead className="text-white/70">Status</TableHead>
                      <TableHead className="text-right text-white/70">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-white/10" data-testid={`row-invoice-${inv.id}`}>
                        <TableCell className="font-medium" data-testid={`text-invoice-number-${inv.id}`}>
                          {inv.number}
                        </TableCell>
                        <TableCell className="text-white/70" data-testid={`text-invoice-date-${inv.id}`}>
                          {inv.date}
                        </TableCell>
                        <TableCell data-testid={`cell-invoice-status-${inv.id}`}>
                          <StatusPill status={inv.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`text-invoice-total-${inv.id}`}>
                          {inv.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/55" data-testid="text-invoices-footnote">
                <div>PDF downloads and payments are MVP-out-of-scope in mockup mode.</div>
                <div className="inline-flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Updated moments ago</div>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="mt-5" data-testid="tabcontent-tickets">
              <div className="overflow-hidden rounded-xl border border-white/10" data-testid="tablewrap-tickets">
                <Table data-testid="table-tickets">
                  <TableHeader>
                    <TableRow className="border-white/10" data-testid="row-tickets-header">
                      <TableHead className="text-white/70">Subject</TableHead>
                      <TableHead className="text-white/70">Category</TableHead>
                      <TableHead className="text-white/70">Priority</TableHead>
                      <TableHead className="text-white/70">Status</TableHead>
                      <TableHead className="text-right text-white/70">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id} className="border-white/10" data-testid={`row-ticket-${t.id}`}>
                        <TableCell className="font-medium" data-testid={`text-ticket-subject-${t.id}`}>
                          {t.subject}
                        </TableCell>
                        <TableCell className="text-white/70" data-testid={`text-ticket-category-${t.id}`}>
                          {t.category.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell data-testid={`cell-ticket-priority-${t.id}`}>
                          <PriorityPill priority={t.priority} />
                        </TableCell>
                        <TableCell data-testid={`cell-ticket-status-${t.id}`}>
                          <StatusPill status={t.status} />
                        </TableCell>
                        <TableCell className="text-right text-white/70" data-testid={`text-ticket-updated-${t.id}`}>
                          {t.updatedAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </PortalShell>
  );
}
