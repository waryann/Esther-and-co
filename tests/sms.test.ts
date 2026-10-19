import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/sms";

describe("normalizePhone", () => {
  it("convertit les formats courants en numéro international Brevo", () => {
    expect(normalizePhone("+32 470 12 34 56")).toBe("32470123456");
    expect(normalizePhone("0470/12.34.56")).toBe("32470123456");
    expect(normalizePhone("0032 470 12 34 56")).toBe("32470123456");
    expect(normalizePhone("06 12 34 56 78", "33")).toBe("33612345678");
  });

  it("rejette les numéros trop courts", () => {
    expect(normalizePhone("12345")).toBeNull();
  });
});
