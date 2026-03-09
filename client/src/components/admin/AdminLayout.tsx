import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Users,
  Headset,
  Server,
  ShoppingCart,
  DollarSign,
  Settings,
  Home,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSection = "home" | "clients" | "support" | "devices" | "orders" | "sales" | "settings";

const sectionIcons: Record<AdminSection, LucideIcon> = {
  home: Home,
  clients: Users,
  support: Headset,
  devices: Server,
  orders: ShoppingCart,
  sales: DollarSign,
  settings: Settings,
};

const sectionLabels: Record<AdminSection, string> = {
  home: "Home",
  clients: "Clients",
  support: "Support",
  devices: "Devices",
  orders: "Orders",
  sales: "Sales",
  settings: "Settings",
};

export type SidebarItem = {
  icon: LucideIcon;
  label: string;
  id: string;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
  collapsible?: boolean;
};

export function AdminLayout({
  currentSection,
  onSectionChange,
  sidebarGroups,
  breadcrumbs,
  userName,
  userRole,
  onLogout,
  children,
  topNavExtra,
  supportBadge,
  hiddenSections = [],
}: {
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  sidebarGroups: SidebarGroup[];
  breadcrumbs: string[];
  userName: string;
  userRole?: string;
  onLogout: () => void;
  children: React.ReactNode;
  topNavExtra?: React.ReactNode;
  supportBadge?: number;
  hiddenSections?: AdminSection[];
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleGroup(title: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function handleSectionChange(section: AdminSection) {
    onSectionChange(section);
    setMobileMenuOpen(false);
  }

  return (
    <div className="h-dvh flex flex-col bg-slate-100 overflow-hidden" data-testid="page-admin">
      <nav className="h-12 bg-[#0f172a] flex items-center px-4 flex-shrink-0 z-30" data-testid="top-nav">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden text-slate-400 hover:text-white mr-2 p-1"
          data-testid="button-mobile-sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleSectionChange("home")}
          className="text-sm font-bold text-white tracking-wide mr-6 hover:text-blue-300 transition-colors"
          data-testid="button-home"
        >
          911-DC
        </button>

        <div className="hidden md:flex items-center gap-0.5">
          {(["clients", "support", "devices", "orders", "sales", "settings"] as AdminSection[]).filter(sec => !hiddenSections.includes(sec)).map(sec => {
            const Icon = sectionIcons[sec];
            const isActive = currentSection === sec;
            return (
              <button
                key={sec}
                onClick={() => handleSectionChange(sec)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                )}
                data-testid={`section-${sec}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sectionLabels[sec]}
                {sec === "support" && supportBadge != null && supportBadge > 0 && (
                  <span className="ml-0.5 text-[10px] bg-red-500 text-white px-1.5 py-px rounded-full font-semibold leading-none">
                    {supportBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-400 hover:text-white p-1 mr-2"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {topNavExtra}

        <div className="flex items-center gap-3 text-sm">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400 text-xs">{userName}</span>
            {userRole && <span className="text-[10px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-medium">{userRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs"
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-t border-slate-700/50 px-4 py-2 flex-shrink-0 z-20" data-testid="mobile-menu">
          <div className="flex flex-wrap gap-1">
            {(["home", "clients", "support", "devices", "orders", "sales", "settings"] as AdminSection[]).filter(sec => !hiddenSections.includes(sec)).map(sec => {
              const Icon = sectionIcons[sec];
              const isActive = currentSection === sec;
              return (
                <button
                  key={sec}
                  onClick={() => handleSectionChange(sec)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                  data-testid={`mobile-section-${sec}`}
                >
                  <Icon className="w-4 h-4" />
                  {sectionLabels[sec]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-8 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 text-xs text-slate-500" data-testid="breadcrumb-bar">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <ChevronRight className="w-3 h-3 mx-1 text-slate-300" />}
            <span className={i === breadcrumbs.length - 1 ? "text-slate-800 font-medium" : ""}>{crumb}</span>
          </span>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={cn(
            "bg-[#1e293b] flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden",
            sidebarCollapsed ? "w-0 md:w-12" : "w-56"
          )}
          data-testid="sidebar"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
            {!sidebarCollapsed && (
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {sectionLabels[currentSection]}
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              data-testid="button-toggle-sidebar"
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {sidebarGroups.map(group => {
              const isCollapsed = collapsedGroups.has(group.title);
              return (
                <div key={group.title} className="mb-1">
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => group.collapsible && toggleGroup(group.title)}
                      className={cn(
                        "w-full text-left px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider",
                        group.collapsible
                          ? "text-slate-500 hover:text-slate-300 cursor-pointer"
                          : "text-slate-500 cursor-default"
                      )}
                    >
                      {group.collapsible && (
                        <ChevronRight className={cn("w-3 h-3 inline mr-0.5 transition-transform", !isCollapsed && "rotate-90")} />
                      )}
                      {group.title}
                    </button>
                  )}
                  {!isCollapsed && group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                          "w-full flex items-center gap-2 text-[13px] transition-colors",
                          sidebarCollapsed ? "px-3 py-2 justify-center" : "px-4 py-[6px]",
                          item.active
                            ? "bg-blue-600/20 text-blue-400 font-medium border-r-2 border-blue-500"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                        data-testid={`nav-${item.id}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            {item.badge != null && item.badge > 0 && (
                              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-px rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
