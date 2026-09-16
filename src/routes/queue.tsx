import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BellRing,
  ChefHat,
  Clock,
  Maximize2,
  Minimize2,
  Monitor,
  Plug,
  PlayCircle,
  RefreshCw,
  Timer,
  Webhook,
  X,
} from "lucide-react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useBrand } from "@/components/console/brand-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  collectOrder,
  getQueueSnapshot,
  setBrandTimings,
  setPrepMinutes,
  type QueueSnapshot,
} from "@/lib/queue.functions";
import { brands, queueOutlets, type QueueStage } from "@/lib/signage-data";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Queue Management · Sundry Signal" },
      {
        name: "description",
        content:
          "POS-connected order queue for every outlet — paid tickets arrive by webhook and move to ready automatically using each brand's product prep times.",
      },
      { property: "og:title", content: "Queue Management · Sundry Signal" },
      {
        property: "og:description",
        content:
          "POS-connected order queue for every outlet — paid tickets arrive by webhook and move to ready automatically using each brand's product prep times.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QueuePage,
});

const stageTone: Record<QueueStage, string> = {
  Placed: "bg-frost/6 ring-frost/12 text-mut",
  Preparing: "bg-warn/10 ring-warn/25 text-warn",
  Ready: "bg-success/10 ring-success/25 text-success",
  Collected: "bg-frost/6 ring-frost/12 text-mut",
};

const linkTone = {
  connected: { label: "POS connected", cls: "bg-success/10 ring-success/25 text-success", dot: "bg-success" },
  degraded: { label: "POS quiet", cls: "bg-warn/10 ring-warn/25 text-warn", dot: "bg-warn pulse-dot" },
  offline: { label: "POS offline", cls: "bg-danger/10 ring-danger/25 text-danger", dot: "bg-danger" },
} as const;

type Ticket = { id: string; ticket: string; customer?: string };

