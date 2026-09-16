import { useMemo, useState } from "react";
import { ListFilter, MoreVertical, RefreshCw, ScrollText, Search } from "lucide-react";
import { toast } from "sonner";
import nowPlaying from "@/assets/now-playing.jpg";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { brands, type ScreenType, type Status } from "@/lib/signage-data";
import { useBrand } from "./brand-context";
import { useConsoleStore } from "./console-store";

const statusOptions: (Status | "all")[] = ["all", "online", "syncing", "failed", "offline"];
const statusLabel: Record<Status | "all", string> = {
  all: "All statuses",
  online: "Online",
  syncing: "Syncing",
  failed: "Sync failed",
  offline: "Offline",
};
const typeOptions: (ScreenType | "all")[] = ["all", "Menu Board", "Promo", "Queue (QMS)"];

/** Status pill colors, verbatim from the Figma "All Screens" table (node 98:1394). */
const pillTone: Record<Status, { bg: string; text: string; border?: string }> = {
  online: { bg: "bg-[#c2f5d9]", text: "text-[#0f7538]" },
  syncing: { bg: "bg-[#cce5ff]", text: "text-[#0066cc]" },
  offline: { bg: "bg-[#feccc9]", text: "text-[#b21c17]", border: "border border-[#b21c17]/35" },
  failed: { bg: "bg-[#feccc9]", text: "text-[#b21c17]", border: "border border-[#b21c17]/35" },
};

function StatusPill({ status }: { status: Status }) {
  const tone = pillTone[status];
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${tone.bg} ${tone.text} ${tone.border ?? ""}`}
    >
      {statusLabel[status]}
    </span>
  );
}

/** All Screens table — matches the Figma table card, with the kebab opening a screen-detail modal. */
export function ScreensTable() {
  const { isAllBrands, inScope } = useBrand();
  const { screens: allScreens, logAudit } = useConsoleStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [type, setType] = useState<ScreenType | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allScreens.filter(
      (s) =>
        inScope(s.brandId) &&
        (status === "all" || s.status === status) &&
        (type === "all" || s.type === type) &&
        (q === "" ||
          s.code.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)),
    );
  }, [allScreens, inScope, status, type, query]);

  const detail = allScreens.find((s) => s.id === detailId) ?? null;
  const activeFilters = (status !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0);

  return (
    <section className="rounded-2xl border border-hair bg-white p-5 shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">All Screens</div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]"
              strokeWidth={1.6}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search screens..."
              className="h-9 w-[220px] rounded-[10px] border-hair pl-9 text-sm shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] sm:w-[280px]"
            />
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-[10px] border border-[#ececec] bg-white px-3.5 text-sm font-medium text-[#5c5c5c] shadow-[0px_1px_1px_rgba(10,13,20,0.03)] transition hover:bg-[#fafafa]"
              >
                <ListFilter className="size-4" strokeWidth={1.6} />
                Filter
                {activeFilters > 0 && (
                  <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-semibold text-white">
                    {activeFilters}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 border-hair bg-white p-3">
              <div className="text-[11px] font-medium text-ink-soft">Status</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-md px-2 py-1 text-[11px] transition ${
                      status === s
                        ? "bg-accent/15 font-medium text-accent"
                        : "bg-[#f5f5f4] text-ink-soft hover:bg-[#ececea]"
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[11px] font-medium text-ink-soft">Type</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-md px-2 py-1 text-[11px] transition ${
                      type === t
                        ? "bg-accent/15 font-medium text-accent"
                        : "bg-[#f5f5f4] text-ink-soft hover:bg-[#ececea]"
                    }`}
                  >
                    {t === "all" ? "All types" : t}
                  </button>
                ))}
              </div>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("all");
                    setType("all");
                  }}
                  className="mt-3 text-[11px] font-medium text-ink-soft underline-offset-2 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-[13px] font-medium">No screens match these filters</p>
          <p className="mt-1 text-[11px] text-mut">
            Clear the search or filters to see them again.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[10px]">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-[#f7f7f7]">
                <th className="whitespace-nowrap rounded-l-[10px] px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Screen
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Location
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Status
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Type
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Currently Playing
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Last Seen
                </th>
                <th className="whitespace-nowrap rounded-r-[10px] px-3 py-2.5" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-hair last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 text-sm tracking-[-0.084px] text-[#171717]">
                    {s.code}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm tracking-[-0.084px] text-[#171717]">
                    {isAllBrands
                      ? `${brands.find((b) => b.id === s.brandId)?.name ?? s.brandId} · `
                      : ""}
                    {s.location}, {s.city}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm tracking-[-0.084px] text-[#171717]">
                    {s.type}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-sm tracking-[-0.084px] text-[#171717]">
                    {s.playing}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm tracking-[-0.084px] text-[#171717]">
                    {s.lastSync}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      aria-label={`Open ${s.code} details`}
                      className="grid size-8 place-items-center rounded-lg text-[#5c5c5c] transition hover:bg-[#f5f5f4] hover:text-ink-strong"
                    >
                      <MoreVertical className="size-[18px]" strokeWidth={1.7} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div>
                    <DialogTitle className="font-mono text-[15px]">{detail.code}</DialogTitle>
                    {detail.storeCode && (
                      <p className="mt-1 text-[11px] text-mut">Store code {detail.storeCode}</p>
                    )}
                  </div>
                  <StatusPill status={detail.status} />
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-md border border-hair bg-[#fafafa] p-2.5">
                  <div className="text-mut">Location</div>
                  <div className="mt-1 text-[12px] text-ink-strong">
                    {detail.location}, {detail.city}
                  </div>
                </div>
                <div className="rounded-md border border-hair bg-[#fafafa] p-2.5">
                  <div className="text-mut">Type</div>
                  <div className="mt-1 text-[12px] text-ink-strong">{detail.type}</div>
                </div>
                <div className="rounded-md border border-hair bg-[#fafafa] p-2.5">
                  <div className="text-mut">Firmware</div>
                  <div className="mt-1 text-[12px] text-ink-strong">{detail.firmware}</div>
                </div>
                <div className="rounded-md border border-hair bg-[#fafafa] p-2.5">
                  <div className="text-mut">Last seen</div>
                  <div
                    className={`mt-1 text-[12px] ${
                      detail.status === "failed" || detail.status === "offline"
                        ? "text-danger"
                        : "text-ink-strong"
                    }`}
                  >
                    {detail.lastSync}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-medium uppercase text-mut">Now playing</div>
                <div className="mt-2 overflow-hidden rounded-md border border-hair">
                  <img
                    src={nowPlaying}
                    alt={`Content playing on ${detail.code}`}
                    width={1024}
                    height={512}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-mut">
                  <span>{detail.playing}</span>
                  <span className="tabular-nums">00:12 / 00:15</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full text-[12px]"
                  onClick={() => {
                    logAudit({
                      brandId: detail.brandId,
                      module: "screens",
                      category: "Screens",
                      action: "Resync requested",
                      target: `${detail.code} · ${detail.location}`,
                      detail: "Operator forced a content resync from the screen detail modal.",
                      severity: "info",
                    });
                    toast.success("Resync queued", {
                      description: `${detail.code} will pull fresh content.`,
                    });
                  }}
                >
                  <RefreshCw /> Force Resync
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-[12px]"
                  onClick={() =>
                    toast.info(`Sync log · ${detail.code}`, {
                      description: `Last sync ${detail.lastSync} · firmware ${detail.firmware} · playing ${detail.playing}.`,
                    })
                  }
                >
                  <ScrollText /> View Sync Log
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
