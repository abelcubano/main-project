import { cn } from "@/lib/utils";

const statusStyles: Record<string, { bg: string; text: string; dot?: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  suspended: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  open: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  in_progress: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  waiting: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  closed: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  low: { bg: "bg-slate-100", text: "text-slate-600" },
  normal: { bg: "bg-slate-100", text: "text-slate-600" },
  high: { bg: "bg-amber-50", text: "text-amber-700" },
  urgent: { bg: "bg-red-50", text: "text-red-700" },
  admin: { bg: "bg-violet-50", text: "text-violet-700" },
  customer: { bg: "bg-blue-50", text: "text-blue-700" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  past_due: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  draft: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  provisioning: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const defaultStyle = { bg: "bg-slate-100", text: "text-slate-600" };

export function StatusBadge({ status, showDot = false, size = "sm", className }: {
  status: string;
  showDot?: boolean;
  size?: "xs" | "sm";
  className?: string;
}) {
  const style = statusStyles[status] || defaultStyle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full capitalize",
        style.bg, style.text,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
      data-testid={`badge-${status}`}
    >
      {showDot && style.dot && (
        <span className={cn("rounded-full flex-shrink-0", style.dot, size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      )}
      {status.replace(/_/g, " ")}
    </span>
  );
}
