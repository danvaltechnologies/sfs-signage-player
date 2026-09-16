import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, GripVertical, PlayCircle } from "lucide-react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ApprovalChip } from "@/components/console/StatusChip";
import { ScreenPlayer, usePlayback, type Playback } from "@/components/console/ScreenPlayer";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/playlists")({
  head: () => ({
    meta: [
      { title: "Playlists · Sundry Signal" },
      {
        name: "description",
        content:
          "Ordered playlists with per-item durations, rotation totals and screen-type compatibility checks before publish.",
      },
      { property: "og:title", content: "Playlists · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Ordered playlists with per-item durations, rotation totals and screen-type compatibility checks before publish.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { playlists } = useConsoleStore();
  const mine = playlists.filter((p) => inScope(p.brandId));
  const [openId, setOpenId] = useState<string | null>(mine[0]?.id ?? null);
  const [playing, setPlaying] = useState<Playback | null>(null);
  const getPlayback = usePlayback();

  return (
    <ConsoleShell
      title={isAllBrands ? "Playlists · All Brands" : "Playlists"}
      subtitle={`${mine.length} playlists for ${activeBrand.name} · reorder items to change rotation`}
    >
      {mine.length === 0 ? (
        <div className="panel-frost p-10 text-center">
          <p className="text-[13px] font-medium">No playlists for {activeBrand.name}</p>
          <p className="mt-1 font-mono text-[10px] text-mut">
            Create one from approved assets to start a rotation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mine.map((p, i) => {
            const open = openId === p.id;
            return (
              <div key={p.id} className="anim-fadeup panel-frost p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <Button
                  variant="ghost"
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="h-auto w-full justify-between p-0 text-left hover:bg-transparent hover:text-frost"
                >
                   <div className="flex items-center gap-2 text-[13px] font-medium">
                     {open ? <ChevronDown /> : <ChevronRight />}
                     {p.name}
                   </div>
                   <span className="flex items-center gap-2">
                     <ApprovalChip approval={p.approval} />
                     <span className="text-[10px] tabular-nums text-mut">{p.total} total</span>
                   </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-[11px] font-semibold"
                  onClick={() => {
                    const pb = getPlayback("playlist", p.id);
                    if (pb) setPlaying(pb);
                  }}
                >
                  <PlayCircle /> Play rotation
                </Button>
                {p.approval !== "Approved" && (
                  <p className="mt-2 font-mono text-[10px] text-warn">
                    {p.approval === "Rejected"
                      ? `Sent back${p.reviewNote ? `: “${p.reviewNote}”` : ""} — resubmit from Approvals.`
                      : "Waiting on a line manager before it can be scheduled."}
                  </p>
                )}


                {open && (
                  <div className="mt-3 space-y-1.5">
                    {p.items.map((item, idx) => (
                      <div
                        key={item.label}
                         className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${
                           item.active ? "border-accent/20 bg-accent/8" : "border-line/10 bg-panel2/45"
                        }`}
                      >
                         <GripVertical className="size-3.5 cursor-grab text-mut" strokeWidth={1.5} />
                        <span className={`font-mono text-[10px] ${item.active ? "text-accent" : "text-mut"}`}>
                          {String(idx + 1).padStart(2, "0")}
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
                )}
              </div>
            );
          })}
        </div>
      )}
      {playing && <ScreenPlayer playback={playing} onClose={() => setPlaying(null)} />}
    </ConsoleShell>
  );
}
