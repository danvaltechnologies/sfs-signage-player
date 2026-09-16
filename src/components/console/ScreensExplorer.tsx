import { useMemo, useState } from "react";
import { RefreshCw, ScrollText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { brands, type Screen, type Status } from "@/lib/signage-data";
import { StatusChip } from "./StatusChip";
import { useBrand } from "./brand-context";
import { useConsoleStore } from "./console-store";
import nowPlaying from "@/assets/now-playing.jpg";

const statusFilters: (Status | "all")[] = ["all", "online", "syncing", "failed", "offline"];

export function ScreensExplorer({ limit }: { limit?: number }) {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { screens: allScreens, logAudit } = useConsoleStore();
  const [status, setStatus] = useState<Status | "all">("all");
  const [type, setType] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = allScreens.filter(
      (s) =>
        inScope(s.brandId) &&
        (status === "all" || s.status === status) &&
        (type === "all" || s.type === type),
    );
    return limit ? list.slice(0, limit) : list;
  }, [allScreens, inScope, status, type, limit]);

  const selected: Screen | undefined =
    rows.find((s) => s.id === selectedId) ??
    rows.find((s) => s.status === "failed") ??
    rows[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="anim-fadeup panel-frost lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/8 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            {isAllBrands ? "Screens · All Brands" : "Screens"}
            <span className="rounded bg-panel2 px-2 py-0.5 text-[10px] text-mut">
              {rows.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {statusFilters.map((f) => (
              <Button
                key={f}
                variant="outline"
                size="sm"
                onClick={() => setStatus(f)}
                className={`h-8 px-3 text-[10px] shadow-none ${
                  status === f
                    ? "border-accent/35 bg-accent/8 text-accent"
                    : "border-line/15 bg-panel text-mut hover:text-frost"
                }`}
              >
                {f === "all" ? "Status: All" : f}
              </Button>
            ))}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-8 cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[10px] text-mut focus:border-accent focus:outline-none"
            >
              <option value="all">Type: All</option>
              <option value="Menu Board">Menu Board</option>
              <option value="Promo">Promo</option>
              <option value="Queue (QMS)">Queue (QMS)</option>
            </select>
          </div>
        </div>

        <div className="px-2 py-1.5">
          <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[9px] font-medium uppercase text-mut/70">
            <div className="col-span-4">Screen</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-2">Last Sync</div>
            <div className="col-span-3 text-right">Status</div>
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] font-medium">No screens match these filters</p>
              <p className="mt-1 font-mono text-[10px] text-mut">
                Clear the status or type filter to see {activeBrand.name} screens again.
              </p>
            </div>
          ) : (
            rows.map((s) => (
              <Button
                variant="ghost"
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`group grid h-auto w-full grid-cols-12 items-center gap-2 rounded-md px-2 py-2.5 text-left font-normal ring-1 hover:bg-frost/5 hover:text-frost ${
                  selected?.id === s.id ? "bg-frost/5 ring-accent/20" : "ring-transparent"
                }`}
              >
                <div className="col-span-4">
                  <div className="font-mono text-[12px] font-medium">{s.code}</div>
                  <div className="mt-0.5 text-[10px] text-mut">
                    {isAllBrands
                      ? `${brands.find((b) => b.id === s.brandId)?.name ?? s.brandId} · ${s.location} · ${s.city}`
                      : `${s.location} · ${s.city}`}
                  </div>
                </div>
                <div className="col-span-3 text-[11px] text-mut/90">{s.type}</div>
                <div
                  className={`col-span-2 text-[11px] tabular-nums ${
                    s.status === "failed" || s.status === "offline" ? "text-danger" : "text-mut"
                  }`}
                >
                  {s.lastSync}
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                   <span className="hidden text-[10px] text-mut opacity-0 group-hover:opacity-100 xl:inline">
                    {s.status === "online" || s.status === "syncing" ? "Sync · Reset" : "Retry · Diagnose"}
                  </span>
                  <StatusChip status={s.status} />
                </div>
              </Button>
            ))
          )}
        </div>
      </div>

      {selected ? (
        <div
          key={selected.id}
          className="anim-drawer rounded-md bg-panel p-4 ring-1 ring-frost/12"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-medium uppercase text-mut">Screen detail</div>
              <div className="mt-1 font-mono text-[15px] font-semibold">{selected.code}</div>
              {selected.storeCode ? (
                <div className="mt-0.5 text-[10px] text-mut">Store code {selected.storeCode}</div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedId(null)}
              className="size-7 text-mut hover:bg-panel2 hover:text-frost"
              aria-label="Close screen detail"
            >
              <X />
            </Button>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <StatusChip status={selected.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md border border-line/10 bg-panel2/45 p-2.5">
              <div className="text-mut/70">Location</div>
              <div className="mt-1 text-[12px] text-frost/90">
                {selected.location}, {selected.city}
              </div>
            </div>
            <div className="rounded-md border border-line/10 bg-panel2/45 p-2.5">
              <div className="text-mut/70">Type</div>
              <div className="mt-1 text-[12px] text-frost/90">{selected.type}</div>
            </div>
            <div className="rounded-md border border-line/10 bg-panel2/45 p-2.5">
              <div className="text-mut/70">Firmware</div>
              <div className="mt-1 text-[12px] text-frost/90">{selected.firmware}</div>
            </div>
            <div className="rounded-md border border-line/10 bg-panel2/45 p-2.5">
              <div className="text-mut/70">Last seen</div>
              <div
                className={`mt-1 text-[12px] ${
                  selected.status === "failed" || selected.status === "offline"
                    ? "text-danger"
                    : "text-frost/90"
                }`}
              >
                {selected.lastSync}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[9px] font-medium uppercase text-mut">Now playing</div>
            <div className="mt-2 overflow-hidden rounded-md border border-line/15 bg-panel2">
              <img
                src={nowPlaying}
                alt={`Content playing on ${selected.code}`}
                width={1024}
                height={512}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-mut">
              <span>{selected.playing}</span>
              <span className="tabular-nums">00:12 / 00:15</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              className="w-full text-[12px]"
              onClick={() => {
                logAudit({
                  brandId: selected.brandId,
                  module: "screens",
                  category: "Screens",
                  action: "Resync requested",
                  target: `${selected.code} · ${selected.location}`,
                  detail: "Operator forced a content resync from the screen detail panel.",
                  severity: "info",
                });
                toast.success("Resync queued", { description: `${selected.code} will pull fresh content.` });
              }}
            >
              <RefreshCw /> Force Resync
            </Button>
            <Button
              variant="outline"
              className="w-full text-[12px]"
              onClick={() =>
                toast.info(`Sync log · ${selected.code}`, {
                  description: `Last sync ${selected.lastSync} · firmware ${selected.firmware} · playing ${selected.playing}.`,
                })
              }
            >
              <ScrollText /> View Sync Log
            </Button>
          </div>
        </div>
      ) : (
        <div className="panel-frost p-4">
          <div className="text-[10px] font-medium uppercase text-mut">Screen detail</div>
          <p className="mt-3 text-[13px] font-medium">Select a screen</p>
          <p className="mt-1 font-mono text-[10px] text-mut">
            Pick any row to see its location, firmware, last heartbeat and what is on the glass right now.
          </p>
        </div>
      )}
    </div>
  );
}
