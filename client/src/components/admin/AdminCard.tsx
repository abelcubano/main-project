import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function AdminCard({ title, subtitle, icon: Icon, children, footer, className, accentColor = "blue" }: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  accentColor?: "blue" | "emerald" | "amber" | "violet" | "red" | "slate";
}) {
  const accentMap = {
    blue: "border-t-blue-500",
    emerald: "border-t-emerald-500",
    amber: "border-t-amber-500",
    violet: "border-t-violet-500",
    red: "border-t-red-500",
    slate: "border-t-slate-400",
  };

  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 shadow-sm border-t-2 flex flex-col", accentMap[accentColor], className)}>
      <div className="px-5 pt-4 pb-3 flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-[18px] h-[18px] text-slate-500" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 pb-4 flex-1">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}

export function KpiRow({ items }: { items: { label: string; value: string | number; sub?: string; color?: string }[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-[22px] font-bold text-slate-900 leading-none">{item.value}</div>
          <div className="text-[11px] text-slate-500 mt-1 leading-tight">{item.label}</div>
          {item.sub && <div className="text-[10px] mt-0.5 leading-tight" style={{ color: item.color || "#64748b" }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}
