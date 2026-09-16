import { useBrand } from "./brand-context";
import { useConsoleStore } from "./console-store";

export function KpiStrip() {
  const { inScope } = useBrand();
  const { screens, schedules } = useConsoleStore();
  const mine = screens.filter((s) => inScope(s.brandId));
  const online = mine.filter((s) => s.status === "online").length;
  const syncing = mine.filter((s) => s.status === "syncing").length;
  const down = mine.filter((s) => s.status === "offline" || s.status === "failed").length;
  const campaigns = schedules.filter((s) => inScope(s.brandId) && s.state === "Live").length;
  const pct = mine.length ? Math.round((online / mine.length) * 1000) / 10 : 0;

  const cards = [
    { label: "Online", value: online, note: `${pct}% of fleet`, dot: "bg-success", noteClass: "text-success" },
    { label: "Syncing", value: syncing, note: "in progress", dot: "bg-warn pulse-dot", noteClass: "text-mut" },
    { label: "Offline", value: down, note: "needs attention", dot: "bg-danger", noteClass: "text-danger" },
    { label: "Active Campaigns", value: campaigns, note: "live now", dot: "bg-frost/40", noteClass: "text-mut" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="anim-fadeup panel-frost p-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-mut">{c.label}</span>
            <span className={`size-1.5 rounded-full ${c.dot}`} />
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</div>
          <div className={`mt-1 text-[10px] ${c.noteClass}`}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}
