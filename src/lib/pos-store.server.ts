/**
 * In-memory POS order store for the Sundry queue.
 *
 * The POS only tells us that an order was placed and paid. Everything after
 * that (Preparing / Ready / Collected) is derived from the prep time configured
 * per brand and per product line, so the counter screens advance on their own.
 *
 * This module is server-only. It holds state in the running server instance;
 * swapping it for the Azure-hosted store later only means replacing the read
 * and write helpers below.
 */

export type PosStage = "Placed" | "Preparing" | "Ready" | "Collected";

export type PrepRule = {
  id: string;
  /** Product line label shown in the config UI. */
  product: string;
  /** Lower-cased keywords matched against POS line items. */
  keywords: string[];
  minutes: number;
};

export type BrandPrepConfig = {
  brandId: string;
  /** Used when no product line matches the ticket. */
  defaultMinutes: number;
  /** Minutes a ticket stays on the "Ready" board before it auto-clears. */
  autoCollectAfter: number;
  rules: PrepRule[];
};

export type PosOrderRecord = {
  id: string;
  ticket: string;
  brandId: string;
  outletId: string;
  channel: "Counter" | "Kiosk" | "Drive-thru" | "Delivery";
  customer: string;
  items: string;
  itemNames: string[];
  /** Epoch ms the POS recorded payment. */
  placedAt: number;
  /** Prep minutes resolved from the brand config at ingest time. */
  prepMinutes: number;
  collectedAt: number | null;
  source: "pos-webhook" | "seed";
};

export type PosOrderView = PosOrderRecord & {
  stage: PosStage;
  /** Whole minutes since the POS took payment. */
  elapsed: number;
  /** Epoch ms the ticket is expected to be called. */
  readyAt: number;
  overdue: boolean;
};

const g = globalThis as unknown as {
  __sundryPos?: { orders: Map<string, PosOrderRecord>; config: Map<string, BrandPrepConfig>; seq: number };
};

function defaults(): Map<string, BrandPrepConfig> {
  const cfg: BrandPrepConfig[] = [
    {
      brandId: "kilimanjaro",
      defaultMinutes: 7,
      autoCollectAfter: 6,
      rules: [
        { id: "kj-1", product: "Rice bowls & jollof", keywords: ["jollof", "rice", "bowl"], minutes: 6 },
        { id: "kj-2", product: "Grills & chicken", keywords: ["chicken", "grill", "suya"], minutes: 9 },
        { id: "kj-3", product: "Family packs & combos", keywords: ["family", "combo", "pack"], minutes: 13 },
        { id: "kj-4", product: "Pies & sides", keywords: ["pie", "fries", "moi", "side"], minutes: 4 },
      ],
    },
    {
      brandId: "pizza-jungle",
      defaultMinutes: 14,
      autoCollectAfter: 8,
      rules: [
        { id: "pj-1", product: "Medium pizza", keywords: ["medium"], minutes: 12 },
        { id: "pj-2", product: "Large pizza", keywords: ["large", "pepperoni", "bbq"], minutes: 16 },
        { id: "pj-3", product: "Wings & sides", keywords: ["wing", "side", "garlic"], minutes: 8 },
      ],
    },
    {
      brandId: "killi-grill",
      defaultMinutes: 10,
      autoCollectAfter: 6,
      rules: [
        { id: "kg-1", product: "Skewers", keywords: ["skewer", "kebab"], minutes: 8 },
        { id: "kg-2", product: "Grill platters", keywords: ["platter", "grill"], minutes: 14 },
      ],
    },
    {
      brandId: "nibbles-creamy",
      defaultMinutes: 4,
      autoCollectAfter: 4,
      rules: [
        { id: "nc-1", product: "Scoops & sundaes", keywords: ["sundae", "scoop", "cone"], minutes: 3 },
        { id: "nc-2", product: "Milkshakes", keywords: ["shake", "smoothie"], minutes: 5 },
        { id: "nc-3", product: "Waffles", keywords: ["waffle", "pancake"], minutes: 7 },
      ],
    },
    {
      brandId: "nibbles-bakery",
      defaultMinutes: 5,
      autoCollectAfter: 5,
      rules: [
        { id: "nb-1", product: "Bread & loaves", keywords: ["bread", "loaf"], minutes: 3 },
        { id: "nb-2", product: "Pastries", keywords: ["croissant", "doughnut", "pastry"], minutes: 6 },
        { id: "nb-3", product: "Cakes to order", keywords: ["cake"], minutes: 20 },
      ],
    },
  ];
  return new Map(cfg.map((c) => [c.brandId, c]));
}

