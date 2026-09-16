import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { brands, roleDefs, type RoleKey, type ScreenType } from "@/lib/signage-data";
import { buildScreenId, screenTypeCodes, storesForBrand, zoneCodes } from "@/lib/store-registry";
import { useBrand } from "./brand-context";
import { useConsoleStore } from "./console-store";
import placeholderImage from "@/assets/now-playing.jpg";

export type CreateKind = "media" | "playlist" | "schedule" | "announcement" | "screen" | "user";

export const createLabels: Record<CreateKind, string> = {
  media: "Upload creative",
  playlist: "New playlist",
  schedule: "New schedule",
  announcement: "New announcement",
  screen: "Pair a screen",
  user: "Invite user",
};

const durationOptions = [
  { value: "00:08", label: "00:08" },
  { value: "00:10", label: "00:10" },
  { value: "00:12", label: "00:12" },
  { value: "00:15", label: "00:15" },
  { value: "00:20", label: "00:20" },
  { value: "00:30", label: "00:30" },
  { value: "00:45", label: "00:45" },
  { value: "01:00", label: "01:00" },
  { value: "01:30", label: "01:30" },
  { value: "02:00", label: "02:00" },
  { value: "Full length", label: "Full length (video plays to the end)" },
];

const fieldClass = "mt-1.5 h-9 text-[12px]";
const selectClass =
  "mt-1.5 h-9 w-full cursor-pointer rounded-md border border-line/15 bg-panel px-2.5 text-[12px] focus:border-accent focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] font-medium uppercase text-mut">{label}</Label>
      {children}
    </div>
  );
}

