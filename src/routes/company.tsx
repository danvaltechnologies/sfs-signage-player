import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { SettingsLayout } from "@/components/console/SettingsSubNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company Settings · Sundry Signal" },
      {
        name: "description",
        content: "Organization profile shown across the console — name, website and description.",
      },
      { property: "og:title", content: "Company Settings · Sundry Signal" },
      {
        property: "og:description",
        content: "Organization profile shown across the console — name, website and description.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyPage,
});

const DEFAULTS = {
  name: "Sundry Foods",
  website: "sundryfood.com",
  slogan: "Everything you love, on every screen.",
  description: "",
};

function CompanyPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [draft, setDraft] = useState(DEFAULTS);
  const dirty = JSON.stringify(form) !== JSON.stringify(draft);

  const set = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <ConsoleShell
      title="Company Settings"
      subtitle="Manage the organization profile shown across the console"
    >
      <SettingsLayout>
        <div className="rounded-2xl border border-hair bg-white p-5 shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
          <div className="flex items-center gap-4 border-b border-[#ececec] pb-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f5f5f4] text-mut">
              <Upload className="size-6" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[13px] font-medium text-ink-strong">Upload logo</div>
              <p className="mt-0.5 text-[11px] text-mut">Min 400×400px, PNG or JPEG</p>
              <Button variant="outline" size="sm" className="mt-2 h-8 text-[11px]">
                Upload
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-5">
            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Company Name <span className="text-accent">*</span>
              </Label>
              <Input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                className="text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">
                Website URL <span className="text-accent">*</span>
              </Label>
              <div className="flex h-9 items-center overflow-hidden rounded-md border border-input">
                <span className="h-full shrink-0 border-r border-input bg-[#fafafa] px-3 text-[12px] leading-9 text-mut">
                  https://
                </span>
                <input
                  value={draft.website}
                  onChange={(e) => set({ website: e.target.value })}
                  className="h-full flex-1 bg-transparent px-3 text-[13px] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Slogan / Catchphrase</Label>
              <Input
                value={draft.slogan}
                onChange={(e) => set({ slogan: e.target.value })}
                placeholder="e.g. Unlocking Potential, Inspiring Growth."
                className="text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12px]">Company Description</Label>
                <span className="text-[10px] text-mut">(Optional)</span>
              </div>
              <Textarea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value.slice(0, 200) })}
                placeholder="Describe your company…"
                className="min-h-[96px] text-[13px]"
              />
              <div className="flex items-center justify-between text-[10px] text-mut">
                <span>You can describe your company briefly.</span>
                <span>{draft.description.length}/200</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#ececec] pt-5">
            <Button
              variant="outline"
              className="text-[12px]"
              disabled={!dirty}
              onClick={() => setDraft(form)}
            >
              Discard
            </Button>
            <Button
              className="text-[12px] font-semibold"
              disabled={!dirty}
              onClick={() => {
                setForm(draft);
                toast.success("Company settings saved");
              }}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </SettingsLayout>
    </ConsoleShell>
  );
}
