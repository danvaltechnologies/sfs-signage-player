import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * POS → QMS webhook.
 *
 * Any till system (or the middleware in front of it) posts a paid order here.
 * The POS only reports that the order was placed and paid; the queue derives
 * Preparing / Ready / Collected from the prep times configured per brand.
 *
 * Signature: header `x-sundry-signature: sha256=<hex>` where the hex digest is
 * HMAC-SHA256 of the raw request body keyed with POS_WEBHOOK_SECRET.
 */

type Incoming = {
  order_id?: string;
  ticket?: string;
  brand_id?: string;
  outlet_id?: string;
  channel?: string;
  customer?: string;
  paid_at?: string;
  items?: Array<{ name?: string; quantity?: number }>;
};

const channels = ["Counter", "Kiosk", "Drive-thru", "Delivery"] as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function signatureValid(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/pos/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["POS_WEBHOOK_SECRET"];
        if (!secret) return json({ error: "webhook secret not configured" }, 503);

        const raw = await request.text();
        if (!signatureValid(raw, request.headers.get("x-sundry-signature"), secret)) {
          return json({ error: "invalid signature" }, 401);
        }

        let payload: Incoming;
        try {
          payload = JSON.parse(raw) as Incoming;
        } catch {
          return json({ error: "body must be JSON" }, 400);
        }

        const store = await import("@/lib/pos-store.server");
        const brandId = String(payload.brand_id ?? "").trim();
        const outletId = String(payload.outlet_id ?? "").trim();
        const orderId = String(payload.order_id ?? "").trim();
        const items = (payload.items ?? [])
          .map((i) => ({ name: String(i?.name ?? "").trim().slice(0, 80), quantity: Number(i?.quantity ?? 1) }))
          .filter((i) => i.name.length > 0)
          .slice(0, 40);

        if (!orderId || orderId.length > 64) return json({ error: "order_id is required" }, 400);
        if (!store.knownBrandIds().includes(brandId)) return json({ error: "unknown brand_id" }, 400);
        if (!outletId || outletId.length > 32) return json({ error: "outlet_id is required" }, 400);
        if (items.length === 0) return json({ error: "at least one item is required" }, 400);

        const channel = channels.find((c) => c === payload.channel) ?? "Counter";
        const ticket = payload.ticket ? String(payload.ticket).trim().slice(0, 16) : undefined;
        const customer = payload.customer ? String(payload.customer).trim().slice(0, 60) : undefined;
        const paidAt = payload.paid_at ? String(payload.paid_at).slice(0, 40) : undefined;

        const view = store.ingestPosOrder({
          orderId,
          brandId,
          outletId,
          channel,
          items,
          ...(ticket ? { ticket } : {}),
          ...(customer ? { customer } : {}),
          ...(paidAt ? { paidAt } : {}),
        });

        return json(
          {
            accepted: true,
            ticket: view.ticket,
            stage: view.stage,
            prep_minutes: view.prepMinutes,
            ready_at: new Date(view.readyAt).toISOString(),
          },
          202,
        );
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type, x-sundry-signature",
          },
        }),
    },
  },
});
