import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatPercent, humanizeKey, toneForPriority, toneForScore } from "../index.js";

describe("shared UI helpers", () => {
  it("formats dashboard values consistently", () => {
    expect(formatCurrency(123456.4)).toBe("$123,456");
    expect(formatNumber(1200)).toBe("1,200");
    expect(formatPercent(72.4)).toBe("72%");
    expect(humanizeKey("owner_operator")).toBe("Owner Operator");
  });

  it("maps scores and priorities to presentation tones", () => {
    expect(toneForScore(82)).toBe("positive");
    expect(toneForScore(62)).toBe("warning");
    expect(toneForScore(40)).toBe("critical");
    expect(toneForPriority("critical")).toBe("critical");
    expect(toneForPriority("medium")).toBe("warning");
    expect(toneForPriority("informational")).toBe("positive");
  });
});
