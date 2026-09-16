import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, PlayCircle, Send, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ScreenPlayer, usePlayback, type Playback } from "@/components/console/ScreenPlayer";
import { ApprovalChip, StateChip } from "@/components/console/StatusChip";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/schedules")({
  head: () => ({
    meta: [
      { title: "Schedules & Targeting · Sundry Signal" },
      {
        name: "description",
        content:
          "Immediate, recurring and expiry-based publishing with brand, region, location and screen-type targeting.",
      },
      { property: "og:title", content: "Schedules & Targeting · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Immediate, recurring and expiry-based publishing with brand, region, location and screen-type targeting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulesPage,
});

function SchedulesPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { schedules, logAudit, submitForReview } = useConsoleStore();
  const mine = schedules.filter((s) => inScope(s.brandId));
  const [selectedId, setSelectedId] = useState<string | null>(mine[0]?.id ?? null);
  const [playing, setPlaying] = useState<Playback | null>(null);
  const getPlayback = usePlayback();
  const selected = mine.find((s) => s.id === selectedId) ?? mine[0];

  return (
    <ConsoleShell
      title={isAllBrands ? "Schedules · All Brands" : "Schedules"}
      subtitle={`${mine.filter((s) => s.state === "Live" && s.approval === "Approved").length} live · ${mine.filter((s) => s.approval === "Pending").length} awaiting approval · expiry is automatic`}
    >
      {!selected ? (
        <div className="panel-frost p-10 text-center">
          <p className="text-[13px] font-medium">No schedules for {activeBrand.name}</p>
          <p className="mt-1 font-mono text-[10px] text-mut">
            Pick a playlist and a target to publish your first campaign.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="anim-fadeup panel-frost lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line/8 px-4 py-3">
              <div className="text-[13px] font-medium">Campaign schedules</div>
              <span className="font-mono text-[10px] text-mut">{mine.length}</span>
            </div>
            <div className="px-2 py-1.5">
              <div className="grid grid-cols-12 gap-2 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-mut/70">
                <div className="col-span-4">Campaign</div>
                <div className="col-span-4">Window</div>
                <div className="col-span-2 text-right">Screens</div>
                <div className="col-span-2 text-right">State</div>
              </div>
              {mine.map((s) => (
                <Button
                  variant="ghost"
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`grid h-auto w-full grid-cols-12 items-center gap-2 rounded-md px-2 py-2.5 text-left font-normal ring-1 hover:bg-frost/5 hover:text-frost ${
                    selected?.id === s.id ? "bg-frost/5 ring-accent/20" : "ring-transparent"
                  }`}
                >
                  <div className="col-span-4 text-[13px] font-medium">{s.name}</div>
                  <div className="col-span-4 font-mono text-[11px] text-mut">{s.window}</div>
                  <div className="col-span-2 text-right font-mono text-[11px] tabular-nums text-mut">
                    {s.affected}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1.5">
                    <ApprovalChip approval={s.approval} />
                    <StateChip state={s.state} />
                  </div>

                </Button>
              ))}
            </div>
          </div>

          <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "120ms" }}>
            <div className="text-[13px] font-medium">Schedule &amp; Targeting</div>
              <div className="mt-3 space-y-2 text-[10px]">
              <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                <span className="text-mut">Window</span>
                <span className="text-frost/90">{selected.window}</span>
              </div>
              <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                <span className="text-mut">Region</span>
                <span className="text-frost/90">{selected.regions}</span>
              </div>
              <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                <span className="text-mut">Screen types</span>
                <span className="text-frost/90">{selected.types}</span>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-accent/20 bg-accent/8 p-3">
              <div className="text-[9px] font-medium uppercase text-accent">
                Affected on publish
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-medium tabular-nums text-accent">
                  {selected.affected}
                </span>
                <span className="font-mono text-[10px] text-mut">{activeBrand.name} screens</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full text-[12px] font-semibold"
              onClick={() => {
                const pb = getPlayback("schedule", selected.id);
                if (pb) setPlaying(pb);
              }}
            >
              <PlayCircle /> Play this campaign
            </Button>
            {selected.approval === "Approved" ? (
              <Button
                className="mt-3 w-full text-[12px] font-semibold"
                onClick={() => {
                  logAudit({
                    brandId: selected.brandId,
                    module: "schedules",
                    category: "Publishing",
                    action: "Schedule published",
                    target: `${selected.name} → ${selected.affected} screens`,
                    detail: `${selected.window} · ${selected.regions} · ${selected.types}. Approved by ${selected.reviewer ?? "line manager"}.`,
                  });
                  toast.success("Published", {
                    description: `${selected.name} is now on ${selected.affected} screens.`,
                  });
                }}
              >
                <Send /> Publish to {selected.affected} screens
              </Button>
            ) : (
              <div className="mt-3 space-y-2">
                <Button disabled className="w-full text-[12px] font-semibold">
                  <Lock /> Approval needed to publish
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-[12px]"
                  onClick={() => {
                    submitForReview("schedule", selected.id);
                    toast.success("Sent for approval", {
                      description: `${selected.name} is now with the line manager.`,
                    });
                  }}
                >
                  <SendHorizontal /> Send to line manager
                </Button>
                <p className="text-[10px] leading-relaxed text-mut">
                  {selected.approval === "Rejected"
                    ? `Sent back${selected.reviewNote ? `: “${selected.reviewNote}”` : ""}. Make changes and resubmit.`
                    : "A line manager must approve this campaign before it can go to any screen."}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
      {playing && <ScreenPlayer playback={playing} onClose={() => setPlaying(null)} />}
    </ConsoleShell>
  );
}
