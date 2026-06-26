import { describe, expect, it } from "vitest";
import { deriveBusinessDna } from "../intelligence/businessDna.js";
import { evaluateCapabilities } from "../intelligence/capabilityGraph.js";
import { sampleResponses } from "./fixtures.js";

describe("evaluateCapabilities", () => {
  it("evaluates all 9 core capabilities", () => {
    const dna = deriveBusinessDna(sampleResponses);
    const capabilities = evaluateCapabilities(sampleResponses, dna);

    expect(capabilities).toHaveLength(9);
    expect(capabilities.map((c) => c.capabilityKey)).toEqual(
      expect.arrayContaining([
        "lead_management",
        "scheduling",
        "customer_management",
        "finance",
        "operations",
        "reporting",
        "communication",
        "marketing",
        "task_management",
      ]),
    );
  });

  it("marks goal-aligned capabilities as high importance", () => {
    const dna = deriveBusinessDna(sampleResponses);
    const capabilities = evaluateCapabilities(sampleResponses, dna);
    const leadManagement = capabilities.find((c) => c.capabilityKey === "lead_management");
    expect(leadManagement?.businessImportance).toBe("high");
  });
});
