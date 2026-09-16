import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardCheck, PlayCircle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ApprovalChip } from "@/components/console/StatusChip";
import { ScreenPlayer, usePlayback, type Playback } from "@/components/console/ScreenPlayer";
import { useBrand } from "@/components/console/brand-context";
import { approvalKindLabel, useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { brands, type ApprovalKind } from "@/lib/signage-data";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals · Sundry Signal" },
      {
        name: "description",
        content:
          "Line manager review queue: approve or send back creatives, playlists, campaigns and announcements before they reach any screen.",
      },
      { property: "og:title", content: "Approvals · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Line manager review queue: approve or send back creatives, playlists, campaigns and announcements before they reach any screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApprovalsPage,
});

const kindFilters = ["All", "media", "playlist", "schedule", "announcement"] as const;
const stateFilters = ["Pending", "Rejected", "Approved", "All"] as const;

function ApprovalsPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { approvalItems, reviewItem, submitForReview } = useConsoleStore();
  const [kindFilter, setKindFilter] = useState<(typeof kindFilters)[number]>("All");
  const [stateFilter, setStateFilter] = useState<(typeof stateFilters)[number]>("Pending");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [playing, setPlaying] = useState<Playback | null>(null);
  const getPlayback = usePlayback();

  const scoped = useMemo(
    () => approvalItems.filter((i) => inScope(i.brandId)),
    [approvalItems, inScope],
  );

  const rows = useMemo(
    () =>
      scoped.filter((i) => {
        if (kindFilter !== "All" && i.kind !== kindFilter) return false;
        if (stateFilter !== "All" && i.approval !== stateFilter) return false;
        return true;
      }),
    [scoped, kindFilter, stateFilter],
  );

  const selected = rows.find((i) => `${i.kind}:${i.id}` === selectedKey) ?? rows[0];
  const pending = scoped.filter((i) => i.approval === "Pending");
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? id;

  const decide = (kind: ApprovalKind, id: string, title: string, decision: "Approved" | "Rejected") => {
    reviewItem(kind, id, decision, note);
    setNote("");
    toast.success(decision === "Approved" ? "Approved" : "Sent back for changes", {
      description:
        decision === "Approved"
          ? `${title} is cleared to be scheduled or published.`
          : `${title} was returned to ${"the submitter"}.`,
    });
  };

  return (
    <ConsoleShell
      title={isAllBrands ? "Approvals · All Brands" : "Approvals"}
      subtitle={`${pending.length} item${pending.length === 1 ? "" : "s"} waiting on a line manager · nothing reaches a screen without sign-off`}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            { label: "Awaiting approval", value: scoped.filter((i) => i.approval === "Pending").length, tone: "text-warn" },
            { label: "Sent back", value: scoped.filter((i) => i.approval === "Rejected").length, tone: "text-danger" },
            { label: "Approved", value: scoped.filter((i) => i.approval === "Approved").length, tone: "text-success" },
            { label: "Total submissions", value: scoped.length, tone: "text-frost" },
          ] as const
        ).map((k, i) => (
          <div key={k.label} className="anim-fadeup panel-frost p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-mut">{k.label}</div>
            <div className={`mt-1.5 font-mono text-2xl font-medium tabular-nums ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {kindFilters.map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            onClick={() => setKindFilter(f)}
            className={`h-8 px-2.5 text-[10px] shadow-none ${
              kindFilter === f ? "border-accent/35 bg-accent/8 text-accent" : "border-line/15 bg-panel text-mut"
            }`}
          >
            {f === "All" ? "All types" : approvalKindLabel[f]}
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-line/20" />
        {stateFilters.map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            onClick={() => setStateFilter(f)}
            className={`h-8 px-2.5 text-[10px] shadow-none ${
              stateFilter === f ? "border-accent/35 bg-accent/8 text-accent" : "border-line/15 bg-panel text-mut"
            }`}
          >
            {f === "Pending" ? "Awaiting approval" : f === "Rejected" ? "Sent back" : f}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel-frost p-10 text-center">
          <ClipboardCheck className="mx-auto size-5 text-mut" strokeWidth={1.5} />
          <p className="mt-2 text-[13px] font-medium">Nothing to review for {activeBrand.name}</p>
          <p className="mt-1 font-mono text-[10px] text-mut">
            New creatives, playlists, campaigns and announcements land here the moment staff submit them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="anim-fadeup panel-frost lg:col-span-2">
            <div className="flex items-center justify-between border-b border-line/8 px-4 py-3">
              <div className="text-[13px] font-medium">Review queue</div>
              <span className="font-mono text-[10px] text-mut">{rows.length}</span>
            </div>
            <div className="px-2 py-1.5">
              {rows.map((item) => {
                const key = `${item.kind}:${item.id}`;
                const active = selected && `${selected.kind}:${selected.id}` === key;
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    onClick={() => {
                      setSelectedKey(key);
                      setNote("");
                    }}
                    className={`grid h-auto w-full grid-cols-12 items-center gap-2 rounded-md px-2 py-2.5 text-left font-normal ring-1 hover:bg-frost/5 hover:text-frost ${
                      active ? "bg-frost/5 ring-accent/20" : "ring-transparent"
                    }`}
                  >
                    <div className="col-span-6 min-w-0">
                      <div className="truncate text-[13px] font-medium">{item.title}</div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-mut">
                        {approvalKindLabel[item.kind]} · {brandName(item.brandId)} · by {item.submittedBy}
                      </div>
                    </div>
                    <div className="col-span-4 truncate font-mono text-[10px] text-mut">{item.summary}</div>
                    <div className="col-span-2 flex justify-end">
                      <ApprovalChip approval={item.approval} />
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "120ms" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-medium">{approvalKindLabel[selected.kind]} review</div>
                <ApprovalChip approval={selected.approval} />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed">{selected.title}</p>
              <Button
                variant="outline"
                className="mt-3 w-full text-[12px] font-semibold"
                onClick={() => {
                  const pb = getPlayback(selected.kind, selected.id);
                  if (pb) setPlaying(pb);
                }}
              >
                <PlayCircle /> Play as it will appear on screen
              </Button>
              <div className="mt-3 space-y-2 text-[10px]">
                <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                  <span className="text-mut">Brand</span>
                  <span className="text-frost/90">{brandName(selected.brandId)}</span>
                </div>
                <div className="flex justify-between gap-3 rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                  <span className="text-mut">Details</span>
                  <span className="text-right text-frost/90">{selected.summary}</span>
                </div>
                <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                  <span className="text-mut">Submitted by</span>
                  <span className="text-frost/90">{selected.submittedBy}</span>
                </div>
                {selected.reviewer && (
                  <div className="flex justify-between rounded-md border border-line/10 bg-panel2/45 px-3 py-2">
                    <span className="text-mut">Reviewed by</span>
                    <span className="text-frost/90">{selected.reviewer}</span>
                  </div>
                )}
              </div>

              {selected.reviewNote && (
                <p className="mt-3 rounded-md border border-line/12 bg-panel2/45 px-3 py-2 text-[11px] text-mut">
                  “{selected.reviewNote}”
                </p>
              )}

              {selected.approval === "Pending" ? (
                <>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Optional note for the submitter — required reason if you send it back."
                    className="mt-3 text-[12px]"
                  />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button
                      className="text-[12px] font-semibold"
                      onClick={() => decide(selected.kind, selected.id, selected.title, "Approved")}
                    >
                      <Check /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[12px] font-semibold"
                      onClick={() => decide(selected.kind, selected.id, selected.title, "Rejected")}
                    >
                      <X /> Send back
                    </Button>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-mut">
                    Until you approve it, this item cannot be scheduled or pushed to any screen.
                  </p>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="mt-3 w-full text-[12px]"
                  onClick={() => {
                    submitForReview(selected.kind, selected.id);
                    toast.success("Sent for approval", {
                      description: `${selected.title} is back in the review queue.`,
                    });
                  }}
                >
                  <RotateCcw /> Send for approval again
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {playing && <ScreenPlayer playback={playing} onClose={() => setPlaying(null)} />}
    </ConsoleShell>
  );
}
