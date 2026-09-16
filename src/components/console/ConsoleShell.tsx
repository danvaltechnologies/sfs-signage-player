import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Image as ImageIcon,
  LayoutGrid,
  ListFilter,
  LogOut,
  Megaphone,
  Monitor,
  Plus,
  Search,
  Settings as SettingsIcon,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import sundryFoodsLogo from "@/assets/sundryfood.png";
import kilimanjaroLogo from "@/assets/killimanjaro.jpg";
import killiGrillLogo from "@/assets/kiligrill.png";
import pizzaJungleLogo from "@/assets/pizzajungle.png";
import nibblesCreamyLogo from "@/assets/nibblescreamy.png";
import nibblesBakeryLogo from "@/assets/nibblesbakery.png";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { brands, screens } from "@/lib/signage-data";
import { ALL_BRANDS_ID, allBrandsWorkspace, useBrand } from "./brand-context";
import { useConsoleStore } from "./console-store";
import { CreateDialog, type CreateKind } from "./create-dialogs";

type Tab = { to: string; label: string; hidden?: boolean };

type NavItem = {
  /** Landing route for the section — also the first tab when tabs are present. */
  to: string;
  label: string;
  icon: LucideIcon;
  tabs?: Tab[];
};

/**
 * Flat, Figma-matching navigation. Sections that own several screens expose them
 * as a tab strip under the header rather than as extra sidebar rows.
 */
const nav: NavItem[] = [
  {
    to: "/overview",
    label: "Overview",
    icon: LayoutGrid,
    tabs: [
      { to: "/overview", label: "Overview" },
      { to: "/insights", label: "Insights" },
      { to: "/dashboard", label: "Fleet Dashboard" },
    ],
  },
  { to: "/screens", label: "Screens", icon: Monitor },
  {
    to: "/media",
    label: "Content",
    icon: ImageIcon,
    tabs: [
      { to: "/media", label: "Media Library" },
      { to: "/templates", label: "Templates" },
      { to: "/menus", label: "Menus" },
      { to: "/playlists", label: "Playlists" },
      { to: "/approvals", label: "Approvals" },
    ],
  },
  {
    to: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    tabs: [
      { to: "/campaigns", label: "Campaigns" },
      { to: "/schedules", label: "Schedules" },
      { to: "/announcements", label: "Announcements" },
    ],
  },
  { to: "/queue", label: "QMS", icon: Ticket },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  {
    to: "/company",
    label: "Settings",
    icon: SettingsIcon,
    tabs: [
      { to: "/company", label: "Company Settings" },
      { to: "/audit", label: "Audit Log" },
      // Nested under Audit Log in the Select menu rather than its own top-level tab.
      { to: "/users", label: "Users & Roles", hidden: true },
    ],
  },
];

/** Primary header action per route, wired to the existing create dialogs. */
const headerActions: Record<string, { kind: CreateKind; label: string }> = {
  "/screens": { kind: "screen", label: "New Screen" },
  "/media": { kind: "media", label: "Upload Content" },
  "/playlists": { kind: "playlist", label: "Create Playlist" },
  "/campaigns": { kind: "schedule", label: "New Campaign" },
  "/schedules": { kind: "schedule", label: "New Schedule" },
  "/announcements": { kind: "announcement", label: "New Announcement" },
  "/users": { kind: "user", label: "Invite User" },
};

/** Real brand marks for the workspace-switcher avatars — keyed by [Brand.id]. */
const brandLogo: Record<string, string> = {
  kilimanjaro: kilimanjaroLogo,
  "killi-grill": killiGrillLogo,
  "pizza-jungle": pizzaJungleLogo,
  "nibbles-creamy": nibblesCreamyLogo,
  "nibbles-bakery": nibblesBakeryLogo,
};

function sectionFor(pathname: string) {
  return (
    nav.find((item) => item.to === pathname || item.tabs?.some((t) => t.to === pathname)) ?? nav[0]!
  );
}

