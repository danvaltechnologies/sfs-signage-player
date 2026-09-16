import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ALL_BRANDS_ID, useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { StatusChip } from "@/components/console/StatusChip";
import { Button } from "@/components/ui/button";
import { brands, type Status } from "@/lib/signage-data";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · Sundry Signal" },
      {
        name: "description",
        content:
          "Super Admin insights across every Sundry Foods brand — fleet health, per-brand status, campaigns and alerts in one cross-brand view.",
      },
      { property: "og:title", content: "Insights · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Super Admin insights across every Sundry Foods brand — fleet health, per-brand status, campaigns and alerts in one cross-brand view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

const statusFilters: (Status | "all")[] = ["all", "online", "syncing", "failed", "offline"];

function InsightsPage() {
  const { setActiveBrandId } = useBrand();
  const { screens, schedules, announcements } = useConsoleStore();
  // Insights is always cross-brand reporting, regardless of which workspace was active before.
  useEffect(() => {
    setActiveBrandId(ALL_BRANDS_ID);
  }, [setActiveBrandId]);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const online = screens.filter((s) => s.status === "online").length;
  const syncing = screens.filter((s) => s.status === "syncing").length;
  const down = screens.filter((s) => s.status === "offline" || s.status === "failed").length;
  const liveCampaigns = schedules.filter((s) => s.state === "Live").length;
  const liveAnnouncements = announcements.filter((a) => a.state === "Live").length;
  const pct = screens.length ? Math.round((online / screens.length) * 1000) / 10 : 0;

  const kpis = [
    {
      label: "Total Screens",
      value: screens.length,
      note: "5 brands",
      dot: "bg-frost/40",
      noteClass: "text-mut",
    },
    {
      label: "Online",
      value: online,
      note: `${pct}% of fleet`,
      dot: "bg-success",
      noteClass: "text-success",
    },
    {
      label: "Syncing",
      value: syncing,
      note: "in progress",
      dot: "bg-warn pulse-dot",
      noteClass: "text-mut",
    },
    {
      label: "Offline",
      value: down,
      note: "needs attention",
      dot: "bg-danger",
      noteClass: "text-danger",
    },
    {
      label: "Live Campaigns",
      value: liveCampaigns,
      note: "all brands",
      dot: "bg-accent",
      noteClass: "text-mut",
    },
    {
      label: "Live Announcements",
      value: liveAnnouncements,
      note: "on air",
      dot: "bg-accent",
      noteClass: "text-mut",
    },
  ];

  const rows = useMemo(
    () =>
      screens.filter(
        (s) =>
          (brandFilter === "all" || s.brandId === brandFilter) &&
          (statusFilter === "all" || s.status === statusFilter),
      ),
    [screens, brandFilter, statusFilter],
  );

  return (
    <ConsoleShell
      title="Insights"
      subtitle={`Super Admin · ${screens.length} screens across ${brands.length} brands · last heartbeat 14:32 WAT`}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((c, i) => (
          <div
            key={c.label}
            className="anim-fadeup panel-frost p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-mut">{c.label}</span>
              <span className={`size-1.5 rounded-full ${c.dot}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</div>
            <div className={`mt-1 text-[10px] ${c.noteClass}`}>{c.note}</div>
          </div>
        ))}
      </div>

      <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "360ms" }}>
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-medium">Brand Health</div>
          <span className="font-mono text-[10px] text-mut">{brands.length} brands</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {brands.map((b) => {
            const mine = screens.filter((s) => s.brandId === b.id);
            const on = mine.filter((s) => s.status === "online").length;
            const brandDown = mine.filter(
              (s) => s.status === "offline" || s.status === "failed",
            ).length;
            const health = mine.length ? Math.round((on / mine.length) * 100) : 0;
            return (
              <div
                key={b.id}
                className="grid grid-cols-12 items-center gap-3 rounded-md border border-line/10 bg-panel2/45 px-3 py-2.5"
              >
                <div className="col-span-5 flex items-center gap-2.5 sm:col-span-4">
                  <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium">{b.name}</div>
                    <div className="mt-0.5 text-[10px] text-mut">{mine.length} screens</div>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-frost/10">
                    <div
                      className={`h-full rounded-full ${brandDown ? "bg-warn" : "bg-success"}`}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono text-[10px] tabular-nums text-mut">
                  <span className="text-success">{on} on</span>
                  {" · "}
                  <span className={brandDown ? "text-danger" : ""}>{brandDown} down</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="anim-fadeup panel-frost" style={{ animationDelay: "420ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/8 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            All Screens
            <span className="rounded bg-panel2 px-2 py-0.5 text-[10px] text-mut">
              {rows.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-8 cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[10px] text-mut focus:border-accent focus:outline-none"
            >
              <option value="all">Brand: All</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {statusFilters.map((f) => (
              <Button
                key={f}
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(f)}
                className={`h-8 px-3 text-[10px] shadow-none ${
                  statusFilter === f
                    ? "border-accent/35 bg-accent/8 text-accent"
                    : "border-line/15 bg-panel text-mut hover:text-frost"
                }`}
              >
                {f === "all" ? "Status: All" : f}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-2 py-1.5">
          <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[9px] font-medium uppercase text-mut/70">
            <div className="col-span-4">Screen</div>
            <div className="col-span-3">Brand</div>
            <div className="col-span-2">Type</div>
            <div className="hidden sm:col-span-1 sm:block">Last Sync</div>
            <div className="col-span-3 text-right sm:col-span-2">Status</div>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] font-medium">No screens match these filters</p>
              <p className="mt-1 font-mono text-[10px] text-mut">
                Clear the brand or status filter to see the full fleet again.
              </p>
            </div>
          ) : (
            rows.map((s) => {
              const brand = brands.find((b) => b.id === s.brandId);
              return (
                <div
                  key={s.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-md px-2 py-2.5 ring-1 ring-transparent hover:bg-frost/5"
                >
                  <div className="col-span-4">
                    <div className="text-[13px] font-medium">{s.code}</div>
                    <div className="mt-0.5 text-[10px] text-mut">
                      {s.location} · {s.city}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 text-[11px] text-mut/90">
                    {brand && (
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: brand.color }}
                      />
                    )}
                    {brand?.name ?? s.brandId}
                  </div>
                  <div className="col-span-2 text-[11px] text-mut/90">{s.type}</div>
                  <div
                    className={`hidden text-[11px] tabular-nums sm:col-span-1 sm:block ${
                      s.status === "failed" || s.status === "offline" ? "text-danger" : "text-mut"
                    }`}
                  >
                    {s.lastSync}
                  </div>
                  <div className="col-span-3 flex justify-end sm:col-span-2">
                    <StatusChip status={s.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}
