import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mediaAssets as seedMedia } from "./media-assets";
import {
  announcements as seedAnnouncements,
  auditEvents as seedAudit,
  consoleUsers as seedUsers,
  playlists as seedPlaylists,
  roleDefs as seedRoles,
  schedules as seedSchedules,
  screens as seedScreens,
  type Announcement,
  type ApprovalKind,
  type AuditCategory,
  type AuditEvent,
  type AuditSeverity,
  type ConsoleUser,
  type MediaAsset,
  type ModuleKey,
  type Playlist,
  type RoleDef,
  type RoleKey,
  type Schedule,
  type Screen,
} from "@/lib/signage-data";

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq += 1)}`;

export type NewAuditEvent = {
  actor?: string;
  actorRole?: string;
  brandId: string | null;
  module: ModuleKey;
  category: AuditCategory;
  action: string;
  target: string;
  detail: string;
  severity?: AuditSeverity;
};

/** One item waiting on (or already through) a line manager's review. */
export type ApprovalItem = {
  kind: ApprovalKind;
  id: string;
  title: string;
  brandId: string;
  approval: "Draft" | "Pending" | "Approved" | "Rejected";
  summary: string;
  submittedBy: string;
  reviewer?: string;
  reviewNote?: string;
  reviewedAt?: string;
};

export const approvalKindLabel: Record<ApprovalKind, string> = {
  media: "Creative",
  playlist: "Playlist",
  schedule: "Campaign",
  announcement: "Announcement",
};

type ConsoleStore = {
  media: MediaAsset[];
  playlists: Playlist[];
  schedules: Schedule[];
  announcements: Announcement[];
  screens: Screen[];
  users: ConsoleUser[];
  roles: RoleDef[];
  audit: AuditEvent[];
  /** Every reviewable item across the app, newest submissions first. */
  approvalItems: ApprovalItem[];
  pendingApprovals: number;
  logAudit: (event: NewAuditEvent) => void;
  /** Staff action: send a draft or rejected item back to the line manager. */
  submitForReview: (kind: ApprovalKind, id: string) => void;
  /** Line manager action: sign off or send back with a reason. */
  reviewItem: (
    kind: ApprovalKind,
    id: string,
    decision: "Approved" | "Rejected",
    note: string,
  ) => void;
  addMedia: (input: {
    name: string;
    brandId: string;
    kind: MediaAsset["kind"];
    duration: string;
    image: string;
  }) => MediaAsset;
  addPlaylist: (input: {
    name: string;
    brandId: string;
    items: { label: string; duration: string }[];
  }) => Playlist;
  addSchedule: (input: Omit<Schedule, "id" | "approval">) => Schedule;
  addAnnouncement: (input: Omit<Announcement, "id" | "approval">) => Announcement;
  addScreen: (input: Omit<Screen, "id" | "lastSync" | "status" | "firmware" | "playing">) => Screen;
  addUser: (input: {
    name: string;
    email: string;
    role: RoleKey;
    brandIds: string[];
  }) => ConsoleUser;
  updateUser: (id: string, patch: Partial<ConsoleUser>) => void;
  updateRole: (key: RoleKey, patch: Partial<RoleDef>) => void;
  addPlaylistItem: (playlistId: string, item: { label: string; duration: string }) => void;
};

const noop = () => {};

const fallback: ConsoleStore = {
  media: seedMedia,
  playlists: seedPlaylists,
  schedules: seedSchedules,
  announcements: seedAnnouncements,
  screens: seedScreens,
  users: seedUsers,
  roles: seedRoles,
  audit: seedAudit,
  approvalItems: [],
  pendingApprovals: 0,
  logAudit: noop,
  submitForReview: noop,
  reviewItem: noop,
  addMedia: (i) => ({ id: "tmp", approval: "Pending", ...i }),
  addPlaylist: (i) => ({ id: "tmp", total: "00:00", approval: "Pending", ...i }),
  addSchedule: (i) => ({ id: "tmp", approval: "Pending", ...i }),
  addAnnouncement: (i) => ({ id: "tmp", approval: "Pending", ...i }),
  addScreen: (i) => ({
    id: "tmp",
    lastSync: "—",
    status: "syncing",
    firmware: "v3.4.1",
    playing: "—",
    ...i,
  }),
  addUser: (i) => ({
    id: "tmp",
    initials: "?",
    moduleKeys: [],
    status: "Invited",
    lastActive: "—",
    ...i,
  }),
  updateUser: noop,
  updateRole: noop,
  addPlaylistItem: noop,
};

const ConsoleStoreContext = createContext<ConsoleStore>(fallback);

/** Signed-in operator for this prototype session — used as the audit actor. */
export const currentOperator = { name: "Ada Obi", role: "Super Admin" };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function secondsOf(duration: string) {
  const [m = "0", s = "0"] = duration.split(":");
  return Number(m) * 60 + Number(s);
}

function formatTotal(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ConsoleStoreProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<MediaAsset[]>(seedMedia);
  const [playlists, setPlaylists] = useState<Playlist[]>(seedPlaylists);
  const [schedules, setSchedules] = useState<Schedule[]>(seedSchedules);
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements);
  const [screens, setScreens] = useState<Screen[]>(seedScreens);
  const [users, setUsers] = useState<ConsoleUser[]>(seedUsers);
  const [roles, setRoles] = useState<RoleDef[]>(seedRoles);
  const [audit, setAudit] = useState<AuditEvent[]>(seedAudit);

  const logAudit = useCallback((event: NewAuditEvent) => {
    setAudit((prev) => [
      {
        id: nextId("evt"),
        at: new Date().toISOString(),
        actor: event.actor ?? currentOperator.name,
        actorRole: event.actorRole ?? currentOperator.role,
        brandId: event.brandId,
        module: event.module,
        category: event.category,
        action: event.action,
        target: event.target,
        detail: event.detail,
        severity: event.severity ?? "notice",
        source: "Console",
        ip: "197.210.53.8",
      },
      ...prev,
    ]);
  }, []);

  /** Flattened review queue: creatives, playlists, campaigns and announcements. */
  const approvalItems = useMemo<ApprovalItem[]>(() => {
    const items: ApprovalItem[] = [
      ...media.map((m) => ({
        kind: "media" as const,
        id: m.id,
        title: m.name,
        brandId: m.brandId,
        approval: m.approval,
        summary: `${m.kind} · ${m.duration} on screen`,
        submittedBy: m.submittedBy ?? "Content team",
        ...(m.reviewer ? { reviewer: m.reviewer } : {}),
        ...(m.reviewNote ? { reviewNote: m.reviewNote } : {}),
        ...(m.reviewedAt ? { reviewedAt: m.reviewedAt } : {}),
      })),
      ...playlists.map((p) => ({
        kind: "playlist" as const,
        id: p.id,
        title: p.name,
        brandId: p.brandId,
        approval: p.approval,
        summary: `${p.items.length} item${p.items.length === 1 ? "" : "s"} · ${p.total} rotation`,
        submittedBy: p.submittedBy ?? "Content team",
        ...(p.reviewer ? { reviewer: p.reviewer } : {}),
        ...(p.reviewNote ? { reviewNote: p.reviewNote } : {}),
        ...(p.reviewedAt ? { reviewedAt: p.reviewedAt } : {}),
      })),
      ...schedules.map((s) => ({
        kind: "schedule" as const,
        id: s.id,
        title: s.name,
        brandId: s.brandId,
        approval: s.approval,
        summary: `${s.window} · ${s.regions} · ${s.affected} screens`,
        submittedBy: s.submittedBy ?? "Content team",
        ...(s.reviewer ? { reviewer: s.reviewer } : {}),
        ...(s.reviewNote ? { reviewNote: s.reviewNote } : {}),
        ...(s.reviewedAt ? { reviewedAt: s.reviewedAt } : {}),
      })),
      ...announcements.map((a) => ({
        kind: "announcement" as const,
        id: a.id,
        title: a.text,
        brandId: a.brandId,
        approval: a.approval,
        summary: `${a.position} · expires ${a.expires}`,
        submittedBy: a.submittedBy ?? "Content team",
        ...(a.reviewer ? { reviewer: a.reviewer } : {}),
        ...(a.reviewNote ? { reviewNote: a.reviewNote } : {}),
        ...(a.reviewedAt ? { reviewedAt: a.reviewedAt } : {}),
      })),
    ];
    const rank = { Pending: 0, Rejected: 1, Draft: 2, Approved: 3 };
    return items.sort((a, b) => rank[a.approval] - rank[b.approval]);
  }, [media, playlists, schedules, announcements]);

  const patchReviewable = useCallback(
    (kind: ApprovalKind, id: string, patch: Partial<Record<string, unknown>>) => {
      const apply = <T extends { id: string }>(rows: T[]) =>
        rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
      if (kind === "media") setMedia((prev) => apply(prev) as MediaAsset[]);
      if (kind === "playlist") setPlaylists((prev) => apply(prev) as Playlist[]);
      if (kind === "schedule") setSchedules((prev) => apply(prev) as Schedule[]);
      if (kind === "announcement") setAnnouncements((prev) => apply(prev) as Announcement[]);
    },
    [],
  );

  const findItem = useCallback(
    (kind: ApprovalKind, id: string) => approvalItems.find((i) => i.kind === kind && i.id === id),
    [approvalItems],
  );

  const submitForReview = useCallback(
    (kind: ApprovalKind, id: string) => {
      const item = findItem(kind, id);
      patchReviewable(kind, id, {
        approval: "Pending",
        submittedBy: currentOperator.name,
        reviewer: undefined,
        reviewNote: undefined,
        reviewedAt: undefined,
      });
      logAudit({
        brandId: item?.brandId ?? null,
        module:
          kind === "media"
            ? "media"
            : kind === "playlist"
              ? "playlists"
              : kind === "schedule"
                ? "schedules"
                : "announcements",
        category: "Approval",
        action: "Submitted for approval",
        target: `${approvalKindLabel[kind]} · ${item?.title ?? id}`,
        detail:
          "Sent to the line manager for review. It cannot be scheduled or go live until approved.",
      });
    },
    [findItem, logAudit, patchReviewable],
  );

  const reviewItem = useCallback(
    (kind: ApprovalKind, id: string, decision: "Approved" | "Rejected", note: string) => {
      const item = findItem(kind, id);
      patchReviewable(kind, id, {
        approval: decision,
        reviewer: currentOperator.name,
        reviewNote: note.trim() || undefined,
        reviewedAt: new Date().toISOString(),
      });
      logAudit({
        brandId: item?.brandId ?? null,
        module:
          kind === "media"
            ? "media"
            : kind === "playlist"
              ? "playlists"
              : kind === "schedule"
                ? "schedules"
                : "announcements",
        category: "Approval",
        action:
          decision === "Approved"
            ? `${approvalKindLabel[kind]} approved`
            : `${approvalKindLabel[kind]} rejected`,
        target: item?.title ?? id,
        detail:
          (decision === "Approved"
            ? "Signed off by the line manager and cleared to be scheduled or published."
            : "Sent back to the submitter for changes.") +
          (note.trim() ? ` Note: ${note.trim()}` : ""),
        severity: decision === "Approved" ? "notice" : "critical",
      });
    },
    [findItem, logAudit, patchReviewable],
  );

  const value = useMemo<ConsoleStore>(
    () => ({
      media,
      playlists,
      schedules,
      announcements,
      screens,
      users,
      roles,
      audit,
      logAudit,
      approvalItems,
      pendingApprovals: approvalItems.filter((i) => i.approval === "Pending").length,
      submitForReview,
      reviewItem,
      addMedia: (input) => {
        const asset: MediaAsset = {
          id: nextId("m"),
          approval: "Pending",
          submittedBy: currentOperator.name,
          ...input,
        };
        setMedia((prev) => [asset, ...prev]);
        logAudit({
          brandId: input.brandId,
          module: "media",
          category: "Approval",
          action: "Submitted for approval",
          target: input.name,
          detail: `${input.kind}, ${input.duration} duration. Awaiting line manager sign-off.`,
          severity: "info",
        });
        return asset;
      },
      addPlaylist: (input) => {
        const total = formatTotal(input.items.reduce((sum, i) => sum + secondsOf(i.duration), 0));
        const playlist: Playlist = {
          id: nextId("p"),
          total,
          approval: "Pending",
          submittedBy: currentOperator.name,
          ...input,
        };
        setPlaylists((prev) => [playlist, ...prev]);
        logAudit({
          brandId: input.brandId,
          module: "playlists",
          category: "Approval",
          action: "Submitted for approval",
          target: input.name,
          detail: `${input.items.length} item${input.items.length === 1 ? "" : "s"} · ${total} rotation. Awaiting line manager sign-off.`,
          severity: "info",
        });
        return playlist;
      },
      addSchedule: (input) => {
        // Nothing goes live without a line manager: new campaigns queue for review.
        const schedule: Schedule = {
          id: nextId("sc"),
          ...input,
          state: input.state === "Live" ? "Scheduled" : input.state,
          approval: "Pending",
          submittedBy: currentOperator.name,
        };
        setSchedules((prev) => [schedule, ...prev]);
        logAudit({
          brandId: input.brandId,
          module: "schedules",
          category: "Approval",
          action: "Submitted for approval",
          target: `${input.name} → ${input.affected} screens`,
          detail: `${input.window} · ${input.regions} · ${input.types}. Cannot publish until approved.`,
        });
        return schedule;
      },
      addAnnouncement: (input) => {
        const announcement: Announcement = {
          id: nextId("an"),
          ...input,
          state: input.state === "Live" ? "Scheduled" : input.state,
          approval: "Pending",
          submittedBy: currentOperator.name,
        };
        setAnnouncements((prev) => [announcement, ...prev]);
        logAudit({
          brandId: input.brandId,
          module: "announcements",
          category: "Approval",
          action: "Submitted for approval",
          target: input.text.slice(0, 60),
          detail: `${input.position} · expires ${input.expires}. Cannot broadcast until approved.`,
        });
        return announcement;
      },

      addScreen: (input) => {
        const screen: Screen = {
          id: nextId("s"),
          lastSync: "pairing…",
          status: "syncing",
          firmware: "v3.4.1",
          playing: "Awaiting first playlist",
          ...input,
        };
        setScreens((prev) => [screen, ...prev]);
        logAudit({
          brandId: input.brandId,
          module: "screens",
          category: "Screens",
          action: "Device paired",
          target: `${input.code} · ${input.location}`,
          detail: `${input.type} registered in ${input.city} (${input.region}). Awaiting first sync.`,
        });
        return screen;
      },
      addUser: (input) => {
        const role = roles.find((r) => r.key === input.role)!;
        const user: ConsoleUser = {
          id: nextId("u"),
          name: input.name,
          email: input.email,
          initials: initials(input.name),
          role: input.role,
          brandIds: role.allBrands ? [] : input.brandIds,
          moduleKeys: role.modules,
          status: "Invited",
          lastActive: "—",
        };
        setUsers((prev) => [user, ...prev]);
        logAudit({
          brandId: role.allBrands ? null : (input.brandIds[0] ?? null),
          module: "users",
          category: "Users",
          action: "User invited",
          target: `${input.name} → ${role.name}`,
          detail: role.allBrands
            ? "Organization-level access to every brand and module."
            : `Access limited to ${input.brandIds.length} brand${input.brandIds.length === 1 ? "" : "s"} and ${role.modules.length} modules.`,
          severity: "critical",
        });
        return user;
      },
      updateUser: (id, patch) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u))),
      updateRole: (key, patch) =>
        setRoles((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r))),
      addPlaylistItem: (playlistId, item) =>
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  items: [...p.items, item],
                  total: formatTotal(
                    [...p.items, item].reduce((sum, i) => sum + secondsOf(i.duration), 0),
                  ),
                }
              : p,
          ),
        ),
    }),
    [
      media,
      playlists,
      schedules,
      announcements,
      screens,
      users,
      roles,
      audit,
      logAudit,
      approvalItems,
      submitForReview,
      reviewItem,
    ],
  );

  return <ConsoleStoreContext.Provider value={value}>{children}</ConsoleStoreContext.Provider>;
}

export function useConsoleStore() {
  return useContext(ConsoleStoreContext);
}
