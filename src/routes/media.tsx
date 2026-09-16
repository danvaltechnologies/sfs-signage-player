import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Expand, Image as ImageIcon, LayoutGrid, List, Maximize2, Minimize2, Pause, Play, Search, X } from "lucide-react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { brands } from "@/lib/signage-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Library · Sundry Signal" },
      {
        name: "description",
        content:
          "Brand-isolated media library with approval states, durations and screen-type compatibility for every creative.",
      },
      { property: "og:title", content: "Media Library · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Brand-isolated media library with approval states, durations and screen-type compatibility for every creative.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MediaPage,
});

const approvalTone = {
  Approved: "bg-success/10 text-success ring-success/25",
  Pending: "bg-warn/15 text-warn ring-warn/25",
  Rejected: "bg-danger/15 text-danger ring-danger/25",
} as const;

const approvalFilters = ["All", "Approved", "Pending", "Rejected"] as const;
const typeFilters = ["All", "Image", "Video"] as const;

type Asset = ReturnType<typeof useConsoleStore>["media"][number];

function TypeBadge({ kind, className = "" }: { kind: string; className?: string }) {
  const Icon = kind === "Video" ? Clapperboard : ImageIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-1 text-[9px] font-medium text-white ring-1 ring-white/20 backdrop-blur-sm ${className}`}
      title={kind}
    >
      <Icon className="h-3 w-3" />
      {kind}
    </span>
  );
}

function PreviewPlayer({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const isVideo = asset.kind === "Video";
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVideo || !playing) return;
    const t = window.setInterval(() => setProgress((p) => (p + 1) % 100), 100);
    return () => window.clearInterval(t);
  }, [isVideo, playing]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${asset.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-line/15 bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{asset.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-mut">
              <TypeBadge kind={asset.kind} />
              <span className="tabular-nums">{asset.duration}</span>
              <span className={`rounded px-2 py-0.5 text-[9px] font-medium ring-1 ${approvalTone[asset.approval]}`}>
                {asset.approval}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close preview" className="h-8 w-8 p-0 text-mut hover:text-frost">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={stageRef} className="relative bg-black">
          <img
            src={asset.image}
            alt={asset.name}
            className={`max-h-[70vh] w-full object-contain ${isVideo && playing ? "animate-pulse [animation-duration:4s]" : ""}`}
          />
          {isVideo && !playing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play className="h-12 w-12 text-white/85" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
            {isVideo && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
            {isVideo && (
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-accent transition-[width] duration-100" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "View full screen"}
              title={fullscreen ? "Exit full screen" : "View full screen"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { media: mediaAssets } = useConsoleStore();
  const [approvalFilter, setApprovalFilter] = useState<(typeof approvalFilters)[number]>("All");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("All");
  const [brandFilter, setBrandFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<Asset | null>(null);

  const availableBrands = useMemo(
    () => brands.filter((b) => mediaAssets.some((m) => m.brandId === b.id)),
    [mediaAssets],
  );

  const assets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mediaAssets.filter((m) => {
      if (!inScope(m.brandId)) return false;
      if (approvalFilter !== "All" && m.approval !== approvalFilter) return false;
      if (typeFilter !== "All" && m.kind !== typeFilter) return false;
      if (isAllBrands && brandFilter !== "All" && m.brandId !== brandFilter) return false;
      if (!q) return true;
      const brandName = brands.find((b) => b.id === m.brandId)?.name.toLowerCase() ?? "";
      return (
        m.name.toLowerCase().includes(q) ||
        m.kind.toLowerCase().includes(q) ||
        m.duration.toLowerCase().includes(q) ||
        m.approval.toLowerCase().includes(q) ||
        brandName.includes(q)
      );
    });
  }, [mediaAssets, inScope, approvalFilter, typeFilter, isAllBrands, brandFilter, query]);

  const activeFilterCount =
    (approvalFilter !== "All" ? 1 : 0) +
    (typeFilter !== "All" ? 1 : 0) +
    (isAllBrands && brandFilter !== "All" ? 1 : 0);

  const clearFilters = () => {
    setApprovalFilter("All");
    setTypeFilter("All");
    setBrandFilter("All");
    setQuery("");
  };

  return (
    <ConsoleShell
      title={isAllBrands ? "Media Library · All Brands" : "Media Library"}
      subtitle={`${mediaAssets.filter((m) => inScope(m.brandId)).length} assets · uploads transcode to landscape and portrait automatically`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mut" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, type, duration, brand or status"
            className="h-9 rounded-md border-line/15 bg-panel pl-8 pr-8 text-[12px] placeholder:text-mut/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mut hover:text-frost"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as (typeof typeFilters)[number])}
            aria-label="Filter by type"
            className="h-8 rounded-md border border-line/15 bg-panel px-2 text-[11px] text-frost outline-none focus:border-accent/40"
          >
            {typeFilters.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All types" : t}
              </option>
            ))}
          </select>
          {isAllBrands && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              aria-label="Filter by brand"
              className="h-8 rounded-md border border-line/15 bg-panel px-2 text-[11px] text-frost outline-none focus:border-accent/40"
            >
              <option value="All">All brands</option>
              {availableBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-[11px] text-mut hover:text-frost">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {approvalFilters.map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            onClick={() => setApprovalFilter(f)}
            className={`h-8 px-3 text-[11px] shadow-none ${
              approvalFilter === f
                ? "border-accent/35 bg-accent/8 text-accent"
                : "border-line/15 bg-panel text-mut hover:text-frost"
            }`}
          >
            {f}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center rounded-md border border-line/15 bg-panel p-0.5">
            {(
              [
                { key: "grid", icon: <LayoutGrid className="h-3.5 w-3.5" />, label: "Grid view" },
                { key: "list", icon: <List className="h-3.5 w-3.5" />, label: "List view" },
              ] as const
            ).map((v) => (
              <Button
                key={v.key}
                variant="ghost"
                size="sm"
                aria-label={v.label}
                title={v.label}
                onClick={() => setView(v.key)}
                className={`h-7 w-7 p-0 shadow-none ${
                  view === v.key ? "bg-accent/10 text-accent" : "text-mut hover:text-frost"
                }`}
              >
                {v.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="panel-frost p-10 text-center">
          <p className="text-[13px] font-medium">Nothing here yet</p>
          <p className="mt-1 font-mono text-[10px] text-mut">
            {query || activeFilterCount > 0
              ? "No assets match your search or filters."
              : `No assets for ${activeBrand.name}.`}
          </p>
        </div>
      ) : view === "list" ? (
        <div className="panel-frost overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line/10 text-[10px] font-medium uppercase text-mut">
                <th className="px-3 py-2.5">Creative</th>
                {isAllBrands && <th className="px-3 py-2.5">Brand</th>}
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Duration</th>
                <th className="px-3 py-2.5">Approval</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b border-line/8 last:border-0 hover:bg-panel2/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={a.image}
                        alt={a.name}
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-10 w-10 rounded object-cover"
                      />
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  {isAllBrands && (
                    <td className="px-3 py-2 text-mut">
                      {brands.find((b) => b.id === a.brandId)?.name ?? a.brandId}
                    </td>
                  )}
                  <td className="px-3 py-2 text-mut">{a.kind}</td>
                  <td className="px-3 py-2 tabular-nums text-mut">{a.duration}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-1 text-[9px] font-medium ring-1 ${approvalTone[a.approval]}`}>
                      {a.approval}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {assets.map((a, i) => (
            <div
              key={a.id}
              className="anim-fadeup panel-frost overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="group relative">
                <img
                  src={a.image}
                  alt={a.name}
                  width={512}
                  height={512}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <TypeBadge kind={a.kind} className="absolute left-2 top-2" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    aria-label={a.kind === "Video" ? `Play ${a.name}` : `Preview ${a.name}`}
                    title={a.kind === "Video" ? "Play preview" : "Preview"}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition hover:scale-105 hover:bg-accent"
                  >
                    <Play className="h-5 w-5 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    aria-label={`Expand ${a.name}`}
                    title="Expand"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/25"
                  >
                    <Expand className="h-4 w-4" />
                  </button>
                </div>
                <span
                  className={`absolute bottom-2 left-2 rounded px-2 py-1 text-[9px] font-medium ring-1 ${approvalTone[a.approval]}`}
                >
                  {a.approval}
                </span>
              </div>
              <div className="p-3">
                <div className="text-[13px] font-medium">{a.name}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-mut">
                  <span>
                    {isAllBrands
                      ? `${brands.find((b) => b.id === a.brandId)?.name ?? a.brandId} · ${a.kind}`
                      : a.kind}
                  </span>
                  <span className="tabular-nums">{a.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {preview && <PreviewPlayer asset={preview} onClose={() => setPreview(null)} />}
    </ConsoleShell>
  );
}
