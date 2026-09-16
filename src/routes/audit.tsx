import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Filter,
  Search,
  ScrollText,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { SettingsLayout } from "@/components/console/SettingsSubNav";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  brands,
  type AuditCategory,
  type AuditEvent,
  type AuditSeverity,
} from "@/lib/signage-data";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log · Sundry Signal" },
      {
        name: "description",
        content:
          "A tamper-evident record of every action across brands: publishing, approvals, screen health, queue changes, and user access.",
      },
      { property: "og:title", content: "Audit Log · Sundry Signal" },
      {
        property: "og:description",
        content:
          "A tamper-evident record of every action across brands: publishing, approvals, screen health, queue changes, and user access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});

const categories: (AuditCategory | "All")[] = [
  "All",
  "Publishing",
  "Approval",
  "Content",
  "Screens",
  "Queue",
  "Users",
  "Security",
  "System",
];

const severityTone: Record<AuditSeverity, string> = {
  info: "bg-frost/6 ring-frost/12 text-mut",
  notice: "bg-warn/10 ring-warn/25 text-warn",
  critical: "bg-danger/10 ring-danger/25 text-danger",
};

const severityLabel: Record<AuditSeverity, string> = {
  info: "Info",
  notice: "Notice",
  critical: "Critical",
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function brandLabel(brandId: string | null) {
  if (!brandId) return "Organization";
  return brands.find((b) => b.id === brandId)?.name ?? "Organization";
}

function AuditPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { audit: auditEvents } = useConsoleStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AuditCategory | "All">("All");
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditEvents
      .filter((e) => (e.brandId === null ? isAllBrands : inScope(e.brandId)))
      .filter((e) => category === "All" || e.category === category)
      .filter((e) => severity === "all" || e.severity === severity)
      .filter((e) =>
        q.length === 0
          ? true
          : [e.actor, e.action, e.target, e.detail, e.category, brandLabel(e.brandId)]
              .join(" ")
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [auditEvents, query, category, severity, isAllBrands, inScope]);

  const selected: AuditEvent | undefined = rows.find((e) => e.id === selectedId) ?? rows[0];

  const critical = rows.filter((e) => e.severity === "critical").length;
  const userEvents = rows.filter((e) => e.category === "Users" || e.category === "Security").length;
  const actors = new Set(rows.map((e) => e.actor)).size;

  const grouped = useMemo(() => {
    const map = new Map<string, AuditEvent[]>();
    for (const e of rows) {
      const day = fmtDay(e.at);
      const list = map.get(day) ?? [];
      list.push(e);
      map.set(day, list);
    }
    return [...map.entries()];
  }, [rows]);

  const kpis = [
    {
      label: "Events in view",
      value: String(rows.length),
      icon: ScrollText,
      note: isAllBrands ? "all brands + organization" : activeBrand.name,
    },
    { label: "Critical", value: String(critical), icon: AlertTriangle, note: "needs review" },
    {
      label: "Access & security",
      value: String(userEvents),
      icon: ShieldAlert,
      note: "roles, sign-ins, alerts",
    },
    {
      label: "Distinct actors",
      value: String(actors),
      icon: UserCog,
      note: "people, POS and system",
    },
  ];

  return (
    <ConsoleShell
      title={isAllBrands ? "Audit Log · All Brands" : `Audit Log · ${activeBrand.name}`}
      subtitle="Every consequential action, who did it, where it landed, and when"
    >
      <SettingsLayout>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="anim-fadeup panel-frost p-4"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium uppercase text-mut">{k.label}</div>
                  <Icon className="size-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="mt-2 text-[24px] font-semibold leading-none">{k.value}</div>
                <div className="mt-1.5 font-mono text-[10px] text-mut">{k.note}</div>
              </div>
            );
          })}
        </div>

        <div className="anim-fadeup panel-frost p-3" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mut"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actor, action, screen, ticket…"
                aria-label="Search audit log"
                className="h-9 pl-8 text-[11px]"
              />
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AuditSeverity | "all")}
              aria-label="Filter by severity"
              className="h-9 cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[11px] focus:border-accent focus:outline-none"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical only</option>
              <option value="notice">Notice</option>
              <option value="info">Info</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-[10px] shadow-none"
              onClick={() => {
                const header = [
                  "Timestamp",
                  "Actor",
                  "Role",
                  "Scope",
                  "Category",
                  "Action",
                  "Target",
                  "Severity",
                  "Detail",
                ];
                const csv = [
                  header.join(","),
                  ...rows.map((e) =>
                    [
                      e.at,
                      e.actor,
                      e.actorRole,
                      brandLabel(e.brandId),
                      e.category,
                      e.action,
                      e.target,
                      e.severity,
                      e.detail,
                    ]
                      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                      .join(","),
                  ),
                ].join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `sundry-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Audit log exported", {
                  description: `${rows.length} events written to CSV.`,
                });
              }}
            >
              <Download /> Export CSV
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Filter className="size-3.5 text-mut" strokeWidth={1.5} aria-hidden="true" />
            {categories.map((c) => (
              <Button
                key={c}
                variant="outline"
                size="sm"
                onClick={() => setCategory(c)}
                className={`h-7 px-2.5 text-[10px] shadow-none ${
                  category === c
                    ? "border-accent/35 bg-accent/8 text-accent"
                    : "border-line/15 bg-panel text-mut hover:text-frost"
                }`}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div
            className="anim-fadeup panel-frost lg:col-span-2"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex items-center justify-between border-b border-line/8 px-4 py-3">
              <div className="text-[13px] font-medium">Activity trail</div>
              <span className="font-mono text-[10px] text-mut">newest first · UTC</span>
            </div>

            {rows.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-[13px] font-medium">No matching activity</p>
                <p className="mt-1 font-mono text-[10px] text-mut">
                  Clear the filters or widen the workspace to All Brands.
                </p>
              </div>
            ) : (
              <div className="px-2 py-2">
                {grouped.map(([day, events]) => (
                  <div key={day} className="mb-1">
                    <div className="px-2 py-2 text-[9px] font-medium uppercase text-mut/70">
                      {day}
                    </div>
                    {events.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={`grid w-full grid-cols-12 items-start gap-2 rounded-md px-2 py-2.5 text-left ${
                          selected?.id === e.id
                            ? "bg-accent/8 ring-1 ring-accent/25"
                            : "hover:bg-frost/5"
                        }`}
                      >
                        <div className="col-span-3 font-mono text-[10px] text-mut sm:col-span-2">
                          {fmtTime(e.at)}
                        </div>
                        <div className="col-span-9 min-w-0 sm:col-span-7">
                          <div className="truncate text-[12px] font-medium">
                            {e.action}
                            <span className="text-mut"> · {e.target}</span>
                          </div>
                          <div className="mt-0.5 truncate text-[10px] text-mut">
                            {e.actor} · {e.actorRole} · {brandLabel(e.brandId)}
                          </div>
                        </div>
                        <div className="col-span-12 flex justify-start gap-1.5 sm:col-span-3 sm:justify-end">
                          <span className="rounded bg-panel2 px-2 py-0.5 text-[9px] uppercase text-mut">
                            {e.category}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-medium ring-1 ${severityTone[e.severity]}`}
                          >
                            {severityLabel[e.severity]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="anim-fadeup panel-frost p-4" style={{ animationDelay: "200ms" }}>
            <div className="text-[9px] font-medium uppercase text-mut">Event detail</div>
            {selected ? (
              <>
                <div className="mt-2 text-[14px] font-semibold leading-snug">{selected.action}</div>
                <div className="mt-1 text-[11px] text-mut">{selected.target}</div>
                <span
                  className={`mt-3 inline-block rounded px-2 py-1 text-[10px] font-medium ring-1 ${severityTone[selected.severity]}`}
                >
                  {severityLabel[selected.severity]} · {selected.category}
                </span>
                <p className="mt-3 text-[11px] leading-relaxed text-mut">{selected.detail}</p>

                <dl className="mt-4 space-y-2 text-[11px]">
                  {[
                    ["Actor", `${selected.actor} · ${selected.actorRole}`],
                    ["Scope", brandLabel(selected.brandId)],
                    ["Module", selected.module],
                    ["Source", selected.source],
                    ["When", `${fmtDay(selected.at)} · ${fmtTime(selected.at)} UTC`],
                    ["IP address", selected.ip],
                    ["Record ID", `evt_${selected.id}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <dt className="text-mut">{label}</dt>
                      <dd className="text-right font-mono text-[10px]">{value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-4 rounded-md border border-line/12 bg-panel2/45 p-3 text-[10px] leading-relaxed text-mut">
                  Audit records are append-only: they cannot be edited or deleted from the console,
                  only exported for review and retention.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-mut">Select an event to see the full record.</p>
            )}
          </div>
        </div>
      </SettingsLayout>
    </ConsoleShell>
  );
}
