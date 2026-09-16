import { statusLabel, type ApprovalState, type Status } from "@/lib/signage-data";

const tone: Record<Status, { text: string; bg: string; ring: string; dot: string; pulse?: boolean }> = {
  online: { text: "text-success", bg: "bg-success/10", ring: "ring-success/25", dot: "bg-success" },
  syncing: { text: "text-warn", bg: "bg-warn/10", ring: "ring-warn/25", dot: "bg-warn", pulse: true },
  failed: { text: "text-danger", bg: "bg-danger/10", ring: "ring-danger/25", dot: "bg-danger" },
  offline: { text: "text-danger", bg: "bg-danger/10", ring: "ring-danger/25", dot: "bg-danger" },
};

export function StatusChip({ status }: { status: Status }) {
  const t = tone[status];
  return (
    <span
      className={`flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium ring-1 ${t.bg} ${t.ring} ${t.text}`}
    >
      <span className={`size-1.5 rounded-full ${t.dot} ${t.pulse ? "pulse-dot" : ""}`} />
      {statusLabel[status]}
    </span>
  );
}

export function StateChip({ state }: { state: "Live" | "Scheduled" | "Expired" }) {
  const map = {
    Live: "bg-success/10 ring-success/25 text-success",
    Scheduled: "bg-warn/10 ring-warn/25 text-warn",
    Expired: "bg-frost/6 ring-frost/12 text-mut",
  } as const;
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-medium ring-1 ${map[state]}`}>{state}</span>
  );
}

const approvalTone: Record<ApprovalState, string> = {
  Approved: "bg-success/10 ring-success/25 text-success",
  Pending: "bg-warn/10 ring-warn/25 text-warn",
  Rejected: "bg-danger/10 ring-danger/25 text-danger",
  Draft: "bg-frost/6 ring-frost/12 text-mut",
};

const approvalCopy: Record<ApprovalState, string> = {
  Approved: "Approved",
  Pending: "Awaiting approval",
  Rejected: "Sent back",
  Draft: "Draft",
};

export function ApprovalChip({ approval }: { approval: ApprovalState }) {
  return (
    <span
      className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium ring-1 ${approvalTone[approval]}`}
    >
      {approvalCopy[approval]}
    </span>
  );
}

