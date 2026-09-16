import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ApprovalChip } from "@/components/console/StatusChip";
import { useBrand } from "@/components/console/brand-context";
import { useConsoleStore } from "@/components/console/console-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brands } from "@/lib/signage-data";

export const Route = createFileRoute("/menus")({
  head: () => ({
    meta: [
      { title: "Menus · Sundry Signal" },
      {
        name: "description",
        content:
          "Every menu board running across the estate — which brand owns it, how many locations show it, and where it sits in review.",
      },
      { property: "og:title", content: "Menus · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Every menu board running across the estate — which brand owns it, how many locations show it, and where it sits in review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenusPage,
});

function CreateMenuDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { activeBrand, isAllBrands } = useBrand();
  const { logAudit } = useConsoleStore();
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(isAllBrands ? brands[0]!.id : activeBrand.id);

  const save = () => {
    if (!name.trim()) return;
    logAudit({
      brandId,
      module: "playlists",
      category: "Content",
      action: "Menu created",
      target: name.trim(),
      detail: "Draft menu. A line manager must approve it before it reaches a menu board.",
      severity: "info",
    });
    toast.success(`“${name.trim()}” saved as a draft menu`);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Create menu</DialogTitle>
          <DialogDescription className="text-[11px]">
            Saved as a draft and recorded in the audit log — nothing reaches a menu board without
            sign-off.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Menu name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Breakfast Menu"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Brand</Label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-[12px]"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="mt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-[12px]">
            Cancel
          </Button>
          <Button onClick={save} disabled={!name.trim()} className="text-[12px] font-semibold">
            Save menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenusPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { playlists, screens } = useConsoleStore();
  const [open, setOpen] = useState(false);

  /**
   * A menu is the playlist a brand's menu boards run, so the two are derived from the
   * same records rather than duplicated.
   */
  const menus = playlists
    .filter((p) => inScope(p.brandId))
    .map((p) => {
      const brand = brands.find((b) => b.id === p.brandId);
      const locations = new Set(
        screens
          .filter((s) => s.brandId === p.brandId && s.type === "Menu Board")
          .map((s) => s.city),
      ).size;
      return {
        id: p.id,
        name: p.name,
        brand: brand?.name ?? "All Brands",
        locations,
        approval: p.approval,
        items: p.items.length,
        total: p.total,
      };
    });

  return (
    <ConsoleShell
      title={isAllBrands ? "Menus · All Brands" : "Menus"}
      subtitle={`${menus.length} menu${menus.length === 1 ? "" : "s"} for ${activeBrand.name} · approved menus publish to every menu board in scope`}
      action={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[14px] font-medium text-primary-foreground transition hover:bg-primary/90 sm:flex"
        >
          <span className="text-[16px] leading-none">+</span> Create Menu
        </button>
      }
    >
      <section className="panel-frost overflow-hidden">
        <div className="border-b border-hair px-4 py-3 text-[14px] font-medium text-ink-strong">
          All Menus
        </div>
        {menus.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] font-medium">No menus for {activeBrand.name}</p>
            <p className="mt-1 text-[11px] text-mut">
              Create one, then assign it to this brand's menu boards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-hair text-[12px] text-mut">
                  <th className="px-4 py-3 font-normal">Menu Name</th>
                  <th className="px-4 py-3 font-normal">Brand</th>
                  <th className="px-4 py-3 font-normal">Locations</th>
                  <th className="px-4 py-3 font-normal">Items</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Runtime</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={m.id} className="border-b border-hair last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-strong">{m.name}</td>
                    <td className="px-4 py-3 text-[13px] text-mut">{m.brand}</td>
                    <td className="px-4 py-3 text-[13px] text-mut">
                      {m.locations} {m.locations === 1 ? "Location" : "Locations"}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-mut">{m.items}</td>
                    <td className="px-4 py-3">
                      <ApprovalChip approval={m.approval} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-mut">{m.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateMenuDialog open={open} onOpenChange={setOpen} />
    </ConsoleShell>
  );
}
