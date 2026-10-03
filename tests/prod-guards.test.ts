import { afterEach, describe, expect, it, vi } from "vitest";
import { getProvider } from "@/lib/payments";
import { secretEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("garde-fous de production", () => {
  it("refuse le paiement de démonstration en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    expect(() => getProvider()).toThrow(/interdit en production/);
  });

  it("autorise le mode démo uniquement avec ALLOW_MOCK_PAYMENTS explicite", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "true");
    expect(getProvider().name).toBe("mock");
  });

  it("exige des secrets longs en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => secretEnv("AUTH_SECRET", "dev")).toThrow(/AUTH_SECRET/);
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    expect(secretEnv("AUTH_SECRET", "dev")).toHaveLength(32);
  });

  it("garde le confort de développement hors production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_SECRET", "");
    expect(secretEnv("AUTH_SECRET", "dev-fallback")).toBe("dev-fallback");
  });
});
