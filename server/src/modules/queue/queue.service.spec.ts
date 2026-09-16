import { QueueService } from "./queue.service";

const service = new QueueService({} as never, {} as never);

const rule = (product: string, keywords: string[], minutes: number) =>
  ({ id: product, brandId: "b", product, keywords, minutes }) as never;

describe("QueueService prep times", () => {
  it("uses the longest matching product line", () => {
    const config = {
      defaultMinutes: 7,
      rules: [rule("bowls", ["jollof"], 6), rule("grills", ["chicken"], 9)],
    };
    expect(service.resolvePrepMinutes(config as never, ["Jollof Bowl", "Grilled Chicken"])).toBe(9);
  });

  it("falls back to the brand default when nothing matches", () => {
    const config = { defaultMinutes: 7, rules: [rule("bowls", ["jollof"], 6)] };
    expect(service.resolvePrepMinutes(config as never, ["Bottled Water"])).toBe(7);
  });
});

describe("QueueService stage derivation", () => {
  const base = { prepMinutes: 10, collectedAt: null };

  it("is placed in the first minute", () => {
    const now = Date.now();
    const result = service.deriveStage({ ...base, placedAt: new Date(now - 20_000) }, 6, now);
    expect(result.stage).toBe("PLACED");
  });

  it("is preparing after a minute", () => {
    const now = Date.now();
    const result = service.deriveStage({ ...base, placedAt: new Date(now - 4 * 60_000) }, 6, now);
    expect(result.stage).toBe("PREPARING");
    expect(result.elapsed).toBe(4);
  });

  it("is ready once the prep time has passed", () => {
    const now = Date.now();
    const result = service.deriveStage({ ...base, placedAt: new Date(now - 11 * 60_000) }, 6, now);
    expect(result.stage).toBe("READY");
  });

  it("auto-clears after the grace window", () => {
    const now = Date.now();
    const result = service.deriveStage({ ...base, placedAt: new Date(now - 20 * 60_000) }, 6, now);
    expect(result.stage).toBe("COLLECTED");
  });
});
