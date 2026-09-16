import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ListVideo, Megaphone, Monitor, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import {
  Card,
  FooterButton,
  StatRow,
  TableHead,
  healthTone,
} from "@/components/console/DashboardCard";
import { ScreensTable } from "@/components/console/ScreensTable";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";
import { brands, type ScreenType } from "@/lib/signage-data";

export const Route = createFileRoute("/screens")({
  head: () => ({
    meta: [
      { title: "Screens · Sundry Signal" },
      {
        name: "description",
        content:
          "Fleet health, screen-type mix and every registered device across the estate, with per-screen detail and sync actions.",
      },
      { property: "og:title", content: "Screens · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Fleet health, screen-type mix and every registered device across the estate, with per-screen detail and sync actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreensPage,
});

const newPin = () =>
  `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;

const screenTypeIcon: Record<ScreenType, typeof Monitor> = {
  "Menu Board": Monitor,
  Promo: Megaphone,
  "Queue (QMS)": ListVideo,
};

function ScreensPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { screens } = useConsoleStore();
  const [pin, setPin] = useState("418 902");
  const mine = screens.filter((s) => inScope(s.brandId));

  const online = mine.filter((s) => s.status === "online").length;
  const syncing = mine.filter((s) => s.status === "syncing").length;
  const offline = mine.filter((s) => s.status === "offline").length;
  const issues = mine.filter((s) => s.status === "failed").length;
  const total = mine.length;
  const downFraction = total ? (offline + issues) / total : 0;
  const health = healthTone(downFraction);

  const screenTypes: ScreenType[] = ["Menu Board", "Promo", "Queue (QMS)"];
  const typeCounts = screenTypes.map((t) => ({
    type: t,
    count: mine.filter((s) => s.type === t).length,
  }));
  const typesInUse = typeCounts.filter((t) => t.count > 0).length;

  /** A "location" is one store — a brand paired with its store code (or city, if unset). */
  const locationCounts = new Map<string, number>();
  for (const s of mine) {
    const brand = brands.find((b) => b.id === s.brandId)?.name ?? s.brandId;
    const store = s.storeCode ? s.storeCode.split("/")[0] : s.city;
    const key = `${brand} - ${store}`;
    locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1);
  }
  const locationRows = [...locationCounts.entries()].sort((a, b) => b[1] - a[1]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const visibleLocations = showAllLocations ? locationRows : locationRows.slice(0, 3);

  const onlinePct = total ? Math.round((online / total) * 100) : 0;
  const offlinePct = total ? Math.round((offline / total) * 100) : 0;
  const syncingPct = total ? (syncing / total) * 100 : 0;
  const downPct = total ? ((offline + issues) / total) * 100 : 0;

  return (
    <ConsoleShell
      title={isAllBrands ? "Screens · All Brands" : "Screens"}
      subtitle={`${total} registered · ${new Set(mine.map((s) => s.city)).size} cities · pairing window open`}
    >
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
              <StatRow icon={Wifi} label="Online" value={`${online} (${onlinePct}%)`} />
              <StatRow icon={WifiOff} label="Offline" value={`${offline} (${offlinePct}%)`} />
              <StatRow icon={RefreshCw} label="Syncing" value={syncing} />
              <StatRow icon={AlertCircle} label="Issues" value={issues} />
            </div>
          </div>
          <FooterButton to="/reports">View report</FooterButton>
        </Card>

        {/* Screen Types */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start gap-2 border-b border-[#ececec] pb-4">
              <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">Screen Types</p>
              <div className="flex items-center gap-2 pt-1">
                <p className="text-2xl font-medium leading-8 text-[#171717]">
                  {screenTypes.length}
                </p>
                <span className="text-sm font-medium tracking-[-0.084px] text-[#1fc16b]">
                  Across {typesInUse} screen types
                </span>
              </div>
            </div>
            <div className="w-full pt-2">
              <TableHead left="Type" right="Screens" />
              {typeCounts.map(({ type, count }) => (
                <StatRow key={type} icon={screenTypeIcon[type]} label={type} value={count} />
              ))}
            </div>
          </div>
          <FooterButton to="/reports">View report</FooterButton>
        </Card>

        {/* Locations */}
        <Card>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start gap-2 border-b border-[#ececec] pb-4">
              <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">Locations</p>
              <p className="pt-1 text-2xl font-medium leading-8 text-[#171717]">
                {locationRows.length}
              </p>
            </div>
            <div className="w-full pt-2">
              <TableHead left="Location" right="Screens" />
              {visibleLocations.length === 0 ? (
                <p className="py-3 text-sm text-[#a3a3a3]">
                  No screens for {activeBrand.name} yet.
                </p>
              ) : (
                visibleLocations.map(([label, count]) => (
                  <StatRow key={label} label={label} value={count} />
                ))
              )}
            </div>
          </div>
          <FooterButton onClick={() => setShowAllLocations((v) => !v)}>
            {showAllLocations ? "Show fewer locations" : "View locations"}
          </FooterButton>
        </Card>
      </div>

      <div className="panel-frost flex flex-wrap items-center gap-4 p-4">
        <div>
          <div className="text-[10px] font-medium uppercase text-mut">Pair a new device</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-accent">{pin}</div>
        </div>
        <p className="max-w-md text-[11px] leading-relaxed text-mut">
          Enter this 6-digit PIN on the player after it boots. It expires in 10 minutes and binds
          the device to {activeBrand.name} only. Screen IDs are built for you as{" "}
          <span className="font-mono text-ink-soft">BRAND-LOC-STORE#-ZONE-TYPE-##</span>.
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-[12px]"
            onClick={() => {
              const next = newPin();
              setPin(next);
              toast.success("New pairing PIN", { description: `${next} · valid for 10 minutes.` });
            }}
          >
            <RefreshCw /> Generate new PIN
          </Button>
        </div>
      </div>

      <ScreensTable />
    </ConsoleShell>
  );
}