function seedOrders(config: Map<string, BrandPrepConfig>): Map<string, PosOrderRecord> {
  const now = Date.now();
  const min = 60_000;
  const raw: Array<Omit<PosOrderRecord, "prepMinutes" | "source" | "itemNames"> & { ago: number; itemNames: string[] }> = [
    { id: "q1", ticket: "A-214", brandId: "kilimanjaro", outletId: "o1", channel: "Counter", customer: "Ada O.", items: "Jollof Bowl ×2, Chapman", itemNames: ["Jollof Bowl", "Chapman"], placedAt: 0, collectedAt: null, ago: 7 },
    { id: "q2", ticket: "A-215", brandId: "kilimanjaro", outletId: "o1", channel: "Kiosk", customer: "Tunde A.", items: "Grilled Chicken, Fries", itemNames: ["Grilled Chicken", "Fries"], placedAt: 0, collectedAt: null, ago: 4 },
    { id: "q3", ticket: "A-216", brandId: "kilimanjaro", outletId: "o1", channel: "Drive-thru", customer: "Ngozi K.", items: "Family Pack", itemNames: ["Family Pack"], placedAt: 0, collectedAt: null, ago: 2 },
    { id: "q4", ticket: "V-088", brandId: "kilimanjaro", outletId: "o2", channel: "Counter", customer: "Bisi F.", items: "Fried Rice, Moi Moi", itemNames: ["Fried Rice", "Moi Moi"], placedAt: 0, collectedAt: null, ago: 6 },
    { id: "q5", ticket: "P-402", brandId: "pizza-jungle", outletId: "o4", channel: "Kiosk", customer: "Ifeoma D.", items: "Large Pepperoni", itemNames: ["Large Pepperoni"], placedAt: 0, collectedAt: null, ago: 8 },
    { id: "q6", ticket: "P-403", brandId: "pizza-jungle", outletId: "o4", channel: "Counter", customer: "Grace N.", items: "BBQ Chicken, Wings", itemNames: ["BBQ Chicken", "Wings"], placedAt: 0, collectedAt: null, ago: 1 },
    { id: "q7", ticket: "G-117", brandId: "killi-grill", outletId: "o6", channel: "Counter", customer: "Femi B.", items: "Grill Platter", itemNames: ["Grill Platter"], placedAt: 0, collectedAt: null, ago: 5 },
    { id: "q8", ticket: "C-076", brandId: "nibbles-creamy", outletId: "o7", channel: "Counter", customer: "Zainab T.", items: "Sundae, Waffle", itemNames: ["Sundae", "Waffle"], placedAt: 0, collectedAt: null, ago: 4 },
    { id: "q9", ticket: "B-056", brandId: "nibbles-bakery", outletId: "o8", channel: "Counter", customer: "Musa I.", items: "Doughnut Box", itemNames: ["Doughnut Box"], placedAt: 0, collectedAt: null, ago: 2 },
  ];
  const map = new Map<string, PosOrderRecord>();
  for (const r of raw) {
    const { ago, ...rest } = r;
    map.set(r.id, {
      ...rest,
      placedAt: now - ago * min,
      prepMinutes: resolvePrepMinutes(config.get(r.brandId), r.itemNames),
      source: "seed",
    });
  }
  return map;
}

function store() {
  if (!g.__sundryPos) {
    const config = defaults();
    g.__sundryPos = { config, orders: seedOrders(config), seq: 500 };
  }
  return g.__sundryPos;
}

export function resolvePrepMinutes(config: BrandPrepConfig | undefined, itemNames: string[]): number {
  if (!config) return 8;
  const text = itemNames.join(" ").toLowerCase();
  const matched = config.rules.filter((r) => r.keywords.some((k) => text.includes(k))).map((r) => r.minutes);
  return matched.length ? Math.max(...matched) : config.defaultMinutes;
}

