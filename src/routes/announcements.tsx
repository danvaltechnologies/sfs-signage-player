import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Plus } from "lucide-react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ApprovalChip, StateChip } from "@/components/console/StatusChip";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { CreateButton } from "@/components/console/create-dialogs";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements · Sundry Signal" },
      {
        name: "description",
        content:
          "Scrolling ticker and banner overlays targeted by brand and location, with automatic expiry on the player.",
      },
      { property: "og:title", content: "Announcements · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Scrolling ticker and banner overlays targeted by brand and location, with automatic expiry on the player.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { announcements, screens } = useConsoleStore();
  const mine = announcements.filter((a) => inScope(a.brandId));
  // Only an approved overlay is allowed on a screen.
  const live = mine.find((a) => a.state === "Live" && a.approval === "Approved");
  const awaiting = mine.filter((a) => a.approval === "Pending").length;
  const target = screens.filter((s) => inScope(s.brandId)).length;


  return (
    <ConsoleShell
      title={isAllBrands ? "Announcements · All Brands" : "Announcements"}
      subtitle={`${mine.filter((a) => a.state === "Live" && a.approval === "Approved").length} overlay live · ${awaiting} awaiting approval · removed automatically at expiry`}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="anim-fadeup panel-frost lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line/8 px-4 py-3">
            <div className="text-[13px] font-medium">Overlays</div>
            <span className="font-mono text-[10px] text-mut">{mine.length}</span>
          </div>
          {mine.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] font-medium">No announcements for {activeBrand.name}</p>
              <p className="mt-1 font-mono text-[10px] text-mut">
                Create a ticker for outages, price changes or opening hours.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 px-2 py-2">
              {mine.map((a) => (
                <div key={a.id} className="rounded-md border border-line/10 bg-panel2/45 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px]">{a.text}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <ApprovalChip approval={a.approval} />
                      <StateChip state={a.state} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[10px] text-mut">
                    <span>{a.position}</span>
                    <span>·</span>
                    <span>expires {a.expires}</span>
                    {a.approval !== "Approved" && (
                      <span className="text-warn">· held until a line manager approves it</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "120ms" }}>
          <div className="text-[13px] font-medium">Player preview</div>
          <div className="mt-3 aspect-video overflow-hidden rounded-md border border-line/15 bg-panel2">
            <div className="flex h-full flex-col justify-end">
              <div className="overflow-hidden border-t border-accent/25 bg-accent/12 px-3 py-2">
                <p className="truncate font-mono text-[10px] text-accent">
                  {live?.text ?? "No live overlay on this brand's screens"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-accent/20 bg-accent/8 p-3">
            <div className="text-[9px] font-medium uppercase text-accent">
              Affected on publish
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-medium tabular-nums text-accent">{target}</span>
              <span className="font-mono text-[10px] text-mut">{activeBrand.name} screens</span>
            </div>
          </div>
          <div className="mt-3">
            <CreateButton
              kind="announcement"
              label="Publish overlay"
              icon={<Megaphone />}
              className="w-full text-[12px] font-semibold"
            />
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
