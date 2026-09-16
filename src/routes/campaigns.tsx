import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, MapPin, Monitor } from "lucide-react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ApprovalChip, StateChip } from "@/components/console/StatusChip";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { brands } from "@/lib/signage-data";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns · Sundry Signal" },
      {
        name: "description",
        content:
          "Every live, scheduled and expired campaign across the fleet — targets, run window and approval state at a glance.",
      },
      { property: "og:title", content: "Campaigns · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Every live, scheduled and expired campaign across the fleet — targets, run window and approval state at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { schedules } = useConsoleStore();
  const mine = schedules.filter((s) => inScope(s.brandId));
  const live = mine.filter((s) => s.state === "Live").length;
  const scheduled = mine.filter((s) => s.state === "Scheduled").length;
  const reach = mine.filter((s) => s.state === "Live").reduce((sum, s) => sum + s.affected, 0);

  return (
    <ConsoleShell
      title={isAllBrands ? "Campaigns · All Brands" : "Campaigns"}
      subtitle={`${live} live · ${scheduled} scheduled · reaching ${reach} screens right now`}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Live campaigns", value: live, note: "publishing now" },
          { label: "Scheduled", value: scheduled, note: "queued to start" },
          { label: "Screens reached", value: reach, note: "across live campaigns" },
        ].map((kpi) => (
          <div key={kpi.label} className="panel-frost p-4">
            <div className="text-[12px] text-mut">{kpi.label}</div>
            <div className="mt-1 text-[28px] font-medium tabular-nums text-ink-strong">
              {kpi.value}
            </div>
            <div className="mt-1 text-[11px] text-mut">{kpi.note}</div>
          </div>
        ))}
      </div>

      {mine.length === 0 ? (
        <div className="panel-frost p-10 text-center">
          <p className="text-[13px] font-medium">No campaigns for {activeBrand.name}</p>
          <p className="mt-1 text-[11px] text-mut">
            Build a playlist first, then schedule it against a region and screen type.
          </p>
          <Link
            to="/playlists"
            className="mt-4 inline-flex items-center rounded-lg border border-hair-strong px-3 py-2 text-[12px] font-medium text-ink-soft transition hover:bg-[#fafafa]"
          >
            Go to playlists
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mine.map((c) => {
            const brand = brands.find((b) => b.id === c.brandId);
            return (
              <div key={c.id} className="panel-frost p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink-strong">{c.name}</div>
                    <div className="mt-1 text-[11px] text-mut">{brand?.name ?? "All Brands"}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StateChip state={c.state} />
                    <ApprovalChip approval={c.approval} />
                  </div>
                </div>

                <dl className="mt-4 space-y-2 border-t border-hair pt-3 text-[12px]">
                  <div className="flex items-center gap-2 text-mut">
                    <CalendarClock className="size-4 shrink-0" strokeWidth={1.6} />
                    <dt className="sr-only">Run window</dt>
                    <dd className="truncate">{c.window}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-mut">
                    <MapPin className="size-4 shrink-0" strokeWidth={1.6} />
                    <dt className="sr-only">Regions</dt>
                    <dd className="truncate">{c.regions}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-mut">
                    <Monitor className="size-4 shrink-0" strokeWidth={1.6} />
                    <dt className="sr-only">Targets</dt>
                    <dd className="truncate">
                      {c.types} · {c.affected} screens
                    </dd>
                  </div>
                </dl>

                <Link
                  to="/schedules"
                  className="mt-4 flex h-9 items-center justify-center rounded-lg border border-hair-strong text-[12px] font-medium text-ink-soft transition hover:bg-[#fafafa]"
                >
                  Open schedule
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </ConsoleShell>
  );
}
