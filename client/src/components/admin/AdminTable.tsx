import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
};

type SortDir = "asc" | "desc" | null;

export function AdminTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchPlaceholder = "Search...",
  searchKeys,
  actions,
  emptyMessage = "No records found",
  className,
  selectedId,
  getRowId,
  rowTestIdPrefix,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  searchKeys?: string[];
  actions?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  selectedId?: string | number | null;
  getRowId?: (row: T) => string | number;
  rowTestIdPrefix?: string;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
      else setSortDir("asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim() || !searchKeys?.length) return data;
    const q = search.toLowerCase();
    return data.filter(row => searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(q)));
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
        {searchKeys && searchKeys.length > 0 && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
              data-testid="input-table-search"
            />
          </div>
        )}
        <div className="flex-1" />
        {actions}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full" data-testid="admin-data-table">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "text-[11px] font-semibold text-slate-600 uppercase tracking-wider py-2.5 px-3",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.sortable && "cursor-pointer select-none hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        : <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => {
                const rowId = getRowId?.(row);
                const isSelected = selectedId != null && rowId != null && String(rowId) === String(selectedId);
                return (
                  <tr
                    key={rowId ?? i}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-slate-100 transition-colors",
                      onRowClick && "cursor-pointer",
                      isSelected
                        ? "bg-blue-50 hover:bg-blue-50"
                        : i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/30 hover:bg-slate-50"
                    )}
                    data-testid={`${rowTestIdPrefix ? `row-${rowTestIdPrefix}-` : "row-"}${rowId ?? i}`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={cn(
                          "py-2.5 px-3 text-[13px]",
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                        )}
                      >
                        {col.render ? col.render(row, i) : <span className="text-slate-700">{String(row[col.key] ?? "—")}</span>}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-white text-xs text-slate-500 flex-shrink-0">
        <span>Showing {sorted.length} of {data.length} records</span>
      </div>
    </div>
  );
}
