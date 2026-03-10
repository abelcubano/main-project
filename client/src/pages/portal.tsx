import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import DOMPurify from "dompurify";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service as DbService, Invoice as DbInvoice, Ticket as DbTicket } from "@shared/schema";
import {
  ArrowRight,
  ArrowLeft,
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
  MessageSquare,
  Network,
  Phone,
  Plus,
  Search,
  Send,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Invoice = {
  id: string;
  number: string;
  status: "paid" | "open" | "past_due";
  date: string;
  total: string;
};

type TicketReply = {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  authorName: string;
  authorRole: string;
};

type TicketDetail = DbTicket & {
  creatorName: string;
  customerName: string;
  assigneeName: string | null;
  replies: TicketReply[];
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
    in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-slate-50 text-slate-600 border-slate-200",
    closed: "bg-slate-50 text-slate-500 border-slate-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    urgent: "bg-rose-50 text-rose-700 border-rose-200",
    low: "bg-slate-50 text-slate-600 border-slate-200",
    normal: "bg-blue-50 text-blue-600 border-blue-200",
    general: "bg-slate-50 text-slate-600 border-slate-200",
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

function GrafanaPanel({ service, globalGrafanaUrl }: { service: Service; globalGrafanaUrl?: string }) {
  const [timeRange, setTimeRange] = useState("24h");

  const grafanaBaseUrl = globalGrafanaUrl || service.grafanaUrl;
  if (!grafanaBaseUrl || !service.grafanaDashboardUid || !service.grafanaPanelId) {
    return null;
  }

  const timeRanges: Record<string, { from: string; to: string }> = {
    "6h": { from: "now-6h", to: "now" },
    "24h": { from: "now-24h", to: "now" },
    "7d": { from: "now-7d", to: "now" },
    "30d": { from: "now-30d", to: "now" },
  };

  const range = timeRanges[timeRange];
  let src = `${grafanaBaseUrl}/d-solo/${service.grafanaDashboardUid}?panelId=${service.grafanaPanelId}&from=${range.from}&to=${range.to}&theme=light`;
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
          allow="fullscreen"
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

function ServiceDeviceDetails({ serviceId, token, globalGrafanaUrl }: { serviceId: string; token: string | null; globalGrafanaUrl?: string }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/services/${serviceId}/devices-info`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { setDevices(d); setLoaded(true); }).catch(() => setLoaded(true));
  }, [serviceId, token]);

  if (!loaded || devices.length === 0) return null;

  const allIps = devices.flatMap((d: any) => d.ips.map((ip: any) => ({ ...ip, deviceName: d.name })));
  const grafanaPanels: { device: any; dashboardUid: string; panelId: string; label: string }[] = [];
  devices.forEach((d: any) => {
    const baseUrl = globalGrafanaUrl || d.grafanaUrl;
    if (!baseUrl) return;
    if (d.grafanaDashboardUid && d.grafanaPanelId) {
      grafanaPanels.push({ device: d, dashboardUid: d.grafanaDashboardUid, panelId: d.grafanaPanelId, label: `${d.name} — Network Traffic` });
    }
    if (d.grafanaPowerDashboardUid && d.grafanaPowerPanelId) {
      grafanaPanels.push({ device: d, dashboardUid: d.grafanaPowerDashboardUid, panelId: d.grafanaPowerPanelId, label: `${d.name} — Power` });
    }
  });

  return (
    <div className="space-y-3" data-testid={`device-details-${serviceId}`}>
      {allIps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-900">IP Addresses</span>
          </div>
          <div className="space-y-1">
            {allIps.map((ip: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] font-mono font-semibold text-slate-800">{ip.ipAddress}</span>
                {ip.type && <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${ip.type === "public" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{ip.type}</span>}
                {ip.vlan && <span className="text-[9px] text-slate-400">VLAN {ip.vlan}</span>}
                {ip.description && <span className="text-[10px] text-slate-500 ml-auto">{ip.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {grafanaPanels.map((gp, idx) => (
        <DeviceGrafanaPanel key={`${gp.device.id}-${idx}`} device={gp.device} dashboardUid={gp.dashboardUid} panelId={gp.panelId} label={gp.label} globalGrafanaUrl={globalGrafanaUrl} />
      ))}
      {devices.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-900">Devices</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {devices.map((d: any) => (
              <div key={d.id} className="px-2.5 py-1.5 rounded border border-slate-100 bg-slate-50/50">
                <span className="text-[11px] font-medium text-slate-800">{d.name}</span>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {d.facility && <span>{d.facility}</span>}
                  {d.rack && <span> / Rack {d.rack}</span>}
                  {d.rackPosition && <span> U{d.rackPosition}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceGrafanaPanel({ device, dashboardUid, panelId, label, globalGrafanaUrl }: { device: any; dashboardUid: string; panelId: string; label: string; globalGrafanaUrl?: string }) {
  const [timeRange, setTimeRange] = useState("24h");

  const grafanaBaseUrl = globalGrafanaUrl || device.grafanaUrl;
  if (!grafanaBaseUrl) return null;

  const timeRanges: Record<string, { from: string; to: string }> = {
    "6h": { from: "now-6h", to: "now" },
    "24h": { from: "now-24h", to: "now" },
    "7d": { from: "now-7d", to: "now" },
    "30d": { from: "now-30d", to: "now" },
  };

  const range = timeRanges[timeRange];
  let src = `${grafanaBaseUrl}/d-solo/${dashboardUid}?panelId=${panelId}&from=${range.from}&to=${range.to}&theme=light`;
  if (device.grafanaOrgId) src += `&orgId=${device.grafanaOrgId}`;
  if (device.grafanaVar) src += `&var-host=${encodeURIComponent(device.grafanaVar)}`;

  return (
    <div data-testid={`grafana-device-${device.id}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-900">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {(["6h", "24h", "7d", "30d"] as const).map((r) => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 text-[10px] rounded ${timeRange === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              data-testid={`button-timerange-${r}-${device.id}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <iframe src={src} width="100%" height="200" frameBorder="0" className="block"
          title={label} allow="fullscreen" data-testid={`iframe-grafana-device-${device.id}`} />
      </div>
    </div>
  );
}

function DeviceMonitoringWidgets({ serviceId, token }: { serviceId: string; token: string | null }) {
  const [monitoringItems, setMonitoringItems] = useState<any[]>([]);
  const [powerData, setPowerData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/services/${serviceId}/port-status`, { headers: h }).then(r => r.ok ? r.json() : { items: [], mode: "none" }).catch(() => ({ items: [], mode: "none" })),
      fetch(`/api/services/${serviceId}/power`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([portsData, power]) => {
      const items = portsData.items || (Array.isArray(portsData) ? portsData : []);
      setMonitoringItems(items);
      setPowerData(power);
      setLoaded(true);
    });
  }, [serviceId, token]);

  if (!loaded) return null;
  if (monitoringItems.length === 0 && !powerData) return null;

  const statusItems = monitoringItems.filter((i: any) => i.type === "status");
  const speedItems = monitoringItems.filter((i: any) => i.type === "speed");
  const powerItems = monitoringItems.filter((i: any) => i.type === "power");
  const otherItems = monitoringItems.filter((i: any) => !i.type || i.type === "other" || i.type === "vlan");
  const legacyItems = monitoringItems.filter((i: any) => i.status && !i.type);

  return (
    <>
      {monitoringItems.length > 0 && (
        <div className="mt-3" data-testid={`port-status-${serviceId}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Cable className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-900">Monitoring Data</span>
          </div>
          {statusItems.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Port Status</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {statusItems.map((ps: any) => {
                  const isUp = ps.lastValue === "1" || ps.status === "up";
                  return (
                    <div key={ps.itemId || ps.name} className="flex items-center gap-1.5 p-1.5 rounded border border-slate-100 bg-slate-50/50">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUp ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-[11px] text-slate-700 truncate flex-1">{(ps.label || ps.name || "Port").replace(/^.*:\s*/, "")}</span>
                      <span className={`text-[9px] font-bold uppercase ${isUp ? "text-green-600" : "text-red-600"}`}>{isUp ? "UP" : "DOWN"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {speedItems.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Speed / Bandwidth</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {speedItems.map((ps: any) => (
                  <div key={ps.itemId} className="p-1.5 rounded border border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] text-slate-700 block truncate">{(ps.label || ps.name || "").replace(/^.*:\s*/, "")}</span>
                    <span className="text-[10px] font-semibold text-blue-600">{ps.lastValue} {ps.units || ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {powerItems.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Power</div>
              <div className="grid grid-cols-3 gap-1.5">
                {powerItems.map((ps: any) => (
                  <div key={ps.itemId} className="text-center p-2 bg-yellow-50 rounded border border-yellow-100">
                    <div className="text-base font-bold text-yellow-700">{ps.lastValue}</div>
                    <div className="text-[9px] text-yellow-600">{ps.units || ""}</div>
                    <div className="text-[9px] text-slate-500 truncate">{ps.label || ps.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {otherItems.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Other Metrics</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {otherItems.map((ps: any) => (
                  <div key={ps.itemId} className="p-1.5 rounded border border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] text-slate-700 block truncate">{ps.label || ps.name}</span>
                    <span className="text-[10px] font-medium text-slate-600">{ps.lastValue} {ps.units || ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {legacyItems.length > 0 && statusItems.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {legacyItems.map((ps: any) => (
                <div key={ps.itemId || ps.name} className="flex items-center gap-1.5 p-1.5 rounded border border-slate-100 bg-slate-50/50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ps.status === "up" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-[11px] text-slate-700 truncate flex-1">{ps.name?.replace(/^.*:\s*/, "") || "Port"}</span>
                  <span className={`text-[9px] font-bold uppercase ${ps.status === "up" ? "text-green-600" : "text-red-600"}`}>{ps.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {powerData && (powerData.watts || powerData.amps || powerData.volts) && (
        <div className="mt-3" data-testid={`power-data-${serviceId}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Power className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-slate-900">Power Consumption</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {powerData.watts && (
              <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-100">
                <div className="text-lg font-bold text-yellow-700">{powerData.watts.value?.toFixed(1) || "—"}</div>
                <div className="text-[9px] text-yellow-600">{powerData.watts.unit || "W"}</div>
              </div>
            )}
            {powerData.amps && (
              <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{powerData.amps.value?.toFixed(2) || "—"}</div>
                <div className="text-[9px] text-blue-600">{powerData.amps.unit || "A"}</div>
              </div>
            )}
            {powerData.volts && (
              <div className="text-center p-2 bg-green-50 rounded border border-green-100">
                <div className="text-lg font-bold text-green-700">{powerData.volts.value?.toFixed(1) || "—"}</div>
                <div className="text-[9px] text-green-600">{powerData.volts.unit || "V"}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function PortalPage() {
  const { user, logout, token } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<PortalView>("dashboard");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketBody, setNewTicketBody] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("support");
  const [newTicketPriority, setNewTicketPriority] = useState("normal");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [globalGrafanaUrl, setGlobalGrafanaUrl] = useState("");
  useEffect(() => {
    if (token) {
      fetch("/api/portal/config", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : {}).then(d => { if (d.grafanaUrl) setGlobalGrafanaUrl(d.grafanaUrl); }).catch(() => {});
    }
  }, [token]);

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

  const { data: ticketsData = [], isLoading: ticketsLoading } = useQuery<DbTicket[]>({
    queryKey: ["tickets", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && canSeeTickets,
  });

  const { data: ticketDetail, isLoading: ticketDetailLoading } = useQuery<TicketDetail>({
    queryKey: ["ticket-detail", selectedTicketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${selectedTicketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load ticket");
      return res.json();
    },
    enabled: !!token && !!selectedTicketId,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; body: string; category: string; priority: string }) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create ticket");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setShowNewTicket(false);
      setNewTicketSubject("");
      setNewTicketBody("");
      setNewTicketCategory("support");
      setNewTicketPriority("normal");
      toast({ title: "Ticket Created", description: "Your support ticket has been submitted." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: { ticketId: string; body: string }) => {
      const res = await fetch(`/api/tickets/${data.ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: data.body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send reply");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-detail", selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setReplyText("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const tickets = ticketsData;

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
              <NavItem icon={Ticket} label="My Tickets" badge={tickets.filter(t => !["resolved", "closed"].includes(t.status)).length || undefined} active={activeView === "tickets"} onClick={() => { setActiveView("tickets"); setSelectedTicketId(null); }} />
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
            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => { if (canCreateTickets) { setShowNewTicket(true); } }} data-testid="button-new-request">
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
              {services.filter(s => s.grafanaUrl || s.grafanaDashboardUid || s.snmpHost || globalGrafanaUrl).length === 0 ? (
                <Card className="border-slate-200 bg-white p-8 text-center">
                  <div className="text-xs text-slate-500">No network monitoring configured for your services</div>
                </Card>
              ) : (
                services.map((s) => (
                  <Card key={s.id} className="border-slate-200 bg-white overflow-hidden" data-testid={`network-service-${s.id}`}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500">{s.location}</span>
                        {s.details && <div className="text-[9px] text-slate-400 mt-0.5">{s.details}</div>}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <ServiceDeviceDetails serviceId={s.id} token={token} globalGrafanaUrl={globalGrafanaUrl} />
                      <GrafanaPanel service={s} globalGrafanaUrl={globalGrafanaUrl} />
                      <DeviceMonitoringWidgets serviceId={s.id} token={token} />
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

          {activeView === "tickets" && canSeeTickets && !selectedTicketId && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">My Tickets</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Support requests and updates</p>
                </div>
                {canCreateTickets && (
                  <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs" data-testid="button-new-ticket" onClick={() => setShowNewTicket(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Ticket
                  </Button>
                )}
              </div>
              <Card className="border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-slate-100">
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Ticket #</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Subject</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Category</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Priority</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                    ) : tickets.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">No tickets found</TableCell></TableRow>
                    ) : (
                      tickets.map((t: any) => (
                        <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50 cursor-pointer" data-testid={`ticket-${t.id}`} onClick={() => setSelectedTicketId(t.id)}>
                          <TableCell className="text-xs text-slate-500 font-mono">#{(t as any).ticketNumber || t.id}</TableCell>
                          <TableCell className="text-xs font-medium text-slate-900">{t.subject}</TableCell>
                          <TableCell className="text-xs text-slate-600 capitalize">{t.category.replace("_", " ")}</TableCell>
                          <TableCell><StatusBadge status={t.priority} /></TableCell>
                          <TableCell><StatusBadge status={t.status} /></TableCell>
                          <TableCell className="text-xs text-slate-500 text-right">{new Date(t.updatedAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {activeView === "tickets" && canSeeTickets && selectedTicketId && (
            <motion.div variants={fade} initial="hidden" animate="show" className="space-y-5">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600" onClick={() => setSelectedTicketId(null)} data-testid="button-back-tickets">
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back
                </Button>
              </div>

              {ticketDetailLoading ? (
                <Card className="border-slate-200 bg-white p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                </Card>
              ) : ticketDetail ? (
                <>
                  <Card className="border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs text-slate-500 font-mono mr-1">#{(ticketDetail as any).ticketNumber || ticketDetail.id}</span>
                        <span className="text-sm font-semibold text-slate-900" data-testid="text-ticket-subject">{ticketDetail.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ticketDetail.priority} />
                        <StatusBadge status={ticketDetail.status} />
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                        <div>
                          <span className="text-slate-500 font-medium uppercase tracking-wide">Category</span>
                          <div className="mt-0.5 text-xs text-slate-900 capitalize">{ticketDetail.category.replace("_", " ")}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium uppercase tracking-wide">Created</span>
                          <div className="mt-0.5 text-xs text-slate-900">{new Date(ticketDetail.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium uppercase tracking-wide">Updated</span>
                          <div className="mt-0.5 text-xs text-slate-900">{new Date(ticketDetail.updatedAt).toLocaleDateString()}</div>
                        </div>
                        {ticketDetail.assigneeName && (
                          <div>
                            <span className="text-slate-500 font-medium uppercase tracking-wide">Assigned To</span>
                            <div className="mt-0.5 text-xs text-slate-900">{ticketDetail.assigneeName}</div>
                          </div>
                        )}
                      </div>
                      <Separator className="bg-slate-100" />
                      {ticketDetail.body?.startsWith("<") ? (
                        <div className="text-xs text-slate-700 leading-relaxed ticket-html-content" data-testid="text-ticket-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticketDetail.body) }} />
                      ) : (
                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed" data-testid="text-ticket-body">{ticketDetail.body}</div>
                      )}
                    </div>
                  </Card>

                  <Card className="border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-900">Replies ({ticketDetail.replies.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {ticketDetail.replies.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">No replies yet</div>
                      ) : (
                        ticketDetail.replies.map((reply) => (
                          <div key={reply.id} className="p-4" data-testid={`reply-${reply.id}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold ${reply.authorRole === "admin" ? "bg-slate-900 text-white" : "bg-blue-600 text-white"}`}>
                                  {reply.authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <span className="text-xs font-medium text-slate-900">{reply.authorName}</span>
                                {reply.authorRole === "admin" && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 rounded">Staff</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">{new Date(reply.createdAt).toLocaleString()}</span>
                            </div>
                            {reply.body?.startsWith("<") ? (
                              <div className="text-xs text-slate-700 leading-relaxed ml-8 ticket-html-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.body) }} />
                            ) : (
                              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed ml-8">{reply.body}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {!["resolved", "closed"].includes(ticketDetail.status) && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          className="min-h-[80px] text-xs border-slate-200 bg-white mb-2"
                          data-testid="input-ticket-reply"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            disabled={!replyText.trim() || createReplyMutation.isPending}
                            onClick={() => createReplyMutation.mutate({ ticketId: selectedTicketId!, body: replyText.trim() })}
                            data-testid="button-send-reply"
                          >
                            {createReplyMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                            Send Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <Card className="border-slate-200 bg-white p-8 text-center">
                  <div className="text-xs text-slate-500">Ticket not found</div>
                </Card>
              )}
            </motion.div>
          )}

          <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">New Support Ticket</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Describe your issue and we'll get back to you as soon as possible.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Subject</label>
                  <Input
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="mt-1 h-8 text-xs border-slate-200"
                    data-testid="input-ticket-subject"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Category</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value)}
                      className="mt-1 w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                      data-testid="select-ticket-category"
                    >
                      <option value="support">Support</option>
                      <option value="sales">Sales</option>
                      <option value="billing">Billing</option>
                      <option value="provisioning">Provisioning</option>
                      <option value="smart_hands">SmartHands</option>
                      <option value="abuse">Abuse</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Priority</label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value)}
                      className="mt-1 w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                      data-testid="select-ticket-priority"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Description</label>
                  <Textarea
                    value={newTicketBody}
                    onChange={(e) => setNewTicketBody(e.target.value)}
                    placeholder="Provide details about your issue..."
                    className="mt-1 min-h-[100px] text-xs border-slate-200"
                    data-testid="input-ticket-body"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => setShowNewTicket(false)} className="h-8 text-xs" data-testid="button-cancel-ticket">Cancel</Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                    disabled={!newTicketSubject.trim() || !newTicketBody.trim() || createTicketMutation.isPending}
                    onClick={() => createTicketMutation.mutate({ subject: newTicketSubject.trim(), body: newTicketBody.trim(), category: newTicketCategory, priority: newTicketPriority })}
                    data-testid="button-submit-ticket"
                  >
                    {createTicketMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                    Create Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                    <div className="mt-1 text-2xl font-bold text-slate-900">{tickets.filter(t => !["resolved", "closed"].includes(t.status)).length}</div>
                    <div className="mt-0.5 text-[10px] text-rose-600">{tickets.filter(t => t.priority === "urgent").length > 0 ? `${tickets.filter(t => t.priority === "urgent").length} urgent` : "None urgent"}</div>
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
