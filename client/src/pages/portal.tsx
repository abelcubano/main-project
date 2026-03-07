import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { Service as DbService, Invoice as DbInvoice } from "@shared/schema";
import {
  ArrowRight,
  Bell,
  Cable,
  ChevronDown,
  CreditCard,
  Download,
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
  Power,
  RotateCw,
  BarChart3,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  grafanaUrl?: string | null;
  grafanaDashboardUid?: string | null;
  grafanaPanelId?: string | null;
  grafanaOrgId?: string | null;
  grafanaVar?: string | null;
  snmpHost?: string | null;
  snmpOidStatus?: string | null;
  snmpOidControl?: string | null;
  pduPortNumber?: number | null;
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
    pending: "bg-amber-50 text-amber-700 border-amber-200",
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

function NavItem({ icon: Icon, label, active, badge, onClick }: { icon: typeof LayoutDashboard; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs font-medium transition-all ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${active ? "bg-white/20" : "bg-blue-100 text-blue-700"}`}>{badge}</span>
      )}
    </button>
  );
}

type PortalView = "dashboard" | "services" | "network" | "invoices" | "tickets" | "settings";

function GrafanaPanel({ service }: { service: Service }) {
  const [timeRange, setTimeRange] = useState("24h");

  if (!service.grafanaUrl || !service.grafanaDashboardUid || !service.grafanaPanelId) {
    return null;
  }

  const timeRanges: Record<string, { from: string; to: string }> = {
    "6h": { from: "now-6h", to: "now" },
    "24h": { from: "now-24h", to: "now" },
    "7d": { from: "now-7d", to: "now" },
    "30d": { from: "now-30d", to: "now" },
  };

  const range = timeRanges[timeRange];
  let src = `${service.grafanaUrl}/d-solo/${service.grafanaDashboardUid}?panelId=${service.grafanaPanelId}&from=${range.from}&to=${range.to}&theme=light`;
  if (service.grafanaOrgId) src += `&orgId=${service.grafanaOrgId}`;
  if (service.grafanaVar) src += `&var-host=${encodeURIComponent(service.grafanaVar)}`;

  return (
    <div className="mt-3" data-testid={`grafana-panel-${service.id}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-900">Network Traffic</span>
        </div>
        <div className="flex items-center gap-1">
          {(["6h", "24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-0.5 text-[10px] rounded ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`button-timerange-${range}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <iframe
          src={src}
          width="100%"
          height="200"
          frameBorder="0"
          className="block"
          title={`Traffic graph for ${service.name}`}
          data-testid={`iframe-grafana-${service.id}`}
        />
      </div>
    </div>
  );
}

function PduControls({ service, token, canManage }: { service: Service; token: string | null; canManage: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [portStatus, setPortStatus] = useState<{ state: string; rawValue: number } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!service.snmpHost || service.pduPortNumber == null) {
    return null;
  }

  async function fetchStatus() {
    setLoading(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/services/${service.id}/pdu/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPortStatus(await res.json());
      } else {
        const data = await res.json();
        setStatusError(data.error || "Failed to get status");
      }
    } catch {
      setStatusError("Connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReboot() {
    setShowConfirm(false);
    setRebooting(true);
    try {
      const res = await fetch(`/api/services/${service.id}/pdu/reboot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Reboot Initiated", description: `Port ${service.pduPortNumber} reboot command sent successfully` });
        setTimeout(fetchStatus, 3000);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to reboot port", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Connection failed", variant: "destructive" });
    } finally {
      setRebooting(false);
    }
  }

  const stateColors: Record<string, string> = {
    on: "text-emerald-600",
    off: "text-rose-600",
    reboot: "text-amber-600",
    unknown: "text-slate-500",
  };

  return (
    <div className="mt-3" data-testid={`pdu-controls-${service.id}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Power className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-slate-900">PDU Port Control</span>
        <span className="text-[10px] text-slate-500">(Port #{service.pduPortNumber})</span>
      </div>
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {portStatus ? (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium ${stateColors[portStatus.state] || stateColors.unknown}`}>
                  {portStatus.state.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400">(raw: {portStatus.rawValue})</span>
              </div>
            ) : statusError ? (
              <span className="text-xs text-rose-600">{statusError}</span>
            ) : (
              <span className="text-xs text-slate-500 italic">Status not checked</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchStatus}
              disabled={loading}
              className="h-7 text-[10px] border-slate-300"
              data-testid={`button-check-status-${service.id}`}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCw className="h-3 w-3 mr-1" />}
              Check Status
            </Button>
            {service.snmpOidControl && canManage && (
              <Button
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={rebooting}
                className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
                data-testid={`button-reboot-${service.id}`}
              >
                {rebooting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                Reboot Port
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Confirm Port Reboot</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will power cycle PDU port #{service.pduPortNumber} for {service.name}. Any connected equipment will temporarily lose power.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} className="h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleReboot} className="h-8 text-xs bg-amber-600 hover:bg-amber-700" data-testid={`button-confirm-reboot-${service.id}`}>
              Confirm Reboot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PortalPage() {
  const { user, logout, token } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<PortalView>("dashboard");

  const isAdmin = user?.role === "admin";
  const hasPortalAccess = isAdmin || user?.permPortalAccess !== false;
  const canSeeServices = isAdmin || user?.permServicesView === true;
  const canSeeInvoices = isAdmin || user?.permBillingView === true;
  const canSeeTickets = isAdmin || user?.permSupportView === true;
  const canSeeTechnical = isAdmin || user?.permTechnicalView === true;
  const canManageTechnical = isAdmin || user?.permTechnicalManage === true;
  const canCreateTickets = isAdmin || user?.permSupportCreate === true;
  const canSeeSmarthands = isAdmin || user?.permSupportSmarthands === true;

  async function handleLogout() {
    await logout();
    setLocation("/portal/login");
  }

  if (user && !hasPortalAccess) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50" data-testid="page-portal-denied">
        <div className="text-center space-y-3">
          <div className="text-lg font-semibold text-slate-900">Access Denied</div>
          <p className="text-sm text-slate-500">Your account does not have portal access. Please contact your account administrator.</p>
          <Button onClick={handleLogout} variant="outline" className="text-xs" data-testid="button-logout-denied">Sign Out</Button>
        </div>
      </div>
    );
  }

  const { data: servicesData = [] } = useQuery<DbService[]>({
    queryKey: ["services", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && canSeeServices,
  });

  const { data: invoicesData = [] } = useQuery<DbInvoice[]>({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && canSeeInvoices,
  });

  const services: Service[] = servicesData.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    status: s.status as "active" | "provisioning" | "suspended",
    location: s.location,
    details: s.details || "",
    grafanaUrl: s.grafanaUrl,
    grafanaDashboardUid: s.grafanaDashboardUid,
    grafanaPanelId: s.grafanaPanelId,
    grafanaOrgId: s.grafanaOrgId,
    grafanaVar: s.grafanaVar,
    snmpHost: s.snmpHost,
    snmpOidStatus: s.snmpOidStatus,
    snmpOidControl: s.snmpOidControl,
    pduPortNumber: s.pduPortNumber,
  }));

  const invoices: Invoice[] = invoicesData.map((inv) => {
    let status: "paid" | "open" | "past_due" = "open";
    if (inv.status === "paid") status = "paid";
    else if (inv.status === "past_due") status = "past_due";
    else status = "open";
    return {
      id: inv.id,
      number: inv.invoiceNumber,
      status,
      date: new Date(inv.issueDate).toLocaleDateString(),
      total: `$${Number(inv.total).toFixed(2)}`,
    };
  });

  const tickets: Ticket[] = [
    { id: "t-001", subject: "SmartHands: install replacement SSD", category: "smart_hands", priority: "normal", status: "open", updatedAt: "2h ago" },
    { id: "t-002", subject: "Billing: credit applied to INV-10310", category: "billing", priority: "low", status: "waiting", updatedAt: "yesterday" },
    { id: "t-003", subject: "Network: packet loss on cross-connect", category: "technical", priority: "urgent", status: "new", updatedAt: "10m ago" },
  ];

  const activeServices = services.filter((s) => s.status === "active").length;
  const provisioningServices = services.filter((s) => s.status === "provisioning").length;
  const openInvoices = invoices.filter((inv) => inv.status === "open").length;
  const pastDueInvoices = invoices.filter((inv) => inv.status === "past_due").length;

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => [s.name, s.type, s.location].some((v) => v.toLowerCase().includes(q)));
  }, [query, services]);

  return (
    <div className="min-h-dvh flex bg-slate-50" data-testid="page-portal">
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
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />

          {canSeeServices && (
            <>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Services</div>
              <NavItem icon={Server} label="My Services" badge={services.length || undefined} active={activeView === "services"} onClick={() => setActiveView("services")} />
              <NavItem icon={MapPin} label="Locations" />
              {canSeeTechnical && <NavItem icon={Network} label="Network" active={activeView === "network"} onClick={() => setActiveView("network")} />}
            </>
          )}

          {canSeeInvoices && (
            <>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Billing</div>
              <NavItem icon={FileText} label="Invoices" badge={openInvoices + pastDueInvoices || undefined} active={activeView === "invoices"} onClick={() => setActiveView("invoices")} />
              <NavItem icon={CreditCard} label="Payments" />
            </>
          )}

          {canSeeTickets && (
            <>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Support</div>
              <NavItem icon={Ticket} label="My Tickets" badge={3} active={activeView === "tickets"} onClick={() => setActiveView("tickets")} />
              {canSeeSmarthands && <NavItem icon={Cable} label="SmartHands" />}
            </>
          )}

          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2">Account</div>
          <NavItem icon={Settings} label="Settings" active={activeView === "settings"} onClick={() => setActiveView("settings")} />
        </nav>

        <div className="p-3 border-t border-slate-100">
          <Button variant="ghost" onClick={handleLogout} className="w-full h-8 text-xs text-slate-600 hover:text-slate-900 justify-start" data-testid="button-logout">
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">{user?.companyName || "Customer Account"}</span>
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

        <main className="flex-1 overflow-y-auto p-5">
          {activeView === "services" && canSeeServices && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">My Services</h1>
                <p className="text-xs text-slate-500 mt-0.5">Active allocations and provisioning</p>
              </div>
              <Card className="border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">{services.length} Services</div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services..." className="h-7 w-48 pl-7 text-xs border-slate-200" data-testid="input-search-services" />
                  </div>
                </div>
                <div className="p-4 grid gap-3">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">No services found</div>
                  ) : (
                    filteredServices.map((s) => (
                      <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all" data-testid={`service-${s.id}`}>
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
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {activeView === "network" && canSeeTechnical && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Network</h1>
                <p className="text-xs text-slate-500 mt-0.5">Traffic monitoring and power management</p>
              </div>
              {services.filter(s => s.grafanaUrl || s.snmpHost).length === 0 ? (
                <Card className="border-slate-200 bg-white p-8 text-center">
                  <div className="text-xs text-slate-500">No network monitoring configured for your services</div>
                </Card>
              ) : (
                services.filter(s => s.grafanaUrl || s.snmpHost).map((s) => (
                  <Card key={s.id} className="border-slate-200 bg-white overflow-hidden" data-testid={`network-service-${s.id}`}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <span className="text-[10px] text-slate-500">{s.location}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <GrafanaPanel service={s} />
                      <PduControls service={s} token={token} canManage={canManageTechnical} />
                    </div>
                  </Card>
                ))
              )}
            </motion.div>
          )}

          {activeView === "invoices" && canSeeInvoices && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Invoices</h1>
                <p className="text-xs text-slate-500 mt-0.5">Billing history and payment status</p>
              </div>
              <Card className="border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-slate-100">
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Invoice #</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Date</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Total</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">No invoices found</TableCell></TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50" data-testid={`invoice-${inv.id}`}>
                          <TableCell className="text-xs font-medium text-slate-900">{inv.number}</TableCell>
                          <TableCell className="text-xs text-slate-600">{inv.date}</TableCell>
                          <TableCell><StatusBadge status={inv.status} /></TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900 text-right">{inv.total}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/invoices/${inv.id}/pdf`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  if (!res.ok) return;
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${inv.number}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch {}
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                              data-testid={`button-download-invoice-${inv.id}`}
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {activeView === "tickets" && canSeeTickets && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">My Tickets</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Support requests and updates</p>
                </div>
                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" data-testid="button-new-ticket">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Ticket
                </Button>
              </div>
              <Card className="border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-slate-100">
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Subject</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Category</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Priority</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50 cursor-pointer" data-testid={`ticket-${t.id}`}>
                        <TableCell className="text-xs font-medium text-slate-900">{t.subject}</TableCell>
                        <TableCell className="text-xs text-slate-600 capitalize">{t.category.replace("_", " ")}</TableCell>
                        <TableCell><StatusBadge status={t.priority} /></TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell className="text-xs text-slate-500 text-right">{t.updatedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {activeView === "settings" && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Account Settings</h1>
                <p className="text-xs text-slate-500 mt-0.5">Manage your account preferences</p>
              </div>
              <Card className="border-slate-200 bg-white p-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Name</label>
                    <div className="mt-1 text-sm text-slate-900">{user?.name || "—"}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company</label>
                    <div className="mt-1 text-sm text-slate-900">{user?.companyName || "—"}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Email</label>
                    <div className="mt-1 text-sm text-slate-900">{user?.email || "—"}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Username</label>
                    <div className="mt-1 text-sm text-slate-900">{user?.username || "—"}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeView === "dashboard" && (
          <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage your services, billing, and support</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {canSeeServices && (
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Active Services</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{activeServices}</div>
                    <div className="mt-0.5 text-[10px] text-blue-600">{provisioningServices > 0 ? `${provisioningServices} provisioning` : "All operational"}</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Server className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              )}
              {canSeeInvoices && (
              <Card className="p-4 border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Open Invoices</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{openInvoices + pastDueInvoices}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{pastDueInvoices > 0 ? <span className="text-rose-600">{pastDueInvoices} past due</span> : "All current"}</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              )}
              {canSeeTickets && (
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
              )}
              {canSeeSmarthands && (
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
              )}
            </div>

            <div className="grid grid-cols-12 gap-5">
              {canSeeServices && (
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
                    <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer" onClick={() => setActiveView("services")} data-testid={`dashboard-service-${s.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{s.name}</span>
                            <StatusBadge status={s.status} />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{s.location}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">{s.type}</span>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">No services yet</div>
                  )}
                </div>
              </Card>
              )}

              <Card className={`${canSeeServices ? "col-span-4" : "col-span-12"} border-slate-200 bg-white overflow-hidden`}>
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { icon: Globe, label: "Request Service", desc: "Start a new service request" },
                    { icon: HardHat, label: "SmartHands", desc: "Schedule datacenter work" },
                    { icon: Phone, label: "Contact Support", desc: "Get help from our team" },
                  ].map((action) => (
                    <button key={action.label} className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all text-left">
                      <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900">{action.label}</div>
                        <div className="text-[10px] text-slate-500">{action.desc}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-auto" />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
