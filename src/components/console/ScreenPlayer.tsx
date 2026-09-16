import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brands, type ApprovalKind } from "@/lib/signage-data";
import { approvalKindLabel, useConsoleStore } from "./console-store";

/** One frame of a simulated screen rotation. */
export type PlaybackSlide = {
  label: string;
  image?: string;
  kind: "Image" | "Video";
  /** Human duration as shown in the console, e.g. "00:15" or "Full length". */
  durationLabel: string;
  /** How long the simulated player holds this frame. */
  seconds: number;
};

export type Playback = {
  title: string;
  meta: string;
  slides: PlaybackSlide[];
  /** Overlay message shown across the bottom of the screen, if any. */
  ticker?: string;
};

const FULL_LENGTH_SECONDS = 12;

function secondsOf(duration: string) {
  const match = /^(\d+):(\d{1,2})$/.exec(duration.trim());
  if (!match) return FULL_LENGTH_SECONDS;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Turns any reviewable item into a playable rotation, so a line manager can watch
 * exactly what a customer would see before signing it off.
 */
export function usePlayback() {
  const { media, playlists, schedules, announcements } = useConsoleStore();

  return useCallback(
    (kind: ApprovalKind, id: string): Playback | null => {
      const brandName = (brandId: string) => brands.find((b) => b.id === brandId)?.name ?? brandId;
      const liveTicker = (brandId: string) =>
        announcements.find(
          (a) => a.brandId === brandId && a.state === "Live" && a.approval === "Approved",
        )?.text;

      const slideFor = (label: string, durationLabel: string, brandId: string): PlaybackSlide => {
        const asset =
          media.find((m) => m.brandId === brandId && m.name.toLowerCase() === label.toLowerCase()) ??
          media.find((m) => m.brandId === brandId && label.toLowerCase().includes(m.name.toLowerCase().split(" ")[0] ?? ""));
        return {
          label,
          ...(asset?.image ? { image: asset.image } : {}),
          kind: asset?.kind ?? "Image",
          durationLabel,
          seconds: secondsOf(durationLabel),
        };
      };

      if (kind === "media") {
        const asset = media.find((m) => m.id === id);
        if (!asset) return null;
        return {
          title: asset.name,
          meta: `${approvalKindLabel.media} · ${brandName(asset.brandId)} · ${asset.duration}`,
          slides: [
            {
              label: asset.name,
              image: asset.image,
              kind: asset.kind,
              durationLabel: asset.duration,
              seconds: secondsOf(asset.duration),
            },
          ],
          ...(liveTicker(asset.brandId) ? { ticker: liveTicker(asset.brandId)! } : {}),
        };
      }

      if (kind === "playlist") {
        const playlist = playlists.find((p) => p.id === id);
        if (!playlist) return null;
        return {
          title: playlist.name,
          meta: `${playlist.items.length} item${playlist.items.length === 1 ? "" : "s"} · ${playlist.total} rotation · ${brandName(playlist.brandId)}`,
          slides: playlist.items.map((item) => slideFor(item.label, item.duration, playlist.brandId)),
          ...(liveTicker(playlist.brandId) ? { ticker: liveTicker(playlist.brandId)! } : {}),
        };
      }

      if (kind === "schedule") {
        const schedule = schedules.find((s) => s.id === id);
        if (!schedule) return null;
        // A campaign plays the brand's approved creatives on the targeted screens.
        const pool = media.filter((m) => m.brandId === schedule.brandId && m.approval === "Approved");
        const source = pool.length > 0 ? pool : media.filter((m) => m.brandId === schedule.brandId);
        return {
          title: schedule.name,
          meta: `${schedule.window} · ${schedule.regions} · ${schedule.affected} screens · ${schedule.types}`,
          slides: source.map((m) => ({
            label: m.name,
            image: m.image,
            kind: m.kind,
            durationLabel: m.duration,
            seconds: secondsOf(m.duration),
          })),
          ...(liveTicker(schedule.brandId) ? { ticker: liveTicker(schedule.brandId)! } : {}),
        };
      }

      const announcement = announcements.find((a) => a.id === id);
      if (!announcement) return null;
      const backdrop = media.filter((m) => m.brandId === announcement.brandId).slice(0, 3);
      return {
        title: announcement.text,
        meta: `${announcement.position} · expires ${announcement.expires} · ${brandName(announcement.brandId)}`,
        slides:
          backdrop.length > 0
            ? backdrop.map((m) => ({
                label: m.name,
                image: m.image,
                kind: m.kind,
                durationLabel: m.duration,
                seconds: secondsOf(m.duration),
              }))
            : [{ label: "Screen background", kind: "Image", durationLabel: "00:08", seconds: 8 }],
        ticker: announcement.text,
      };
    },
    [media, playlists, schedules, announcements],
  );
}

/** Full-bleed screen simulator with play/pause, item stepping and full screen. */
export function ScreenPlayer({ playback, onClose }: { playback: Playback; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const slides = playback.slides;
  const slide = slides[Math.min(index, Math.max(slides.length - 1, 0))];
  const total = slide?.seconds ?? FULL_LENGTH_SECONDS;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (slides.length === 0) return;
      setElapsed(0);
      setIndex((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (!playing || slides.length === 0) return;
    const t = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= total) {
          setIndex((i) => (i + 1) % slides.length);
          return 0;
        }
        return e + 0.1;
      });
    }, 100);
    return () => window.clearInterval(t);
  }, [playing, total, slides.length]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, step]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen();
  };

  const progress = useMemo(() => Math.min(100, (elapsed / total) * 100), [elapsed, total]);
  const KindIcon = slide?.kind === "Video" ? Clapperboard : ImageIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Play ${playback.title}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-line/15 bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{playback.title}</div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-mut">{playback.meta}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close player"
            className="h-8 w-8 shrink-0 p-0 text-mut hover:text-frost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={stageRef} className="relative bg-black">
          {slides.length === 0 || !slide ? (
            <div className="flex aspect-video items-center justify-center px-6 text-center">
              <p className="text-[12px] text-white/70">
                Nothing to play yet — add approved creatives for this brand first.
              </p>
            </div>
          ) : (
            <>
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.label}
                  className="max-h-[68vh] w-full bg-black object-contain"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-neutral-900">
                  <span className="font-mono text-[11px] text-white/60">{slide.label}</span>
                </div>
              )}

              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-1 text-[9px] font-medium text-white ring-1 ring-white/20">
                  <KindIcon className="h-3 w-3" />
                  {slide.kind}
                </span>
                <span className="rounded bg-black/55 px-1.5 py-1 font-mono text-[9px] text-white ring-1 ring-white/20">
                  {index + 1}/{slides.length} · {slide.durationLabel}
                </span>
              </div>

              {playback.ticker && (
                <div className="absolute inset-x-0 bottom-14 overflow-hidden border-y border-accent/40 bg-accent/85 px-3 py-1.5">
                  <p className="truncate text-[11px] font-medium text-white">{playback.ticker}</p>
                </div>
              )}

              {!playing && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
                  <Play className="h-12 w-12 text-white/85" />
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous item"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pause" : "Play"}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 hover:bg-white/30"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next item"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? "Exit full screen" : "View full screen"}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto border-t border-line/10 px-3 py-2.5">
            {slides.map((s, i) => (
              <button
                key={`${s.label}-${i}`}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setElapsed(0);
                }}
                className={`shrink-0 rounded-md px-2 py-1.5 text-[10px] ring-1 ${
                  i === index ? "bg-accent/10 text-accent ring-accent/30" : "bg-panel2/60 text-mut ring-line/12"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
