import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Check, Lock, MoreVertical, Shield, Store } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { SettingsLayout } from "@/components/console/SettingsSubNav";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { CreateButton } from "@/components/console/create-dialogs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  brands,
  modules,
  type ConsoleUser,
  type ModuleKey,
  type RoleDef,
  type RoleKey,
} from "@/lib/signage-data";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles · Sundry Signal" },
      {
        name: "description",
        content: "Every person and every role in one place — view, edit or deactivate either.",
      },
      { property: "og:title", content: "Users & Roles · Sundry Signal" },
      {
        property: "og:description",
        content: "Every person and every role in one place — view, edit or deactivate either.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const tierIcon = {
  Organization: Building2,
  Brand: Shield,
  Outlet: Store,
} as const;

const userStatusTone = {
  Active: "bg-success/10 ring-success/25 text-success",
  Invited: "bg-warn/10 ring-warn/25 text-warn",
  Suspended: "bg-danger/10 ring-danger/25 text-danger",
} as const;

const roleStatusTone = {
  Active: "bg-success/10 ring-success/25 text-success",
  Suspended: "bg-danger/10 ring-danger/25 text-danger",
} as const;

type Tab = "users" | "roles";

/** Which record a dialog is currently acting on. */
type Target =
  | { kind: "view" | "edit" | "deactivate"; type: "user"; id: string }
  | { kind: "view" | "edit" | "deactivate"; type: "role"; id: RoleKey };

