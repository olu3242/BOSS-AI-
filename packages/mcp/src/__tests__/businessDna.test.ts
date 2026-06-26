import { describe, expect, it } from "vitest";
import { deriveBusinessDna } from "../intelligence/businessDna.js";
import { sampleResponses } from "./fixtures.js";

describe("deriveBusinessDna", () => {
  it("derives all 10 dimensions deterministically", () => {
    const dna = deriveBusinessDna(sampleResponses);

    expect(dna.archetype).toBe("owner_operator");
    expect(dna.growthStage).toBe("early_growth");
    expect(dna.operationalComplexity).toBe("moderate");
    expect(dna.revenueModel).toBe("service_based");
    expect(dna.decisionStyle).toBe("owner_led");
  });

  it("is deterministic for the same input", () => {
    const first = deriveBusinessDna(sampleResponses);
    const second = deriveBusinessDna(sampleResponses);
    expect(first).toEqual(second);
  });
});
