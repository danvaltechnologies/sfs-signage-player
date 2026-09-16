import { createServerFn } from "@tanstack/react-start";

export type QueueSnapshot = {
  serverTime: number;
  orders: Array<{
    id: string;
    ticket: string;
    brandId: string;
    outletId: string;
    channel: "Counter" | "Kiosk" | "Drive-thru" | "Delivery";
    customer: string;
    items: string;
    stage: "Placed" | "Preparing" | "Ready" | "Collected";
    elapsed: number;
    prepMinutes: number;
    placedAt: number;
    readyAt: number;
    overdue: boolean;
    source: "pos-webhook" | "seed";
  }>;
  config: Array<{
    brandId: string;
    defaultMinutes: number;
    autoCollectAfter: number;
    rules: Array<{ id: string; product: string; keywords: string[]; minutes: number }>;
  }>;
  links: Array<{ outletId: string; lastOrderAt: number | null; posLink: "connected" | "degraded" | "offline" }>;
};

export const getQueueSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<QueueSnapshot> => {
  const store = await import("./pos-store.server");
  const orders = store.listOrderViews();
  const now = Date.now();
  const lastByOutlet = new Map<string, number>();
  for (const o of orders) {
    const prev = lastByOutlet.get(o.outletId) ?? 0;
    if (o.placedAt > prev) lastByOutlet.set(o.outletId, o.placedAt);
  }
  const links = [...lastByOutlet.entries()].map(([outletId, at]) => ({
    outletId,
    lastOrderAt: at,
    posLink:
      now - at < 15 * 60_000 ? ("connected" as const) : now - at < 60 * 60_000 ? ("degraded" as const) : ("offline" as const),
  }));
  return {
    serverTime: now,
    orders: orders.map(({ itemNames, collectedAt, ...rest }) => {
      void itemNames;
      void collectedAt;
      return rest;
    }),
    config: store.listPrepConfig(),
    links,
  };
});

export const setPrepMinutes = createServerFn({ method: "POST" })
  .inputValidator((data: { brandId: string; ruleId: string; minutes: number }) => {
    if (!data?.brandId || !data?.ruleId) throw new Error("brandId and ruleId are required");
    const minutes = Math.round(Number(data.minutes));
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 240) throw new Error("minutes must be 0–240");
    return { brandId: data.brandId, ruleId: data.ruleId, minutes };
  })
  .handler(async ({ data }) => {
    const store = await import("./pos-store.server");
    const updated = store.updatePrepRule(data.brandId, data.ruleId, data.minutes);
    return { ok: Boolean(updated) };
  });

export const setBrandTimings = createServerFn({ method: "POST" })
  .inputValidator((data: { brandId: string; defaultMinutes?: number; autoCollectAfter?: number }) => {
    if (!data?.brandId) throw new Error("brandId is required");
    const clamp = (v: number | undefined) => {
      if (v === undefined) return undefined;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n) || n < 0 || n > 240) throw new Error("minutes must be 0–240");
      return n;
    };
    return {
      brandId: data.brandId,
      defaultMinutes: clamp(data.defaultMinutes),
      autoCollectAfter: clamp(data.autoCollectAfter),
    };
  })
  .handler(async ({ data }) => {
    const store = await import("./pos-store.server");
    const patch: { defaultMinutes?: number; autoCollectAfter?: number } = {};
    if (data.defaultMinutes !== undefined) patch.defaultMinutes = data.defaultMinutes;
    if (data.autoCollectAfter !== undefined) patch.autoCollectAfter = data.autoCollectAfter;
    return { ok: Boolean(store.updateBrandTimings(data.brandId, patch)) };
  });

export const collectOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string }) => {
    if (!data?.orderId) throw new Error("orderId is required");
    return { orderId: data.orderId };
  })
  .handler(async ({ data }) => {
    const store = await import("./pos-store.server");
    return { ok: store.markCollected(data.orderId) };
  });
