import { createFileRoute, Link } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { brands, statusLabel, type ScreenType, type Status } from "@/lib/signage-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Sundry Signal" },
      {
        name: "description",
        content:
          "Fleet uptime by brand, screen-type mix, content throughput and review turnaround across the estate.",
      },
      { property: "og:title", content: "Reports · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Fleet uptime by brand, screen-type mix, content throughput and review turnaround across the estate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

const statusBar: Record<Status, string> = {
  online: "bg-success",
  syncing: "bg-warn",
  failed: "bg-danger",
  offline: "bg-mut/50",
};

const screenTypes: ScreenType[] = ["Menu Board", "Promo", "Queue (QMS)"];

function Panel({
  title,
  value,
  note,
  children,
  footer,
}: {
  title: string;
  value?: string | number;
  note?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="panel-frost flex flex-col p-4">
      <div className="text-[13px] text-mut">{title}</div>
      {value !== undefined && (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[28px] font-medium tabular-nums text-ink-strong">{value}</span>
          {note && <span className="text-[12px] text-mut">{note}</span>}
        </div>
      )}
      <div className="mt-3 flex-1 border-t border-hair pt-3">{children}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="min-w-0 truncate text-mut">{label}</span>
      <span className="shrink-0 tabular-nums text-ink-strong">{value}</span>
    </div>
  );
}

function ReportsPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { screens, media, playlists, schedules, audit, pendingApprovals } = useConsoleStore();

  const fleet = screens.filter((s) => inScope(s.brandId));
  const online = fleet.filter((s) => s.status === "online").length;
  const uptime = fleet.length ? Math.round((online / fleet.length) * 1000) / 10 : 0;

  const byStatus = (["online", "syncing", "failed", "offline"] as Status[]).map((status) => ({
    status,
    count: fleet.filter((s) => s.status === status).length,
  }));

  const brandRows = (isAllBrands ? brands : brands.filter((b) => b.id === activeBrand.id)).map(
    (b) => {
      const owned = screens.filter((s) => s.brandId === b.id);
      const up = owned.filter((s) => s.status === "online").length;
      return {
        id: b.id,
        name: b.name,
        total: owned.length,
        pct: owned.length ? Math.round((up / owned.length) * 100) : 0,
      };
    },
  );

  const assets = media.filter((m) => inScope(m.brandId));
  const approvedAssets = assets.filter((m) => m.approval === "Approved").length;
  const liveCampaigns = schedules.filter((s) => inScope(s.brandId) && s.state === "Live");
  const reach = liveCampaigns.reduce((sum, s) => sum + s.affected, 0);
  const trail = audit.filter((e) => (e.brandId === null ? isAllBrands : inScope(e.brandId)));

  return (
    <ConsoleShell
      title={isAllBrands ? "Reports · All Brands" : "Reports"}
      subtitle={`${fleet.length} screens in scope · ${uptime}% online · figures update with the live console state`}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Fleet uptime" value={`${uptime}%`} note={`${online}/${fleet.length} online`}>
          <div className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-hair">
            {byStatus
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.status}
                  className={statusBar[s.status]}
                  style={{ width: `${(s.count / Math.max(fleet.length, 1)) * 100}%` }}
                />
              ))}
          </div>
          {byStatus.map((s) => (
            <Row key={s.status} label={statusLabel[s.status]} value={s.count} />
          ))}
        </Panel>

        <Panel
          title="Screen mix"
          value={screenTypes.length}
          note={`across ${fleet.length} screens`}
        >
          {screenTypes.map((t) => (
            <Row key={t} label={t} value={fleet.filter((s) => s.type === t).length} />
          ))}
          <Row label="Cities covered" value={new Set(fleet.map((s) => s.city)).size} />
        </Panel>

        <Panel title="Content throughput" value={assets.length} note="creatives">
          <Row label="Approved" value={approvedAssets} />
          <Row label="Awaiting review" value={pendingApprovals} />
          <Row label="Playlists built" value={playlists.filter((p) => inScope(p.brandId)).length} />
          <Row label="Videos" value={assets.filter((m) => m.kind === "Video").length} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Uptime by brand">
          {brandRows.map((b) => (
            <div key={b.id} className="py-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="truncate text-mut">{b.name}</span>
                <span className="shrink-0 tabular-nums text-ink-strong">
                  {b.pct}% · {b.total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hair">
                <div className="h-full rounded-full bg-success" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel
          title="Live campaign reach"
          value={reach}
          note="screens serving a campaign"
          footer={
            <Link
              to="/campaigns"
              className="flex h-9 items-center justify-center rounded-lg border border-hair-strong text-[12px] font-medium text-ink-soft transition hover:bg-[#fafafa]"
            >
              View campaigns
            </Link>
          }
        >
          {liveCampaigns.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-mut">Nothing live in this workspace.</p>
          ) : (
            liveCampaigns.map((c) => (
              <Row key={c.id} label={c.name} value={`${c.affected} screens`} />
            ))
          )}
        </Panel>
      </div>

      <Panel
        title="Activity recorded"
        value={trail.length}
        note="audit entries in scope"
        footer={
          <Link
            to="/audit"
            className="flex h-9 items-center justify-center rounded-lg border border-hair-strong text-[12px] font-medium text-ink-soft transition hover:bg-[#fafafa]"
          >
            Open audit log
          </Link>
        }
      >
        {(["Content", "Publishing", "Approval", "Screens", "Users"] as const).map((c) => (
          <Row key={c} label={c} value={trail.filter((e) => e.category === c).length} />
        ))}
      </Panel>
    </ConsoleShell>
  );
}