function UsersPage() {
  const { isAllBrands, inScope } = useBrand();
  const { users: people, roles, updateUser, updateRole, logAudit } = useConsoleStore();
  const [tab, setTab] = useState<Tab>("users");
  const [target, setTarget] = useState<Target | null>(null);

  const roleOf = (key: RoleKey) => roles.find((r) => r.key === key)!;

  const userRows = people.filter((u) => {
    const role = roleOf(u.role);
    return role.allBrands || u.brandIds.some((b) => inScope(b));
  });

  const targetUser =
    target?.type === "user" ? (people.find((u) => u.id === target.id) ?? null) : null;
  const targetRole =
    target?.type === "role" ? (roles.find((r) => r.key === target.id) ?? null) : null;

  const close = () => setTarget(null);

  const deactivateUser = (u: ConsoleUser) => {
    const next = u.status === "Suspended" ? "Active" : "Suspended";
    updateUser(u.id, { status: next });
    logAudit({
      brandId: u.brandIds[0] ?? null,
      module: "users",
      category: "Users",
      action: next === "Suspended" ? "User deactivated" : "User reactivated",
      target: u.name,
      detail: next === "Suspended" ? "Access revoked until reactivated." : "Access restored.",
      severity: "critical",
    });
    toast.success(next === "Suspended" ? "User deactivated" : "User reactivated", {
      description: u.name,
    });
    close();
  };

  const deactivateRole = (r: RoleDef) => {
    const next = r.status === "Suspended" ? "Active" : "Suspended";
    updateRole(r.key, { status: next });
    logAudit({
      brandId: null,
      module: "users",
      category: "Users",
      action: next === "Suspended" ? "Role deactivated" : "Role reactivated",
      target: r.name,
      detail:
        next === "Suspended"
          ? "This role can no longer be assigned to new people."
          : "This role can be assigned again.",
      severity: "critical",
    });
    toast.success(next === "Suspended" ? "Role deactivated" : "Role reactivated", {
      description: r.name,
    });
    close();
  };

  return (
    <ConsoleShell
      title={isAllBrands ? "Users & Roles · All Brands" : "Users & Roles"}
      subtitle={`${userRows.length} people · ${roles.length} roles · organization admins see every brand`}
    >
      <SettingsLayout>
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex gap-1 rounded-xl bg-[#f7f7f7] p-1">
            {(["users", "roles"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  tab === t
                    ? "bg-white text-ink-strong shadow-[0px_1px_3px_0px_rgba(8,13,20,0.08)]"
                    : "text-ink-soft hover:text-ink-strong"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "users" && <CreateButton kind="user" label="Invite to a role" />}
        </div>

        {tab === "users" ? (
          <section className="rounded-2xl border border-hair bg-white shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
            {userRows.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-[13px] font-medium">Nobody assigned to this workspace</p>
                <p className="mt-1 text-[11px] text-mut">
                  Invite someone to give this brand its own owner.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-hair text-[12px] text-mut">
                      <th className="px-4 py-3 font-normal">Person</th>
                      <th className="px-4 py-3 font-normal">Role</th>
                      <th className="px-4 py-3 font-normal">Brand scope</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      <th className="px-4 py-3 font-normal" aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {userRows.map((u) => {
                      const role = roleOf(u.role);
                      return (
                        <tr key={u.id} className="border-b border-hair last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                                {u.initials}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium text-ink-strong">
                                  {u.name}
                                </div>
                                <div className="truncate text-[11px] text-mut">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-mut">{role.name}</td>
                          <td className="px-4 py-3 text-[13px] text-mut">
                            {role.allBrands
                              ? "All brands"
                              : `${u.brandIds.length} brand${u.brandIds.length === 1 ? "" : "s"}`}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-2 py-1 text-[10px] font-medium ring-1 ${userStatusTone[u.status]}`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`Actions for ${u.name}`}
                                  className="grid size-8 place-items-center rounded-lg text-mut transition hover:bg-[#f5f5f4] hover:text-ink-strong"
                                >
                                  <MoreVertical className="size-4" strokeWidth={1.7} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setTarget({ kind: "view", type: "user", id: u.id })
                                  }
                                >
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setTarget({ kind: "edit", type: "user", id: u.id })
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setTarget({ kind: "deactivate", type: "user", id: u.id })
                                  }
                                  className="text-danger focus:text-danger"
                                >
                                  {u.status === "Suspended" ? "Reactivate" : "Deactivate"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border border-hair bg-white shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-hair text-[12px] text-mut">
                    <th className="px-4 py-3 font-normal">Role</th>
                    <th className="px-4 py-3 font-normal">Tier</th>
                    <th className="px-4 py-3 font-normal">Modules</th>
                    <th className="px-4 py-3 font-normal">Brand scope</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal" aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => {
                    const Icon = tierIcon[r.tier];
                    const status = r.status ?? "Active";
                    return (
                      <tr key={r.key} className="border-b border-hair last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.6} />
                            <span className="text-[13px] font-medium text-ink-strong">
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-mut">{r.tier}</td>
                        <td className="px-4 py-3 text-[13px] text-mut">
                          {r.modules.length} modules
                        </td>
                        <td className="px-4 py-3 text-[13px] text-mut">
                          {r.allBrands ? "All brands" : "Assigned brands"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-1 text-[10px] font-medium ring-1 ${roleStatusTone[status]}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${r.name}`}
                                className="grid size-8 place-items-center rounded-lg text-mut transition hover:bg-[#f5f5f4] hover:text-ink-strong"
                              >
                                <MoreVertical className="size-4" strokeWidth={1.7} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setTarget({ kind: "view", type: "role", id: r.key })}
                              >
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTarget({ kind: "edit", type: "role", id: r.key })}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setTarget({ kind: "deactivate", type: "role", id: r.key })
                                }
                                className="text-danger focus:text-danger"
                              >
                                {status === "Suspended" ? "Reactivate" : "Deactivate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* View / Edit — user */}
        <Dialog
          open={target?.kind !== "deactivate" && targetUser !== null}
          onOpenChange={(open) => !open && close()}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
            {targetUser && target && (
              <UserDialogBody
                user={targetUser}
                readOnly={target.kind === "view"}
                roleOf={roleOf}
                onSaved={close}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View / Edit — role */}
        <Dialog
          open={target?.kind !== "deactivate" && targetRole !== null}
          onOpenChange={(open) => !open && close()}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
            {targetRole && target && (
              <RoleDialogBody role={targetRole} readOnly={target.kind === "view"} onSaved={close} />
            )}
          </DialogContent>
        </Dialog>

        {/* Deactivate confirm — user */}
        <AlertDialog
          open={target?.kind === "deactivate" && targetUser !== null}
          onOpenChange={(open) => !open && close()}
        >
          <AlertDialogContent>
            {targetUser && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {targetUser.status === "Suspended" ? "Reactivate" : "Deactivate"}{" "}
                    {targetUser.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {targetUser.status === "Suspended"
                      ? "They'll regain access with their previous role and brand scope."
                      : "They'll immediately lose access to the console. You can reactivate them any time."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deactivateUser(targetUser)}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Deactivate confirm — role */}
        <AlertDialog
          open={target?.kind === "deactivate" && targetRole !== null}
          onOpenChange={(open) => !open && close()}
        >
          <AlertDialogContent>
            {targetRole && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {targetRole.status === "Suspended" ? "Reactivate" : "Deactivate"}{" "}
                    {targetRole.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {targetRole.status === "Suspended"
                      ? "This role can be assigned to people again."
                      : "People already on this role keep their access; it just can't be assigned to anyone new until reactivated."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deactivateRole(targetRole)}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </SettingsLayout>
    </ConsoleShell>
  );
}

function UserDialogBody({
  user,
  readOnly,
  roleOf,
  onSaved,
}: {
  user: ConsoleUser;
  readOnly: boolean;
  roleOf: (key: RoleKey) => RoleDef;
  onSaved: () => void;
}) {
  const { roles, updateUser, logAudit } = useConsoleStore();
  const [role, setRole] = useState(user.role);
  const [brandIds, setBrandIds] = useState(user.brandIds);
  const [moduleKeys, setModuleKeys] = useState(user.moduleKeys);
  const selectedRole = roleOf(role);

  const toggleBrand = (id: string) =>
    setBrandIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  const toggleModule = (key: ModuleKey) =>
    setModuleKeys((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const changeRole = (key: RoleKey) => {
    const next = roleOf(key);
    setRole(key);
    setModuleKeys(next.modules);
    if (!next.allBrands && brandIds.length === 0) setBrandIds([brands[0]!.id]);
  };

  const save = () => {
    updateUser(user.id, { role, brandIds: selectedRole.allBrands ? [] : brandIds, moduleKeys });
    logAudit({
      brandId: selectedRole.allBrands ? null : (brandIds[0] ?? null),
      module: "users",
      category: "Users",
      action: "Permissions updated",
      target: `${user.name} → ${selectedRole.name}`,
      detail: `${moduleKeys.length} modules · ${selectedRole.allBrands ? "all brands" : `${brandIds.length} brand(s)`}.`,
      severity: "critical",
    });
    toast.success("Permissions saved", { description: `${user.name}'s access was updated.` });
    onSaved();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
            {user.initials}
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[15px]">{user.name}</DialogTitle>
            <DialogDescription className="text-[11px]">{user.email}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div>
        <div className="text-[9px] font-medium uppercase text-mut">Role</div>
        {readOnly ? (
          <p className="mt-1.5 text-[12px] font-medium">
            {selectedRole.name} · {selectedRole.tier}
          </p>
        ) : (
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value as RoleKey)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[11px] focus:border-accent focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name} · {r.tier}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-mut">{selectedRole.summary}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-medium uppercase text-mut">Brand access</div>
          {selectedRole.allBrands && (
            <span className="flex items-center gap-1 font-mono text-[9px] text-accent">
              <Lock className="size-3" strokeWidth={1.5} aria-hidden="true" /> all brands
            </span>
          )}
        </div>
        <div className="mt-1.5 space-y-1">
          {brands.map((b) => {
            const on = selectedRole.allBrands || brandIds.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                disabled={readOnly || selectedRole.allBrands}
                onClick={() => toggleBrand(b.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[11px] disabled:cursor-not-allowed ${
                  on
                    ? "border-accent/35 bg-accent/8 text-accent"
                    : "border-line/12 bg-panel2/45 text-mut"
                }`}
              >
                {b.name}
                {on && <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-medium uppercase text-mut">Module access</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {modules.map((m) => {
            const on = moduleKeys.includes(m.key);
            return (
              <button
                key={m.key}
                type="button"
                disabled={readOnly}
                onClick={() => toggleModule(m.key)}
                className={`rounded px-2 py-1 text-[10px] font-medium ring-1 disabled:cursor-not-allowed ${
                  on
                    ? "bg-accent/8 ring-accent/30 text-accent"
                    : "bg-frost/6 ring-frost/12 text-mut"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <Button className="w-full text-[12px] font-semibold" onClick={save}>
          <Shield /> Save permissions
        </Button>
      )}
    </>
  );
}

function RoleDialogBody({
  role,
  readOnly,
  onSaved,
}: {
  role: RoleDef;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const { updateRole, logAudit } = useConsoleStore();
  const [moduleKeys, setModuleKeys] = useState(role.modules);
  const [allBrands, setAllBrands] = useState(role.allBrands);
  const [canPublish, setCanPublish] = useState(role.canPublish);
  const [canApprove, setCanApprove] = useState(role.canApprove);
  const [canManageUsers, setCanManageUsers] = useState(role.canManageUsers);
  const Icon = tierIcon[role.tier];

  const toggleModule = (key: ModuleKey) =>
    setModuleKeys((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const save = () => {
    updateRole(role.key, {
      modules: moduleKeys,
      allBrands,
      canPublish,
      canApprove,
      canManageUsers,
    });
    logAudit({
      brandId: null,
      module: "users",
      category: "Users",
      action: "Role updated",
      target: role.name,
      detail: `${moduleKeys.length} modules · ${allBrands ? "all brands" : "assigned brands only"}.`,
      severity: "critical",
    });
    toast.success("Role saved", { description: `${role.name} was updated.` });
    onSaved();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-accent">
            <Icon className="size-4" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[15px]">{role.name}</DialogTitle>
            <DialogDescription className="text-[11px]">{role.tier} level</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <p className="text-[11px] leading-relaxed text-mut">{role.summary}</p>

      <div className="flex items-center justify-between rounded-md border border-line/12 bg-panel2/45 px-3 py-2.5">
        <span className="text-[11px] font-medium">Applies to all brands</span>
        <Switch checked={allBrands} disabled={readOnly} onCheckedChange={setAllBrands} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-md border border-line/12 bg-panel2/45 px-3 py-2.5">
          <span className="text-[11px] font-medium">Can publish</span>
          <Switch checked={canPublish} disabled={readOnly} onCheckedChange={setCanPublish} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-line/12 bg-panel2/45 px-3 py-2.5">
          <span className="text-[11px] font-medium">Can approve</span>
          <Switch checked={canApprove} disabled={readOnly} onCheckedChange={setCanApprove} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-line/12 bg-panel2/45 px-3 py-2.5">
          <span className="text-[11px] font-medium">Can manage users</span>
          <Switch
            checked={canManageUsers}
            disabled={readOnly}
            onCheckedChange={setCanManageUsers}
          />
        </div>
      </div>

      <div>
        <div className="text-[9px] font-medium uppercase text-mut">Module access</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {modules.map((m) => {
            const on = moduleKeys.includes(m.key);
            return (
              <button
                key={m.key}
                type="button"
                disabled={readOnly}
                onClick={() => toggleModule(m.key)}
                className={`rounded px-2 py-1 text-[10px] font-medium ring-1 disabled:cursor-not-allowed ${
                  on
                    ? "bg-accent/8 ring-accent/30 text-accent"
                    : "bg-frost/6 ring-frost/12 text-mut"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <Button className="w-full text-[12px] font-semibold" onClick={save}>
          <Shield /> Save role
        </Button>
      )}
    </>
  );
}
