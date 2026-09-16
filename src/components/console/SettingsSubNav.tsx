import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, ChevronRight, ScrollText, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type SettingsMenuItem = { to: string; label: string; icon: LucideIcon };

/** Every Settings sub-page, in the order the Select menu shows them. */
export const settingsMenuItems: SettingsMenuItem[] = [
  { to: "/company", label: "Company Settings", icon: Building2 },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
  { to: "/users", label: "Users & Roles", icon: Users },
];

/**
 * The "Select menu" left sidebar shared by every Settings sub-page (Company Settings,
 * Audit Log, Users & Roles) — pairs with the ConsoleShell top tab strip the same way
 * the reference settings layout nests a fine-grained menu under a broad section tab.
 */
export function SettingsSubNav({ items = settingsMenuItems }: { items?: SettingsMenuItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="w-full shrink-0 rounded-2xl border border-hair bg-white p-3 lg:w-[240px]">
      <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-mut">
        Select menu
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition ${
                active ? "bg-[#f5f5f4] text-ink-strong" : "text-ink-soft hover:bg-[#fafafa]"
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active && (
                <ChevronRight className="size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Two-column shell: the Select menu on the left, page content on the right. */
export function SettingsLayout({
  items = settingsMenuItems,
  children,
}: {
  items?: SettingsMenuItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <SettingsSubNav items={items} />
      <div className="min-w-0 flex-1 space-y-5">{children}</div>
    </div>
  );
}