/** The live counter board exactly as customers see it, playable full screen. */
function QueueBoardPlayer({
  title,
  waiting,
  ready,
  avg,
  onClose,
}: {
  title: string;
  waiting: Ticket[];
  ready: Ticket[];
  avg: number;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
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
      aria-label="Counter screen"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-line/15 bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">Counter screen · {title}</div>
            <div className="mt-0.5 font-mono text-[10px] text-mut">
              Live from the point of sale · updates every few seconds
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "View full screen"}
              className="h-8 w-8 p-0 text-mut hover:text-frost"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close counter screen"
              className="h-8 w-8 p-0 text-mut hover:text-frost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div ref={stageRef} className="bg-neutral-950">
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                <ChefHat className="size-4" strokeWidth={1.5} aria-hidden="true" /> Preparing
              </div>
              <div className="mt-4 space-y-2">
                {waiting.slice(0, 6).map((o) => (
                  <div key={o.id} className="font-mono text-3xl tabular-nums text-white/70">
                    {o.ticket}
                  </div>
                ))}
                {waiting.length === 0 && <div className="font-mono text-xl text-white/35">—</div>}
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                <BellRing className="size-4" strokeWidth={1.5} aria-hidden="true" /> Ready
              </div>
              <div className="mt-4 space-y-2">
                {ready.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="font-mono text-3xl font-semibold tabular-nums text-emerald-300 [animation-duration:2s] animate-pulse"
                  >
                    {o.ticket}
                  </div>
                ))}
                {ready.length === 0 && <div className="font-mono text-xl text-white/35">—</div>}
              </div>
            </div>
          </div>
          <div className="border-t border-accent/40 bg-accent px-4 py-3">
            <p className="truncate text-center font-mono text-[13px] font-semibold text-white">
              Now serving {ready[0]?.ticket ?? "—"} · average wait {avg} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueuePage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const fetchSnapshot = useServerFn(getQueueSnapshot);
  const queryClient = useQueryClient();
  const [outletId, setOutletId] = useState<string>("all");
  const [boardOpen, setBoardOpen] = useState(false);
  const [configBrandId, setConfigBrandId] = useState<string>(brands[0]!.id);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["queue-snapshot"],
    queryFn: () => fetchSnapshot(),
    refetchInterval: 5000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["queue-snapshot"] });
  const savePrep = useMutation({ mutationFn: useServerFn(setPrepMinutes), onSuccess: invalidate });
  const saveTimings = useMutation({ mutationFn: useServerFn(setBrandTimings), onSuccess: invalidate });
  const collect = useMutation({ mutationFn: useServerFn(collectOrder), onSuccess: invalidate });

  const orders = data?.orders ?? [];
  const config = data?.config ?? [];
  const links = useMemo(() => new Map((data?.links ?? []).map((l) => [l.outletId, l])), [data?.links]);
  const outlets = useMemo(() => queueOutlets.filter((o) => inScope(o.brandId)), [inScope]);

  const scoped = orders.filter((o) => inScope(o.brandId) && (outletId === "all" || o.outletId === outletId));
  const waiting = scoped.filter((o) => o.stage === "Placed" || o.stage === "Preparing");
  const ready = scoped.filter((o) => o.stage === "Ready");
  const collected = scoped.filter((o) => o.stage === "Collected");
  const late = waiting.filter((o) => o.overdue);
  const avg = waiting.length
    ? Math.round((waiting.reduce((s, o) => s + o.elapsed, 0) / waiting.length) * 10) / 10
    : 0;

  const activeConfig = config.find((c) => c.brandId === (isAllBrands ? configBrandId : activeBrand.id));
  const configBrand = brands.find((b) => b.id === activeConfig?.brandId);

  const kpis = [
    { label: "In the queue", value: waiting.length, note: "placed + preparing", dot: "bg-warn", noteClass: "text-mut" },
    { label: "Ready for pickup", value: ready.length, note: "called on screen", dot: "bg-success", noteClass: "text-success" },
    { label: "Avg wait", value: `${avg}m`, note: "current tickets", dot: "bg-accent", noteClass: "text-mut" },
    { label: "Past prep time", value: late.length, note: "needs a nudge", dot: "bg-danger", noteClass: late.length ? "text-danger" : "text-mut" },
    { label: "Queue screens", value: outlets.reduce((s, o) => s + o.queueScreens, 0), note: `${outlets.length} outlets`, dot: "bg-frost/40", noteClass: "text-mut" },
    { label: "POS terminals", value: outlets.reduce((s, o) => s + o.posTerminals, 0), note: "feeding orders", dot: "bg-frost/40", noteClass: "text-mut" },
  ];

  const secondsAgo = dataUpdatedAt ? Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000)) : 0;

  return (
    <ConsoleShell
      title={isAllBrands ? "Queue Management · All Brands" : "Queue Management"}
      subtitle={
        isError
          ? "Order feed unreachable — retry the sync"
          : isLoading
            ? "Connecting to the order feed…"
            : `Live from the POS · ${waiting.length} preparing · ${ready.length} ready · updated ${secondsAgo}s ago`
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((c, i) => (
          <div key={c.label} className="anim-fadeup panel-frost p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-mut">{c.label}</span>
              <span className={`size-1.5 rounded-full ${c.dot}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</div>
            <div className={`mt-1 text-[10px] ${c.noteClass}`}>{c.note}</div>
          </div>
        ))}
      </div>

      <div className="anim-fadeup panel-frost" style={{ animationDelay: "300ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/8 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Plug className="size-4" strokeWidth={1.5} aria-hidden="true" /> POS connections
          </div>
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className="h-8 cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[10px] text-mut focus:border-accent focus:outline-none"
          >
            <option value="all">Outlet: All</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.city}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5 px-2 py-2 sm:grid-cols-2 xl:grid-cols-4">
          {outlets.map((o) => {
            const state = links.get(o.id)?.posLink ?? "offline";
            const link = linkTone[state];
            const brand = brands.find((b) => b.id === o.brandId);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOutletId(o.id === outletId ? "all" : o.id)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  o.id === outletId ? "border-accent/40 bg-accent/8" : "border-line/10 bg-panel2/45 hover:bg-frost/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium">{o.name}</div>
                    <div className="mt-0.5 truncate text-[10px] text-mut">
                      {isAllBrands ? `${brand?.name} · ` : ""}
                      {o.city}
                    </div>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[9px] font-medium ring-1 ${link.cls}`}>
                    <span className={`size-1.5 rounded-full ${link.dot}`} />
                    {link.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-mut">
                  <span className="flex items-center gap-1">
                    <Monitor className="size-3" strokeWidth={1.5} aria-hidden="true" /> {o.queueScreens}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="size-3" strokeWidth={1.5} aria-hidden="true" /> {o.avgWait}
                  </span>
                  <span>{o.posTerminals} tills</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="anim-fadeup panel-frost lg:col-span-2" style={{ animationDelay: "360ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/8 px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              Live order queue
              <span className="rounded bg-panel2 px-2 py-0.5 text-[10px] text-mut">{scoped.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[10px] shadow-none"
              onClick={() => void refetch()}
            >
              <RefreshCw /> Sync POS now
            </Button>
          </div>
          <div className="px-2 py-1.5">
            <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[9px] font-medium uppercase text-mut/70">
              <div className="col-span-2">Ticket</div>
              <div className="col-span-4">Order</div>
              <div className="hidden sm:col-span-2 sm:block">Channel</div>
              <div className="col-span-2 sm:col-span-1">Wait</div>
              <div className="col-span-4 text-right sm:col-span-3">Stage</div>
            </div>
            {isError ? (
              <div className="px-3 py-10 text-center">
                <p className="text-[13px] font-medium">Order feed unavailable</p>
                <Button variant="outline" size="sm" className="mt-3 h-8 px-3 text-[10px]" onClick={() => void refetch()}>
                  <RefreshCw /> Retry
                </Button>
              </div>
            ) : scoped.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-[13px] font-medium">
                  {isLoading ? "Loading tickets…" : `No open tickets for ${activeBrand.name}`}
                </p>
                <p className="mt-1 font-mono text-[10px] text-mut">
                  Tickets appear the moment the POS posts a paid order to the webhook.
                </p>
              </div>
            ) : (
              scoped.map((o) => {
                const outlet = queueOutlets.find((x) => x.id === o.outletId);
                return (
                  <div
                    key={o.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-md px-2 py-2.5 hover:bg-frost/5"
                  >
                    <div className="col-span-2 font-mono text-[13px] font-medium tabular-nums">{o.ticket}</div>
                    <div className="col-span-4 min-w-0">
                      <div className="truncate text-[12px]">{o.items}</div>
                      <div className="mt-0.5 truncate text-[10px] text-mut">
                        {o.customer} · {outlet?.name ?? o.outletId} · {o.prepMinutes}m prep
                      </div>
                    </div>
                    <div className="hidden text-[11px] text-mut/90 sm:col-span-2 sm:block">{o.channel}</div>
                    <div
                      className={`col-span-2 font-mono text-[11px] tabular-nums sm:col-span-1 ${
                        o.overdue ? "text-danger" : "text-mut"
                      }`}
                    >
                      {o.elapsed}m
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-1.5 sm:col-span-3">
                      {o.stage === "Ready" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[9px] shadow-none"
                          disabled={collect.isPending}
                          onClick={() => collect.mutate({ data: { orderId: o.id } })}
                        >
                          Collected
                        </Button>
                      )}
                      <span className={`rounded px-2 py-1 text-[10px] font-medium ring-1 ${stageTone[o.stage]}`}>
                        {o.stage}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "420ms" }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Monitor className="size-4" strokeWidth={1.5} aria-hidden="true" /> Counter screen preview
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px] text-mut hover:text-frost"
              onClick={() => setBoardOpen(true)}
            >
              <PlayCircle className="size-3.5" strokeWidth={1.5} /> Play
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-line/15 bg-panel2">
            <div className="grid grid-cols-2 divide-x divide-line/10 text-center">
              <div className="p-3">
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium uppercase text-warn">
                  <ChefHat className="size-3" strokeWidth={1.5} aria-hidden="true" /> Preparing
                </div>
                <div className="mt-2 space-y-1">
                  {waiting.slice(0, 4).map((o) => (
                    <div key={o.id} className="font-mono text-[15px] tabular-nums text-mut">
                      {o.ticket}
                    </div>
                  ))}
                  {waiting.length === 0 && <div className="font-mono text-[11px] text-mut">—</div>}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium uppercase text-success">
                  <BellRing className="size-3" strokeWidth={1.5} aria-hidden="true" /> Ready
                </div>
                <div className="mt-2 space-y-1">
                  {ready.slice(0, 4).map((o) => (
                    <div key={o.id} className="font-mono text-[15px] font-semibold tabular-nums text-success">
                      {o.ticket}
                    </div>
                  ))}
                  {ready.length === 0 && <div className="font-mono text-[11px] text-mut">—</div>}
                </div>
              </div>
            </div>
            <div className="border-t border-accent/25 bg-accent/12 px-3 py-2">
              <p className="truncate font-mono text-[10px] text-accent">
                Now serving {ready[0]?.ticket ?? "—"} · average wait {avg}m
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-line/10 bg-panel2/45 p-3">
            <div className="text-[9px] font-medium uppercase text-mut">Cleared today</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-medium tabular-nums">{collected.length}</span>
              <span className="font-mono text-[10px] text-mut">tickets collected</span>
            </div>
          </div>
          <Button
            className="mt-3 w-full text-[12px] font-semibold"
            disabled={!ready[0] || collect.isPending}
            onClick={() => ready[0] && collect.mutate({ data: { orderId: ready[0]!.id } })}
          >
            <BellRing /> Clear next ready order
          </Button>
        </div>
      </div>

      <PrepTimings
        snapshot={data}
        brandId={activeConfig?.brandId ?? configBrandId}
        brandName={configBrand?.name ?? activeBrand.name}
        showBrandPicker={isAllBrands}
        onBrandChange={setConfigBrandId}
        onRuleChange={(ruleId, minutes) =>
          activeConfig && savePrep.mutate({ data: { brandId: activeConfig.brandId, ruleId, minutes } })
        }
        onTimingChange={(patch) =>
          activeConfig && saveTimings.mutate({ data: { brandId: activeConfig.brandId, ...patch } })
        }
        saving={savePrep.isPending || saveTimings.isPending}
      />

      <WebhookGuide />
      {boardOpen && (
        <QueueBoardPlayer
          title={isAllBrands ? "All brands" : activeBrand.name}
          waiting={waiting}
          ready={ready}
          avg={avg}
          onClose={() => setBoardOpen(false)}
        />
      )}
    </ConsoleShell>
  );
}

function PrepTimings({
  snapshot,
  brandId,
  brandName,
  showBrandPicker,
  onBrandChange,
  onRuleChange,
  onTimingChange,
  saving,
}: {
  snapshot: QueueSnapshot | undefined;
  brandId: string;
  brandName: string;
  showBrandPicker: boolean;
  onBrandChange: (id: string) => void;
  onRuleChange: (ruleId: string, minutes: number) => void;
  onTimingChange: (patch: { defaultMinutes?: number; autoCollectAfter?: number }) => void;
  saving: boolean;
}) {
  const cfg = snapshot?.config.find((c) => c.brandId === brandId);

  return (
    <div className="anim-fadeup panel-frost" style={{ animationDelay: "480ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/8 px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Clock className="size-4" strokeWidth={1.5} aria-hidden="true" /> Prep times · {brandName}
          {saving && <span className="text-[10px] font-normal text-mut">saving…</span>}
        </div>
        {showBrandPicker && (
          <select
            value={brandId}
            onChange={(e) => onBrandChange(e.target.value)}
            className="h-8 cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[10px] text-mut focus:border-accent focus:outline-none"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="px-4 pt-3 text-[11px] text-mut">
        The POS only tells us an order was placed and paid. These times decide when each ticket flips to Ready on the
        counter screens, and when it clears off the board.
      </p>
      <div className="grid gap-1.5 px-2 py-3 sm:grid-cols-2 xl:grid-cols-3">
        {cfg?.rules.map((rule) => (
          <div key={rule.id} className="rounded-md border border-line/10 bg-panel2/45 px-3 py-2.5">
            <div className="text-[12px] font-medium">{rule.product}</div>
            <div className="mt-0.5 truncate text-[10px] text-mut">matches: {rule.keywords.join(", ")}</div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={240}
                defaultValue={rule.minutes}
                aria-label={`${rule.product} prep minutes`}
                className="h-8 w-20 text-[12px]"
                onBlur={(e) => {
                  const v = Number(e.currentTarget.value);
                  if (Number.isFinite(v) && v !== rule.minutes) onRuleChange(rule.id, v);
                }}
              />
              <span className="text-[10px] text-mut">minutes to ready</span>
            </div>
          </div>
        ))}
        {!cfg && <div className="px-2 py-4 text-[11px] text-mut">Loading prep times…</div>}
      </div>
      {cfg && (
        <div className="grid gap-1.5 border-t border-line/8 px-2 py-3 sm:grid-cols-2">
          <div className="rounded-md border border-line/10 bg-panel2/45 px-3 py-2.5">
            <div className="text-[12px] font-medium">Default prep time</div>
            <div className="mt-0.5 text-[10px] text-mut">Used when no product line matches the ticket.</div>
            <Input
              type="number"
              min={0}
              max={240}
              defaultValue={cfg.defaultMinutes}
              aria-label="Default prep minutes"
              className="mt-2 h-8 w-20 text-[12px]"
              onBlur={(e) => {
                const v = Number(e.currentTarget.value);
                if (Number.isFinite(v) && v !== cfg.defaultMinutes) onTimingChange({ defaultMinutes: v });
              }}
            />
          </div>
          <div className="rounded-md border border-line/10 bg-panel2/45 px-3 py-2.5">
            <div className="text-[12px] font-medium">Clear from board after</div>
            <div className="mt-0.5 text-[10px] text-mut">Ready tickets auto-collect once this time passes.</div>
            <Input
              type="number"
              min={0}
              max={240}
              defaultValue={cfg.autoCollectAfter}
              aria-label="Auto collect minutes"
              className="mt-2 h-8 w-20 text-[12px]"
              onBlur={(e) => {
                const v = Number(e.currentTarget.value);
                if (Number.isFinite(v) && v !== cfg.autoCollectAfter) onTimingChange({ autoCollectAfter: v });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookGuide() {
  return (
    <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "540ms" }}>
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <Webhook className="size-4" strokeWidth={1.5} aria-hidden="true" /> POS connection details
      </div>
      <p className="mt-2 text-[11px] text-mut">
        Point each till system (or the middleware in front of it) at this endpoint. Every paid order becomes a queue
        ticket instantly.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-line/10 bg-panel2/60 p-3 font-mono text-[10px] leading-relaxed text-mut">
{`POST /api/public/pos/orders
x-sundry-signature: sha256=<HMAC-SHA256 of body, key POS_WEBHOOK_SECRET>

{
  "order_id": "TILL-7781",
  "ticket": "A-218",
  "brand_id": "kilimanjaro",
  "outlet_id": "o1",
  "channel": "Counter",
  "customer": "Ada O.",
  "paid_at": "2026-09-13T11:40:00Z",
  "items": [{ "name": "Jollof Bowl", "quantity": 2 }]
}`}
      </pre>
    </div>
  );
}
