import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
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

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates · Sundry Signal" },
      {
        name: "description",
        content:
          "Reusable screen layouts — full screen, split screen and picture-in-picture — and every template already built on them.",
      },
      { property: "og:title", content: "Templates · Sundry Signal" },
      {
        property: "og:description",
        content:
          "Reusable screen layouts — full screen, split screen and picture-in-picture — and every template already built on them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

type LayoutKey = "full" | "split" | "pip";

const layouts: {
  key: LayoutKey;
  name: string;
  summary: string;
  bestFor: string;
  preview: React.ReactNode;
}[] = [
  {
    key: "full",
    name: "Full Screen",
    summary: "One media zone filling the entire display.",
    bestFor: "Best for full-screen promotions, videos, and announcements.",
    preview: <div className="size-full rounded-[3px] border-2 border-dashed border-accent/70" />,
  },
  {
    key: "split",
    name: "Split Screen",
    summary: "Two zones side by side.",
    bestFor: "Useful for menu displays, queues, and promotional content.",
    preview: (
      <div className="flex size-full gap-2">
        <div className="h-full flex-1 rounded-[3px] border-2 border-dashed border-accent/70" />
        <div className="h-full flex-1 rounded-[3px] border-2 border-dashed border-[#7aa7ff]" />
      </div>
    ),
  },
  {
    key: "pip",
    name: "Picture-in-Picture",
    summary:
      "Full-screen media with a smaller inset area for video, QR codes, tickers, or promotions.",
    bestFor: "Best for layering a live ticker or QR code over a running campaign.",
    preview: (
      <div className="relative size-full rounded-[3px] border-2 border-dashed border-accent/70">
        <div className="absolute bottom-3 right-3 h-[38%] w-[34%] rounded-[4px] border border-[#7aa7ff] bg-white" />
      </div>
    ),
  },
];

const layoutLabel: Record<LayoutKey, string> = {
  full: "Full Screen",
  split: "Split Screen",
  pip: "Picture-in-Picture",
};

function NewTemplateDialog({
  layout,
  onOpenChange,
}: {
  layout: LayoutKey | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { activeBrand, isAllBrands } = useBrand();
  const { logAudit } = useConsoleStore();
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(isAllBrands ? brands[0]!.id : activeBrand.id);

  const save = () => {
    if (!layout || !name.trim()) return;
    logAudit({
      brandId,
      module: "playlists",
      category: "Content",
      action: "Template created",
      target: name.trim(),
      detail: `${layoutLabel[layout]} layout. Draft — not yet attached to any screen.`,
      severity: "info",
    });
    toast.success(`“${name.trim()}” saved as a draft template`);
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={layout !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">New template</DialogTitle>
          <DialogDescription className="text-[11px]">
            {layout ? `${layoutLabel[layout]} layout.` : ""} Saved as a draft and recorded in the
            audit log — it reaches no screen until a line manager approves it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Template name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lunch Menu Display"
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
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatesPage() {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const { playlists, screens } = useConsoleStore();
  const [layout, setLayout] = useState<LayoutKey | null>(null);

  /** Templates are the layout behind each playlist — derived so the two never drift. */
  const templates = playlists
    .filter((p) => inScope(p.brandId))
    .map((p) => {
      const brand = brands.find((b) => b.id === p.brandId);
      const uses = screens.filter((s) => s.brandId === p.brandId).length;
      const kind =
        p.items.length > 3 ? "Menu Board" : p.items.length > 1 ? "Split Screen" : "Promo";
      return {
        id: p.id,
        name: p.name,
        kind,
        brand: brand?.name ?? "All Brands",
        uses,
        total: p.total,
      };
    });

  return (
    <ConsoleShell
      title={isAllBrands ? "Templates · All Brands" : "Templates"}
      subtitle={`${templates.length} template${templates.length === 1 ? "" : "s"} for ${activeBrand.name} · pick a layout to start a new one`}
      action={
        <button
          type="button"
          onClick={() => setLayout("full")}
          className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[14px] font-medium text-primary-foreground transition hover:bg-primary/90 sm:flex"
        >
          <span className="text-[16px] leading-none">+</span> New Template
        </button>
      }
    >
      <section>
        <h2 className="text-[15px] font-medium text-ink-strong">Choose a layout</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {layouts.map((l) => (
            <div key={l.key} className="panel-frost flex flex-col p-4">
              <div className="h-[110px] rounded-md bg-[#fafafa] p-3">{l.preview}</div>
              <div className="mt-4 text-[14px] font-medium text-ink-strong">{l.name}</div>
              <p className="mt-1 text-[12px] text-mut">{l.summary}</p>
              <p className="mt-2 text-[12px] text-mut">{l.bestFor}</p>
              <button
                type="button"
                onClick={() => setLayout(l.key)}
                className="mt-4 flex h-9 items-center justify-center rounded-lg border border-hair-strong text-[12px] font-medium text-ink-soft transition hover:bg-[#fafafa]"
              >
                Use Layout
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-medium text-ink-strong">Your Templates</h2>
        {templates.length === 0 ? (
          <div className="panel-frost mt-3 p-10 text-center">
            <p className="text-[13px] font-medium">No templates for {activeBrand.name}</p>
            <p className="mt-1 text-[11px] text-mut">Pick a layout above to build the first one.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className="panel-frost overflow-hidden">
                <div className="h-[130px] bg-[#f1f1ef]" />
                <div className="p-4">
                  <div className="truncate text-[14px] font-medium text-ink-strong">{t.name}</div>
                  <div className="mt-1 text-[12px] text-mut">
                    {t.kind} · {t.brand}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-hair pt-3 text-[11px] text-mut">
                    <span>Runs {t.total}</span>
                    <span>Used {t.uses}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <NewTemplateDialog layout={layout} onOpenChange={(open) => !open && setLayout(null)} />
    </ConsoleShell>
  );
}
