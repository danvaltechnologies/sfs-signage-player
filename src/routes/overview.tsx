import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  Clock,
  Image as ImageIcon,
  Info,
  Layers,
  ListVideo,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Monitor,
  RefreshCw,
  Search,
  Send,
  Upload,
  Video,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import {
  ActionRow,
  Card,
  CardHeader,
  FooterButton,
  StatRow,
  TableHead,
  healthTone,
} from "@/components/console/DashboardCard";
import { Input } from "@/components/ui/input";
import nowPlaying from "@/assets/now-playing.jpg";
import { brands, type AuditCategory } from "@/lib/signage-data";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview · Sundry Signal" },
      {
        name: "description",
        content:
          "A daily snapshot for the active workspace — fleet health, live campaigns, currently playing content, and what needs attention.",
      },
      { property: "og:title", content: "Overview · Sundry Signal" },
      {
        property: "og:description",
        content:
          "A daily snapshot for the active workspace — fleet health, live campaigns, currently playing content, and what needs attention.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});

/** Signed-in operator's first name, matching the sidebar profile card. */
const OPERATOR_FIRST_NAME = "Anthonia";

const categoryIcon: Record<AuditCategory, LucideIcon> = {
  Content: Upload,
  Publishing: Send,
  Approval: RefreshCw,
  Screens: Monitor,
  Queue: Clock,
  Users: Upload,
  Security: AlertCircle,
  System: RefreshCw,
};

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function OverviewPage() {
  const { activeBrand, inScope, isAllBrands } = useBrand();
  const { screens, schedules, media, playlists, approvalItems, audit } = useConsoleStore();
  const [query, setQuery] = useState("");

  const fleet = screens.filter((s) => inScope(s.brandId));
  const online = fleet.filter((s) => s.status === "online").length;
  const syncing = fleet.filter((s) => s.status === "syncing").length;
  const offline = fleet.filter((s) => s.status === "offline").length;
  const failed = fleet.filter((s) => s.status === "failed").length;
  const total = fleet.length;
  const downFraction = total ? (offline + failed) / total : 0;
  const health = healthTone(downFraction);

  const liveCampaigns = schedules.filter((s) => inScope(s.brandId) && s.state === "Live");
  const topCampaigns = [...liveCampaigns].sort((a, b) => b.affected - a.affected).slice(0, 3);
  const campaignsWeekChange =
    liveCampaigns.length >= 10 ? "+3%" : liveCampaigns.length > 0 ? "+1%" : "0%";

  const playingScreens = fleet.filter((s) => s.playing !== "—");
  const q = query.trim().toLowerCase();
  const filteredPlaying = playingScreens.filter(
    (s) =>
      q === "" ||
      s.playing.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q),
  );

  const assets = media.filter((m) => inScope(m.brandId));
  const images = assets.filter((m) => m.kind === "Image").length;
  const videos = assets.filter((m) => m.kind === "Video").length;
  const scopedPlaylists = playlists.filter((p) => inScope(p.brandId));
  const activePlaylists = scopedPlaylists.filter((p) => p.approval === "Approved").length;
  const pendingMedia = assets.filter((m) => m.approval === "Pending").length;
  const rejectedMedia = assets.filter((m) => m.approval === "Rejected").length;

  const locationCounts = new Map<string, number>();
  for (const s of fleet) {
    const brand = brands.find((b) => b.id === s.brandId)?.name ?? s.brandId;
    const store = s.storeCode ? s.storeCode.split("/")[0] : s.city;
    const key = `${brand} - ${store}`;
    locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1);
  }
  const topLocations = [...locationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const regions = new Set(fleet.map((s) => s.region)).size;
  const cities = new Set(fleet.map((s) => s.city)).size;

  const scopedApprovals = approvalItems.filter((i) => inScope(i.brandId));
  const awaitingPublish = scopedApprovals.filter((i) => i.approval === "Pending").length;

  const trail = audit
    .filter((e) => (e.brandId === null ? isAllBrands : inScope(e.brandId)))
    .slice(0, 3);

  const onlinePct = total ? (online / total) * 100 : 0;
  const syncingPct = total ? (syncing / total) * 100 : 0;
  const downPct = total ? ((offline + failed) / total) * 100 : 0;

  return (
    <ConsoleShell title={`Welcome back, ${OPERATOR_FIRST_NAME} 👋🏽`} subtitle="">
      <div className="grid gap-[22px] lg:grid-cols-3">
        {/* Total Screens */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full items-start justify-between">
              <div className="flex flex-col items-start">
                <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Total Screens
                </p>
                <p className="pt-1 text-2xl font-medium leading-8 text-[#171717]">{total}</p>
              </div>
              <span
                className={`flex h-5 items-center justify-center rounded-full px-2 ${health.bg}`}
              >
                <span className={`text-xs font-medium ${health.text}`}>{health.label}</span>
              </span>
            </div>
            <div className="flex w-full gap-[5px]">
              <div className="h-2 flex-1 rounded-[2px] bg-[#1fc16b]" />
              <div className="h-2 rounded-[2px] bg-[#09f]" style={{ width: `${syncingPct}%` }} />
              <div className="h-2 rounded-[2px] bg-accent" style={{ width: `${downPct}%` }} />
            </div>
            <div className="h-px w-full bg-hair" />
            <div className="w-full">
              <TableHead left="All Screens" right="Total" />
              <StatRow icon={Wifi} label="Online" value={`${online} (${Math.round(onlinePct)}%)`} />
              <StatRow
                icon={WifiOff}
                label="Offline"
                value={`${offline} (${Math.round((offline / Math.max(total, 1)) * 100)}%)`}
              />
              <StatRow icon={RefreshCw} label="Syncing" value={syncing} />
              <StatRow icon={AlertCircle} label="Issues" value={failed} />
            </div>
          </div>
          <FooterButton to="/screens">View screens</FooterButton>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <CardHeader
              title="Active Campaigns"
              value={liveCampaigns.length}
              note={`${campaignsWeekChange} vs last week`}
            />
            <div className="w-full pt-2">
              <TableHead left="Campaign" right="Screens" />
              {topCampaigns.length === 0 ? (
                <p className="py-3 text-sm text-[#a3a3a3]">Nothing live for {activeBrand.name}.</p>
              ) : (
                topCampaigns.map((c) => (
                  <StatRow key={c.id} icon={Megaphone} label={c.name} value={c.affected} />
                ))
              )}
            </div>
          </div>
          <FooterButton to="/campaigns">View campaigns</FooterButton>
        </Card>

        {/* Currently Playing */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full items-start justify-between border-b border-[#ececec] pb-4">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                    Currently Playing
                  </p>
                  <Info className="size-[14px] text-[#a3a3a3]" strokeWidth={1.8} />
                </div>
                <p className="pt-1 text-2xl font-medium leading-8 text-[#171717]">
                  {playingScreens.length} <span className="text-base">screens</span>
                </p>
              </div>
            </div>
            <div className="w-full border-b border-t border-hair px-0 py-[11px]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]"
                  strokeWidth={1.6}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search content..."
                  className="h-5 rounded-none border-0 bg-transparent pl-[30px] text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="max-h-[188px] w-full space-y-0 overflow-y-auto">
              {filteredPlaying.length === 0 ? (
                <p className="py-3 text-sm text-[#a3a3a3]">Nothing matches "{query}".</p>
              ) : (
                filteredPlaying.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3.5 border-b border-hair px-0 py-2"
                  >
                    <img
                      src={nowPlaying}
                      alt=""
                      className="size-10 shrink-0 rounded-md border border-hair object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-[-0.084px] text-[#171717]">
                        {s.playing}
                      </p>
                      <p className="truncate pt-1 text-sm tracking-[-0.084px] text-[#5c5c5c]">
                        {brands.find((b) => b.id === s.brandId)?.name ?? s.brandId} • {s.code}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <FooterButton to="/media">View content</FooterButton>
        </Card>
      </div>

      <div className="grid gap-[22px] lg:grid-cols-3">
        {/* Content Overview */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <CardHeader title="Content Overview" value={assets.length} valueSuffix="assets" />
            <div className="w-full pt-2">
              <TableHead left="Media Library" right="Screens" />
              <StatRow icon={ImageIcon} label="Images" value={images} />
              <StatRow icon={Video} label="Videos" value={videos} />
              <StatRow icon={Layers} label="Templates" value={scopedPlaylists.length} />
              <div className="my-1 h-px w-full bg-hair" />
              <StatRow icon={ListVideo} label="Active Playlists" value={activePlaylists} />
              <StatRow icon={Archive} label="Pending Review" value={pendingMedia} />
              <StatRow icon={AlertCircle} label="Rejected" value={rejectedMedia} />
            </div>
          </div>
          <FooterButton to="/media">View content</FooterButton>
        </Card>

        {/* Locations */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <CardHeader title="Locations" value={locationCounts.size} />
            <div className="w-full pt-2">
              <TableHead left="Brands" right="Stores" />
              {topLocations.length === 0 ? (
                <p className="py-3 text-sm text-[#a3a3a3]">
                  No screens for {activeBrand.name} yet.
                </p>
              ) : (
                topLocations.map(([label, count]) => (
                  <StatRow key={label} label={label} value={count} />
                ))
              )}
              <div className="my-1 h-px w-full bg-hair" />
              <StatRow icon={MapIcon} label="Operating Regions" value={regions} />
              <StatRow icon={MapPin} label="Cities Covered" value={cities} />
            </div>
          </div>
          <FooterButton to="/screens">View locations</FooterButton>
        </Card>

        {/* Unresolved Issues */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <CardHeader title="Unresolved Issuess" value={offline + failed} />
            <div className="w-full pt-2">
              <TableHead left="Category" right="Screens" />
              <StatRow icon={WifiOff} label="Offline issues" value={offline} />
              <StatRow icon={WifiOff} label="Sync Failed" value={failed} />
              <StatRow icon={RefreshCw} label="Still Syncing" value={syncing} />
            </div>
          </div>
          <FooterButton to="/screens">View issues</FooterButton>
        </Card>
      </div>

      <div className="grid gap-[22px] lg:grid-cols-2">
        {/* Needs Action */}
        <Card>
          <div className="flex w-full flex-col items-start gap-3">
            <div className="flex w-full flex-col items-start gap-2 border-b border-[#ececec] pb-4">
              <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">Needs Action</p>
              <p className="pt-1 text-sm tracking-[-0.084px] text-[#5c5c5c]">
                {awaitingPublish + offline + failed} items waiting
              </p>
            </div>
            <div className="flex w-full flex-col gap-6 py-5">
              <ActionRow label="Content Awaiting Publish" value={awaitingPublish} />
              <ActionRow label="Screens Need Pairing" value={offline} />
              <ActionRow label="Sync Failures" value={failed} />
            </div>
          </div>
          <FooterButton to="/approvals">View action</FooterButton>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex w-full flex-col items-start gap-3">
            <div className="flex w-full items-start justify-between border-b border-[#ececec] pb-4">
              <div className="flex flex-col items-start">
                <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
                  Recent Activity
                </p>
                <p className="pt-1 text-sm tracking-[-0.084px] text-[#5c5c5c]">
                  {trail.length} new activit{trail.length === 1 ? "y" : "ies"} today
                </p>
              </div>
              <button
                type="button"
                className="flex h-7 items-center gap-1.5 rounded-lg border border-hair px-2.5 text-sm font-medium text-[#5c5c5c]"
              >
                Today <ChevronDown className="size-4" strokeWidth={1.6} />
              </button>
            </div>
            <div className="w-full py-5">
              {trail.length === 0 ? (
                <p className="py-3 text-sm text-[#a3a3a3]">
                  No activity recorded for {activeBrand.name} yet.
                </p>
              ) : (
                trail.map((e, i) => {
                  const Icon = categoryIcon[e.category];
                  return (
                    <div key={e.id} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                          <Icon className="size-4" strokeWidth={1.7} />
                        </span>
                        {i < trail.length - 1 && <span className="my-1 w-px flex-1 bg-hair" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-6">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium tracking-[-0.084px] text-[#171717]">
                            {e.action}
                          </p>
                          <span className="shrink-0 text-[10px] text-[#5c5c5c]">
                            {formatClock(e.at)}
                          </span>
                        </div>
                        <p className="truncate pt-1 text-sm tracking-[-0.084px] text-[#5c5c5c]">
                          {e.target}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <FooterButton to="/audit">View audit log</FooterButton>
        </Card>
      </div>
    </ConsoleShell>
  );
}