export function CreateDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: CreateKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { activeBrand, isAllBrands, inScope } = useBrand();
  const store = useConsoleStore();

  const defaultBrandId = isAllBrands ? brands[0]!.id : activeBrand.id;
  const [brandId, setBrandId] = useState(defaultBrandId);

  // media
  const [assetName, setAssetName] = useState("");
  const [assetKind, setAssetKind] = useState<"Image" | "Video">("Image");
  const [assetDuration, setAssetDuration] = useState("00:15");
  const [fileName, setFileName] = useState("");

  // playlist
  const [playlistName, setPlaylistName] = useState("");
  const [firstItem, setFirstItem] = useState("");
  const [firstItemDuration, setFirstItemDuration] = useState("00:15");

  // schedule
  const [scheduleName, setScheduleName] = useState("");
  const [windowText, setWindowText] = useState("06:00 – 22:00 daily");
  const [regions, setRegions] = useState("All regions");
  const [types, setTypes] = useState("Menu + Promo");
  const [publishNow, setPublishNow] = useState(true);

  // announcement
  const [text, setText] = useState("");
  const [position, setPosition] = useState<"Top ticker" | "Bottom ticker" | "Full banner">("Bottom ticker");
  const [expires, setExpires] = useState("Today 22:00");

  // screen — built from the Sundry Foods naming convention
  const [storeCode, setStoreCode] = useState("");
  const [zone, setZone] = useState<string>("CTR");
  const [seq, setSeq] = useState("01");
  const [screenType, setScreenType] = useState<ScreenType>("Menu Board");
  const [pin] = useState(() => `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`);

  // user
  const [personName, setPersonName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleKey>("content_manager");
  const [userBrands, setUserBrands] = useState<string[]>([defaultBrandId]);

  useEffect(() => {
    if (open) {
      setBrandId(defaultBrandId);
      setUserBrands([defaultBrandId]);
    }
  }, [open, defaultBrandId]);

  const close = () => onOpenChange(false);
  const affected = store.screens.filter((s) => (isAllBrands ? true : inScope(s.brandId))).length;
  const selectedRole = roleDefs.find((r) => r.key === role)!;

  const brandPicker = (
    <Field label="Brand">
      <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={selectClass}>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </Field>
  );

  let canSubmit = false;
  let body: ReactNode = null;
  let submitLabel = "Create";

  if (kind === "media") {
    canSubmit = assetName.trim().length > 1;
    submitLabel = "Upload for approval";
    body = (
      <div className="space-y-3">
        <Field label="Creative name">
          <Input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g. Jollof Season Promo"
            className={fieldClass}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <select
              value={assetKind}
              onChange={(e) => setAssetKind(e.target.value as "Image" | "Video")}
              className={selectClass}
            >
              <option value="Image">Image</option>
              <option value="Video">Video</option>
            </select>
          </Field>
          <Field label="Duration on screen">
            <select
              value={assetDuration}
              onChange={(e) => setAssetDuration(e.target.value)}
              className={selectClass}
            >
              {durationOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {assetKind === "Video" && (
              <p className="mt-1 text-[10px] text-mut">
                Choose "Full length" to let the video play to its end.
              </p>
            )}
          </Field>
        </div>
        {brandPicker}
        <Field label="File">
          <label className="mt-1.5 flex h-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-line/25 bg-panel2/45 px-3 text-center text-[11px] text-mut hover:border-accent/40 hover:text-frost">
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFileName(f.name);
                if (!assetName.trim()) setAssetName(f.name.replace(/\.[^.]+$/, ""));
                if (f.type.startsWith("video")) {
                  setAssetKind("Video");
                  setAssetDuration("Full length");
                }
              }}
            />
            {fileName || "Choose an image or video · transcodes to landscape and portrait"}
          </label>
        </Field>
      </div>
    );
  }

  if (kind === "playlist") {
    canSubmit = playlistName.trim().length > 1;
    submitLabel = "Create playlist";
    body = (
      <div className="space-y-3">
        <Field label="Playlist name">
          <Input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="e.g. Evening Menu Rotation"
            className={fieldClass}
          />
        </Field>
        {brandPicker}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="First item">
            <select
              value={firstItem}
              onChange={(e) => setFirstItem(e.target.value)}
              className={selectClass}
            >
              <option value="">No item yet</option>
              {store.media
                .filter((m) => m.brandId === brandId)
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} · {m.approval}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Duration">
            <select
              value={firstItemDuration}
              onChange={(e) => setFirstItemDuration(e.target.value)}
              className={selectClass}
            >
              {["00:08", "00:10", "00:12", "00:15", "00:20"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    );
  }

  if (kind === "schedule") {
    canSubmit = scheduleName.trim().length > 1;
    submitLabel = "Send for approval";
    body = (
      <div className="space-y-3">
        <Field label="Campaign name">
          <Input
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            placeholder="e.g. Independence Day Push"
            className={fieldClass}
          />
        </Field>
        {brandPicker}
        <Field label="Window">
          <Input value={windowText} onChange={(e) => setWindowText(e.target.value)} className={fieldClass} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Regions">
            <select value={regions} onChange={(e) => setRegions(e.target.value)} className={selectClass}>
              {["All regions", "South West", "North Central", "North West", "South South", "South East"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Screen types">
            <select value={types} onChange={(e) => setTypes(e.target.value)} className={selectClass}>
              {["Menu + Promo", "Menu", "Promo", "Queue (QMS)"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-line/12 bg-panel2/45 px-3 py-2.5 text-[11px]">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            className="accent-accent"
          />
          Go live on {affected} screens in scope as soon as it is approved
        </label>
        <p className="text-[10px] leading-relaxed text-mut">
          A line manager reviews this campaign before it reaches any screen.
        </p>

      </div>
    );
  }

  if (kind === "announcement") {
    canSubmit = text.trim().length > 4;
    submitLabel = "Send for approval";
    body = (
      <div className="space-y-3">
        <Field label="Message">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="e.g. Card payments temporarily unavailable — cash and transfer accepted."
            className="mt-1.5 text-[12px]"
          />
        </Field>
        {brandPicker}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Position">
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as typeof position)}
              className={selectClass}
            >
              <option value="Bottom ticker">Bottom ticker</option>
              <option value="Top ticker">Top ticker</option>
              <option value="Full banner">Full banner</option>
            </select>
          </Field>
          <Field label="Expires">
            <Input value={expires} onChange={(e) => setExpires(e.target.value)} className={fieldClass} />
          </Field>
        </div>
      </div>
    );
  }

  if (kind === "screen") {
    const brandStores = storesForBrand(brandId);
    const store_ = brandStores.find((s) => s.code === storeCode) ?? brandStores[0];
    const typeCode = screenTypeCodes.find((t) => t.label === screenType)?.code ?? "MNU";
    const screenId = store_
      ? buildScreenId({
          brandId,
          cityCode: store_.cityCode,
          storeNo: store_.storeNo,
          zone,
          screenType: typeCode,
          seq,
        })
      : "—";
    canSubmit = Boolean(store_);
    submitLabel = "Pair screen";
    body = (
      <div className="space-y-3">
        <div className="rounded-md border border-accent/20 bg-accent/8 p-3">
          <div className="text-[9px] font-medium uppercase text-accent">Pairing code</div>
          <div className="mt-1 font-mono text-2xl font-medium tracking-[0.2em] text-accent">{pin}</div>
          <p className="mt-1 text-[10px] text-mut">Enter this code on the player to claim it.</p>
        </div>
        {brandPicker}
        <Field label="Store">
          <select value={store_?.code ?? ""} onChange={(e) => setStoreCode(e.target.value)} className={selectClass}>
            {brandStores.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}, {s.city} · {s.code}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Zone">
            <select value={zone} onChange={(e) => setZone(e.target.value)} className={selectClass}>
              {zoneCodes.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.code} · {z.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Screen type">
            <select
              value={screenType}
              onChange={(e) => setScreenType(e.target.value as ScreenType)}
              className={selectClass}
            >
              <option value="Menu Board">MNU · Menu Board</option>
              <option value="Promo">PRO · Promo</option>
              <option value="Queue (QMS)">QMS · Queue (QMS)</option>
            </select>
          </Field>
          <Field label="Unit no.">
            <Input
              value={seq}
              onChange={(e) => setSeq(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="01"
              className={fieldClass}
            />
          </Field>
        </div>
        <div className="rounded-md border border-line/12 bg-panel2/45 p-3">
          <div className="text-[9px] font-medium uppercase text-mut">Screen ID</div>
          <div className="mt-1 font-mono text-[15px] font-medium">{screenId}</div>
          <p className="mt-1 text-[10px] text-mut">
            BRAND · LOC · STORE# · ZONE · SCREENTYPE · ## — built automatically, not typed.
          </p>
          {store_ ? (
            <p className="mt-1 text-[10px] text-mut">
              {store_.name}, {store_.city} · {store_.region} · store code {store_.code}
            </p>
          ) : null}
        </div>
      </div>
    );
  }


  if (kind === "user") {
    canSubmit = personName.trim().length > 2 && /.+@.+\..+/.test(email) && (selectedRole.allBrands || userBrands.length > 0);
    submitLabel = "Send invite";
    body = (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Ngozi Kalu" className={fieldClass} />
          </Field>
          <Field label="Work email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@sundryfoods.com"
              className={fieldClass}
            />
          </Field>
        </div>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as RoleKey)} className={selectClass}>
            {roleDefs.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name} · {r.tier}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-[11px] leading-relaxed text-mut">{selectedRole.summary}</p>
        <Field label={selectedRole.allBrands ? "Brand access (all brands)" : "Brand access"}>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {brands.map((b) => {
              const on = selectedRole.allBrands || userBrands.includes(b.id);
              return (
                <Button
                  key={b.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={selectedRole.allBrands}
                  onClick={() =>
                    setUserBrands((prev) =>
                      prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id],
                    )
                  }
                  className={`h-8 px-2.5 text-[10px] shadow-none ${
                    on ? "border-accent/35 bg-accent/8 text-accent" : "border-line/15 bg-panel text-mut"
                  }`}
                >
                  {b.name}
                </Button>
              );
            })}
          </div>
        </Field>
      </div>
    );
  }

  const submit = () => {
    if (!canSubmit) return;
    const brandName = brands.find((b) => b.id === brandId)?.name ?? brandId;

    if (kind === "media") {
      store.addMedia({
        name: assetName.trim(),
        brandId,
        kind: assetKind,
        duration: assetDuration,
        image: placeholderImage,
      });
      toast.success("Creative uploaded", { description: `${assetName.trim()} is pending approval for ${brandName}.` });
    }

    if (kind === "playlist") {
      store.addPlaylist({
        name: playlistName.trim(),
        brandId,
        items: firstItem ? [{ label: firstItem, duration: firstItemDuration }] : [],
      });
      toast.success("Sent for approval", {
        description: `${playlistName.trim()} is with the line manager for ${brandName}.`,
      });
    }

    if (kind === "schedule") {
      store.addSchedule({
        name: scheduleName.trim(),
        brandId,
        window: windowText,
        regions,
        types,
        affected,
        state: publishNow ? "Live" : "Scheduled",
      });
      toast.success("Sent for approval", {
        description: `${scheduleName.trim()} · ${affected} screens · goes live once approved.`,
      });
    }

    if (kind === "announcement") {
      store.addAnnouncement({ text: text.trim(), brandId, position, expires, state: "Live" });
      toast.success("Sent for approval", {
        description: `${position} on ${brandName} screens once a line manager approves it.`,
      });
    }


    if (kind === "screen") {
      const brandStores = storesForBrand(brandId);
      const picked = brandStores.find((s) => s.code === storeCode) ?? brandStores[0];
      if (picked) {
        const id = buildScreenId({
          brandId,
          cityCode: picked.cityCode,
          storeNo: picked.storeNo,
          zone,
          screenType: screenTypeCodes.find((t) => t.label === screenType)?.code ?? "MNU",
          seq,
        });
        store.addScreen({
          brandId,
          code: id,
          storeCode: picked.code,
          zone,
          location: picked.name,
          city: picked.city,
          region: picked.region,
          type: screenType,
        });
        toast.success("Screen paired", {
          description: `${id} at ${picked.name}, ${picked.city} · PIN ${pin}.`,
        });
      }
    }

    if (kind === "user") {
      store.addUser({ name: personName.trim(), email: email.trim(), role, brandIds: userBrands });
      toast.success("Invite sent", { description: `${personName.trim()} will join as ${selectedRole.name}.` });
    }

    // reset the fields for this dialog
    setAssetName("");
    setFileName("");
    setPlaylistName("");
    setFirstItem("");
    setScheduleName("");
    setText("");
    setStoreCode("");
    setSeq("01");
    setPersonName("");
    setEmail("");
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{createLabels[kind]}</DialogTitle>
          <DialogDescription className="text-[11px]">
            {kind === "user"
              ? "Access is scoped: pick the role, then the brands this person may see."
              : kind === "screen"
                ? "Register a player, then enter the pairing code on the device."
                : `Saved to ${isAllBrands ? "the selected brand" : activeBrand.name} and recorded in the audit log.`}
          </DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter className="mt-1">
          <Button variant="outline" onClick={close} className="text-[12px]">
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit} className="text-[12px] font-semibold">
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Button + dialog pair for a page's primary create action. */
export function CreateButton({
  kind,
  label,
  icon,
  className,
  variant,
}: {
  kind: CreateKind;
  label?: string;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant ?? "default"} className={className ?? "text-[12px]"}>
        {icon}
        {label ?? createLabels[kind]}
      </Button>
      <CreateDialog kind={kind} open={open} onOpenChange={setOpen} />
    </>
  );
}
