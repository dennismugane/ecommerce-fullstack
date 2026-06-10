import { describe, it, expect } from "vitest";
import {
  formatMoneyCurrency,
  OrderFormatMoneyCurrency,
} from "./formatMoneyCurrency";

// ✅ normalize helper (fixes invisible spaces + locale quirks)
const normalize = (str) =>
  str
    .replace(/\u00A0/g, " ") // replace non-breaking space
    .replace(/\s+/g, " ") // normalize spaces
    .trim();

// -----------------------------
// formatMoneyCurrency tests
// -----------------------------
describe("formatMoneyCurrency", () => {
  it("should convert USD to KES by multiplying by 80", () => {
    const result = formatMoneyCurrency(1);
    expect(normalize(result)).toBe("Ksh 80");
  });

  it("should format large numbers correctly", () => {
    const result = formatMoneyCurrency(1000);
    expect(normalize(result)).toBe("Ksh 80,000");
  });

  it("should handle zero correctly", () => {
    const result = formatMoneyCurrency(0);
    expect(normalize(result)).toBe("Ksh 0");
  });

  it("should handle decimal input correctly", () => {
    const result = formatMoneyCurrency(1.5);
    expect(normalize(result)).toBe("Ksh 120");
  });

  it("should handle negative values", () => {
    const result = formatMoneyCurrency(-2);
    expect(normalize(result)).toBe("-Ksh 160");
  });

  it("should not show decimal places", () => {
    const result = formatMoneyCurrency(1.234);
    expect(normalize(result)).not.toMatch(/\./);
  });
});

// -----------------------------
// OrderFormatMoneyCurrency tests
// -----------------------------
describe("OrderFormatMoneyCurrency", () => {
  it("should format amount without conversion", () => {
    const result = OrderFormatMoneyCurrency(80);
    expect(normalize(result)).toBe("Ksh 80");
  });

  it("should format large numbers correctly", () => {
    const result = OrderFormatMoneyCurrency(80000);
    expect(normalize(result)).toBe("Ksh 80,000");
  });

  it("should handle zero correctly", () => {
    const result = OrderFormatMoneyCurrency(0);
    expect(normalize(result)).toBe("Ksh 0");
  });

  it("should handle decimal input by rounding", () => {
    const result = OrderFormatMoneyCurrency(120.75);
    expect(normalize(result)).toBe("Ksh 121");
  });

  it("should handle negative values", () => {
    const result = OrderFormatMoneyCurrency(-50);
    expect(normalize(result)).toBe("-Ksh 50");
  });
});