export function deriveView(order: PosOrderRecord, config: BrandPrepConfig | undefined, now = Date.now()): PosOrderView {
  const elapsedMs = now - order.placedAt;
  const elapsed = Math.max(0, Math.floor(elapsedMs / 60_000));
  const readyAt = order.placedAt + order.prepMinutes * 60_000;
  const grace = (config?.autoCollectAfter ?? 6) * 60_000;
  let stage: PosStage;
  if (order.collectedAt || now >= readyAt + grace) stage = "Collected";
  else if (now >= readyAt) stage = "Ready";
  else if (elapsedMs >= 60_000) stage = "Preparing";
  else stage = "Placed";
  return {
    ...order,
    stage,
    elapsed,
    readyAt,
    overdue: stage !== "Ready" && stage !== "Collected" && now > readyAt,
  };
}

export function listOrderViews(): PosOrderView[] {
  const s = store();
  const now = Date.now();
  // Drop tickets that cleared over an hour ago so the store stays bounded.
  for (const [id, o] of s.orders) {
    if (now - o.placedAt > 3 * 3_600_000) s.orders.delete(id);
  }
  return [...s.orders.values()]
    .map((o) => deriveView(o, s.config.get(o.brandId), now))
    .sort((a, b) => a.placedAt - b.placedAt);
}

export function listPrepConfig(): BrandPrepConfig[] {
  return [...store().config.values()].map((c) => ({ ...c, rules: c.rules.map((r) => ({ ...r })) }));
}

export function updatePrepRule(brandId: string, ruleId: string, minutes: number): BrandPrepConfig | null {
  const cfg = store().config.get(brandId);
  if (!cfg) return null;
  const rule = cfg.rules.find((r) => r.id === ruleId);
  if (!rule) return null;
  rule.minutes = minutes;
  return { ...cfg, rules: cfg.rules.map((r) => ({ ...r })) };
}

export function updateBrandTimings(
  brandId: string,
  patch: { defaultMinutes?: number; autoCollectAfter?: number },
): BrandPrepConfig | null {
  const cfg = store().config.get(brandId);
  if (!cfg) return null;
  if (typeof patch.defaultMinutes === "number") cfg.defaultMinutes = patch.defaultMinutes;
  if (typeof patch.autoCollectAfter === "number") cfg.autoCollectAfter = patch.autoCollectAfter;
  return { ...cfg, rules: cfg.rules.map((r) => ({ ...r })) };
}

export function markCollected(orderId: string): boolean {
  const order = store().orders.get(orderId);
  if (!order) return false;
  order.collectedAt = Date.now();
  return true;
}

export type IngestInput = {
  orderId: string;
  ticket?: string;
  brandId: string;
  outletId: string;
  channel?: PosOrderRecord["channel"];
  customer?: string;
  items: Array<{ name: string; quantity?: number }>;
  paidAt?: string;
};

/** Records a paid POS order and returns the derived queue ticket. */
export function ingestPosOrder(input: IngestInput): PosOrderView {
  const s = store();
  const config = s.config.get(input.brandId);
  const itemNames = input.items.map((i) => i.name);
  const placedAtRaw = input.paidAt ? Date.parse(input.paidAt) : Date.now();
  const placedAt = Number.isFinite(placedAtRaw) ? placedAtRaw : Date.now();
  const existing = s.orders.get(input.orderId);
  const record: PosOrderRecord = {
    id: input.orderId,
    ticket: input.ticket ?? `#${(s.seq += 1)}`,
    brandId: input.brandId,
    outletId: input.outletId,
    channel: input.channel ?? "Counter",
    customer: input.customer ?? "Guest",
    items: input.items.map((i) => (i.quantity && i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(", "),
    itemNames,
    placedAt,
    prepMinutes: resolvePrepMinutes(config, itemNames),
    collectedAt: existing?.collectedAt ?? null,
    source: "pos-webhook",
  };
  s.orders.set(record.id, record);
  return deriveView(record, config);
}

export function knownBrandIds(): string[] {
  return [...store().config.keys()];
}
