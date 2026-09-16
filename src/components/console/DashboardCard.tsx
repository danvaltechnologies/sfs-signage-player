import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared "dashboard card" primitives — verbatim from the Figma Overview Dashboard
 * (node 98:6039) and Screens Overview (node 98:1209) frames, which share one card
 * system: 20px padding, 16px radius, 1px #ebebeb border, the same type scale.
 * Reused across the Overview and Screens pages so both stay pixel-identical.
 */

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-full flex-col items-center justify-between gap-3 rounded-2xl border border-hair bg-white p-5 shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)]">
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  value,
  valueSuffix,
  note,
  noteClass = "text-[#5c5c5c]",
  badge,
  infoIcon = true,
}: {
  title: string;
  value?: ReactNode;
  valueSuffix?: string;
  note?: string;
  noteClass?: string;
  badge?: ReactNode;
  infoIcon?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-2 border-b border-[#ececec] pb-4">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">{title}</p>
            {infoIcon && <Info className="size-[14px] text-[#a3a3a3]" strokeWidth={1.8} />}
          </div>
          {value !== undefined && (
            <div className="flex items-center gap-2 pt-1">
              <p className="text-2xl font-medium leading-8 text-[#171717]">{value}</p>
              {valueSuffix && (
                <span className="pt-2 text-base font-medium text-[#171717]">{valueSuffix}</span>
              )}
              {note && (
                <span className={`text-sm font-medium tracking-[-0.084px] ${noteClass}`}>
                  {note}
                </span>
              )}
            </div>
          )}
        </div>
        {badge}
      </div>
    </div>
  );
}

export function TableHead({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex w-full items-center justify-between py-3">
      <span className="text-xs font-medium text-[#a3a3a3]">{left}</span>
      <span className="text-xs font-medium text-[#a3a3a3]">{right}</span>
    </div>
  );
}

export function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between py-1">
      <span className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-5 shrink-0 text-[#5c5c5c]" strokeWidth={1.6} />}
        <span className="truncate text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
          {label}
        </span>
      </span>
      <span className="shrink-0 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
        {value}
      </span>
    </div>
  );
}

export function ActionRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="truncate text-sm font-medium tracking-[-0.084px] text-[#171717]">
        {label}
      </span>
      <span className="shrink-0 text-sm font-medium tracking-[-0.084px] text-[#5c5c5c]">
        {value}
      </span>
    </div>
  );
}

export function FooterButton({
  to,
  onClick,
  children,
}: {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className =
    "flex h-8 w-full items-center justify-center rounded-lg border border-hair bg-white text-sm font-medium tracking-[-0.084px] text-[#5c5c5c] shadow-[0px_1px_1px_rgba(10,13,20,0.03)] transition hover:bg-[#fafafa]";
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

/** Healthy/Watch/Attention pill — the exact colors Figma uses for the Total Screens badge. */
export function healthTone(downFraction: number) {
  if (downFraction <= 0.05) return { label: "Healthy", bg: "bg-[#c2f5da]", text: "text-[#0b4627]" };
  if (downFraction <= 0.15) return { label: "Watch", bg: "bg-[#fef3c7]", text: "text-[#92400e]" };
  return { label: "Attention", bg: "bg-[#feccc9]", text: "text-[#b21c17]" };
}