function WorkspaceSwitcher() {
  const { activeBrand, setActiveBrandId } = useBrand();
  const [open, setOpen] = useState(false);
  const workspaces = [allBrandsWorkspace, ...brands];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[88px] w-full items-center gap-3 px-6 text-left transition-colors hover:bg-[#f5f5f4]"
          aria-label="Switch workspace"
        >
          <span
            className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full"
            style={{
              backgroundColor: activeBrand.id === ALL_BRANDS_ID ? "#ffffff" : activeBrand.color,
            }}
          >
            {brandLogo[activeBrand.id] ? (
              <img
                src={brandLogo[activeBrand.id]}
                alt={activeBrand.name}
                className="size-full object-contain p-1.5"
              />
            ) : (
              <img
                src={sundryFoodsLogo}
                alt="Sundry Foods"
                className="size-full object-contain p-1"
              />
            )}
          </span>
          <span className="min-w-0 flex-1 leading-none">
            <span className="block truncate text-[14px] font-medium tracking-[-0.084px] text-ink-strong">
              Sundry Digital Signage
            </span>
            <span className="mt-1 block truncate text-[12px] text-ink-soft">
              {activeBrand.name}
            </span>
          </span>
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-hair bg-white shadow-[0px_1px_1px_rgba(10,13,20,0.03)]">
            <ChevronsUpDown className="size-4 text-ink-soft" strokeWidth={1.6} aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={14}
        className="w-[248px] rounded-2xl border-hair bg-white p-2 shadow-lg"
      >
        {workspaces.map((b) => {
          const selected = b.id === activeBrand.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setActiveBrandId(b.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                selected ? "bg-[#f5f5f4]" : "hover:bg-[#f7f7f7]"
              }`}
            >
              <span
                className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full"
                style={{ backgroundColor: b.id === ALL_BRANDS_ID ? "#ffffff" : b.color }}
              >
                {b.id === ALL_BRANDS_ID ? (
                  <img src={sundryFoodsLogo} alt="" className="size-full object-contain p-1" />
                ) : brandLogo[b.id] ? (
                  <img src={brandLogo[b.id]} alt="" className="size-full object-contain p-1" />
                ) : (
                  <span className="text-[12px] font-semibold text-white">{b.name.charAt(0)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink-strong">
                  {b.name}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
                  {b.id === ALL_BRANDS_ID ? `${brands.length} brands` : `${b.screens} screens`}
                </span>
              </span>
              {selected && (
                <Check
                  className="size-4 shrink-0 text-ink-strong"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function ProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[10px] p-3 text-left transition-colors hover:bg-[#f5f5f4]"
          aria-label="Account menu"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hair text-[12px] font-semibold text-ink-soft">
            AE
          </span>
          <span className="min-w-0 flex-1 leading-none">
            <span className="flex items-center gap-[2px]">
              <span className="truncate text-[14px] font-medium tracking-[-0.084px] text-ink-strong">
                Anthonia Egbuta
              </span>
              <BadgeCheck className="size-4 shrink-0 text-[#1d9bf0]" aria-label="Verified" />
            </span>
            <span className="mt-1 block truncate text-[12px] text-ink-soft">
              anthonia@sundryfood.com
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-ink-soft" strokeWidth={1.6} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-[248px] border-hair bg-white p-2">
        <div className="px-2 pb-2 pt-1 text-[11px] text-ink-soft">Signed in as Super Admin</div>
        <Link
          to="/users"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-soft transition hover:bg-[#f7f7f7]"
        >
          <SettingsIcon className="size-4" strokeWidth={1.6} /> Account & roles
        </Link>
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink-soft transition hover:bg-[#f7f7f7]"
        >
          <LogOut className="size-4" strokeWidth={1.6} /> Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** Header "Filter by" control — scopes the console to one brand or all of them. */
function FilterByButton() {
  const { activeBrand, setActiveBrandId } = useBrand();
  const [open, setOpen] = useState(false);
  const workspaces = [allBrandsWorkspace, ...brands];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[37px] items-center gap-2 rounded-[11px] border border-hair-strong bg-white px-[13px] text-[13px] font-medium tracking-[-0.078px] text-ink-soft shadow-[0px_1px_1px_rgba(10,13,20,0.03)] transition hover:bg-[#fafafa]"
        >
          <ListFilter className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
          Filter by
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[228px] border-hair bg-white p-2">
        <div className="px-2 pb-2 pt-1 text-[11px] font-medium text-ink-soft">Brand</div>
        {workspaces.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              setActiveBrandId(b.id);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
              b.id === activeBrand.id
                ? "bg-accent/10 font-medium text-accent"
                : "text-ink-soft hover:bg-[#f7f7f7]"
            }`}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
            <span className="truncate">{b.name}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };
  const destinations = useMemo(
    () => nav.flatMap((item) => (item.tabs ? item.tabs : [{ to: item.to, label: item.label }])),
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search screens and pages…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Pages">
          {destinations.map((d) => (
            <CommandItem key={d.to} value={d.label} onSelect={() => go(d.to)}>
              {d.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Screens">
          {screens.slice(0, 12).map((s) => (
            <CommandItem
              key={s.id}
              value={`${s.code} ${s.location} ${s.city}`}
              onSelect={() => go("/screens")}
            >
              <span className="font-mono text-[11px]">{s.code}</span>
              <span className="ml-2 text-[11px] text-muted-foreground">
                {s.location} · {s.city}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function ConsoleShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  /** Overrides the route's default primary header button. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { pendingApprovals } = useConsoleStore();
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const section = sectionFor(pathname);
  const defaultAction = headerActions[pathname];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white font-display text-frost antialiased">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 flex-col overflow-y-auto border-r border-hair bg-sidebar-surface md:flex">
          <WorkspaceSwitcher />

          <div className="px-5">
            <div className="h-px w-full bg-hair" />
          </div>

          <nav className="flex flex-col gap-1 px-5 pb-4 pt-5" aria-label="Main navigation">
            {nav.map((item) => {
              const active = section.to === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] tracking-[-0.084px] transition-colors ${
                    active
                      ? "border border-hair-strong bg-white font-medium text-ink-strong"
                      : "border border-transparent text-ink-soft hover:bg-[#f2f2f0]"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute -left-[21px] top-[9px] h-5 w-1 rounded-r-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="size-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.label === "Content" && pendingApprovals > 0 && (
                    <span className="rounded-full bg-[#fff0d7] px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-[#a56000]">
                      {pendingApprovals}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-5">
            <div className="h-px w-full bg-hair" />
          </div>
          <div className="p-3">
            <ProfileButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between gap-4 border-b border-hair bg-white px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={sundryFoodsLogo}
                alt="Sundry Foods"
                className="h-7 w-11 shrink-0 object-contain md:hidden"
              />
              <h1 className="truncate text-[18px] font-medium tracking-[-0.2513px] text-ink-strong">
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="grid size-10 place-items-center rounded-[10px] text-ink-soft transition hover:bg-[#f5f5f4]"
              >
                <Search className="size-5" strokeWidth={1.6} />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid size-10 place-items-center rounded-[10px] text-ink-soft transition hover:bg-[#f5f5f4]"
              >
                <Bell className="size-5" strokeWidth={1.6} />
                {pendingApprovals > 0 && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
                )}
              </button>
              {/* Doubles as the workspace switcher on mobile, where the sidebar is hidden. */}
              <FilterByButton />
              {action ??
                (defaultAction && (
                  <button
                    type="button"
                    onClick={() => setCreateKind(defaultAction.kind)}
                    className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[14px] font-medium text-primary-foreground transition hover:bg-primary/90 sm:flex"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                    {defaultAction.label}
                  </button>
                ))}
            </div>
          </header>

          {section.tabs && (
            <div className="border-b border-hair bg-white px-4 py-[13px] md:px-8">
              <div className="inline-flex gap-1 overflow-x-auto rounded-[10px] bg-[#f7f7f7] p-1">
                {section.tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => {
                    const active =
                      pathname === tab.to || (tab.to === "/audit" && pathname === "/users");
                    return (
                      <Link
                        key={tab.to}
                        to={tab.to}
                        className={`flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-[14px] font-medium transition ${
                          active
                            ? "bg-white text-ink-strong shadow-[0px_1px_3px_0px_rgba(8,13,20,0.08)]"
                            : "text-ink-soft hover:text-ink-strong"
                        }`}
                      >
                        {tab.label}
                        {tab.to === "/approvals" && pendingApprovals > 0 && (
                          <span className="ml-2 rounded-full bg-[#fff0d7] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#a56000]">
                            {pendingApprovals}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}

          {createKind && (
            <CreateDialog
              kind={createKind}
              open
              onOpenChange={(open) => {
                if (!open) setCreateKind(null);
              }}
            />
          )}
          <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

          <div className="border-b border-hair bg-white px-3 py-2 md:hidden">
            <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Main navigation">
              {nav.map((item) => {
                const active = section.to === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                      active ? "bg-accent/10 text-accent" : "text-ink-soft hover:bg-[#f5f5f4]"
                    }`}
                  >
                    <Icon className="size-4" strokeWidth={1.6} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mx-auto max-w-[1500px] space-y-5 px-3 py-4 sm:px-5 md:space-y-6 md:px-8 md:py-6">
            {subtitle && <p className="text-[13px] text-ink-soft">{subtitle}</p>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
