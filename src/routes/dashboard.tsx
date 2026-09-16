import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { KpiStrip } from "@/components/console/KpiStrip";
import { ScreensExplorer } from "@/components/console/ScreensExplorer";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Fleet Dashboard · Sundry Signal" },
      {
        name: "description",
        content:
          "Live screen health, sync failures and active campaigns across every Sundry Foods brand in one operational view.",
      },
      { property: "og:title", content: "Fleet Dashboard · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Live screen health, sync failures and active campaigns across every Sundry Foods brand in one operational view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FleetDashboard,
});

const approvalTone = {
  Approved: "bg-success/10 text-success ring-success/25",
  Pending: "bg-warn/15 text-warn ring-warn/25",
  Rejected: "bg-danger/15 text-danger ring-danger/25",
} as const;

function FleetDashboard() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { media: mediaAssets, playlists, schedules, screens, audit, logAudit } = useConsoleStore();
  const brandAssets = mediaAssets.filter((m) => inScope(m.brandId)).slice(0, 2);
  const playlist = playlists.find((p) => inScope(p.brandId));
  const schedule = schedules.find((s) => inScope(s.brandId) && s.state === "Live");
  const total = screens.filter((s) => inScope(s.brandId)).length;
  const trail = audit.filter((e) => (e.brandId === null ? isAllBrands : inScope(e.brandId))).slice(0, 6);

  return (
    <ConsoleShell
      title={isAllBrands ? "Fleet Dashboard · All Brands" : "Fleet Dashboard"}
      subtitle={`${activeBrand.screens} ${activeBrand.name} screens · last heartbeat 14:32 WAT`}
    >
      <KpiStrip />

      <ScreensExplorer limit={6} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "360ms" }}>
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-medium">Media Library</div>
            <span className="font-mono text-[10px] text-mut">
              {mediaAssets.filter((m) => inScope(m.brandId)).length} assets
            </span>
          </div>
          {brandAssets.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {brandAssets.map((a) => (
                <div key={a.id} className="relative overflow-hidden rounded-lg ring-1 ring-frost/10">
                  <img
                    src={a.image}
                    alt={a.name}
                    width={512}
                    height={512}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span
                    className={`absolute bottom-1.5 left-1.5 rounded px-2 py-1 text-[9px] font-medium ring-1 ${approvalTone[a.approval]}`}
                  >
                    {a.approval}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 font-mono text-[10px] text-mut">
              No assets yet for {activeBrand.name}. Upload a creative to get started.
            </p>
          )}
          <Link
            to="/media"
            className="mt-3 block cursor-pointer rounded-md border border-dashed border-frost/15 px-3 py-2 text-center text-[11px] text-mut transition hover:border-accent/40 hover:text-accent"
          >
             <span className="inline-flex items-center gap-1.5"><Upload className="size-3.5" strokeWidth={1.5} /> Upload creative</span>
          </Link>
        </div>

        <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "420ms" }}>
          {playlist ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium">Playlist · {playlist.name}</div>
                <span className="font-mono text-[10px] tabular-nums text-mut">{playlist.total} total</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {playlist.items.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${
                      item.active ? "border-accent/20 bg-accent/8" : "border-line/10 bg-panel2/45"
                    }`}
                  >
                    <span className={`font-mono text-[10px] ${item.active ? "text-accent" : "text-mut"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[12px]">{item.label}</span>
                    <span
                      className={`font-mono text-[10px] tabular-nums ${item.active ? "text-accent" : "text-mut"}`}
                    >
                      {item.duration}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-medium">Playlists</div>
              <p className="mt-3 font-mono text-[10px] text-mut">
                {activeBrand.name} has no playlist yet. Build one from approved assets.
              </p>
            </>
          )}
        </div>

        <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "480ms" }}>
          <div className="text-[13px] font-medium">Schedule &amp; Targeting</div>
          <div className="mt-3 space-y-2 text-[10px]">
            <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
              <span className="text-mut">Window</span>
              <span className="text-frost/90">{schedule?.window ?? "Not set"}</span>
            </div>
            <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
              <span className="text-mut">Region</span>
              <span className="text-frost/90">{schedule?.regions ?? "—"}</span>
            </div>
            <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
              <span className="text-mut">Screen types</span>
              <span className="text-frost/90">{schedule?.types ?? "—"}</span>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-accent/20 bg-accent/8 p-3">
            <div className="text-[9px] font-medium uppercase text-accent">
              Affected on publish
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-medium tabular-nums text-accent">
                {schedule?.affected ?? total}
              </span>
              <span className="font-mono text-[10px] text-mut">{activeBrand.name} screens</span>
            </div>
          </div>
          <Button
            className="mt-3 w-full text-[12px] font-semibold"
            onClick={() => {
              const count = schedule?.affected ?? total;
              logAudit({
                brandId: schedule?.brandId ?? activeBrand.id,
                module: "schedules",
                category: "Publishing",
                action: "Schedule published",
                target: `${schedule?.name ?? "Current rotation"} → ${count} screens`,
                detail: `${schedule?.window ?? "Immediate"} · ${schedule?.regions ?? "All regions"}.`,
              });
              toast.success("Published", { description: `Content is rolling out to ${count} screens.` });
            }}
          >
            <Send /> Publish to {schedule?.affected ?? total} screens
          </Button>
        </div>
      </div>

      <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "540ms" }}>
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-medium">Audit Trail</div>
          <Link to="/audit" className="font-mono text-[10px] text-mut transition hover:text-accent">
            view all
          </Link>
        </div>
        <div className="mt-3 space-y-1">
          {trail.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-12 gap-2 rounded-lg px-3 py-2 font-mono text-[10px] hover:bg-frost/5"
            >
              <span className="col-span-2 tabular-nums text-mut">
                {new Date(entry.at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="col-span-3 text-frost/90">{entry.actor}</span>
              <span className="col-span-3 text-mut">{entry.action}</span>
              <span className="col-span-4 truncate text-right text-frost/70">{entry.target}</span>
            </div>
          ))}
        </div>
      </div>
    </ConsoleShell>
  );
}
