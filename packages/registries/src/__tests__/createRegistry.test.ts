import { describe, expect, it } from "vitest";
import { createRegistry } from "../createRegistry.js";

describe("createRegistry", () => {
  it("registers and lists entries", () => {
    const registry = createRegistry<{ key: string; label: string }>();
    registry.register({ key: "a", label: "A" });
    registry.register({ key: "b", label: "B" });

    expect(registry.list()).toHaveLength(2);
    expect(registry.get("a")?.label).toBe("A");
    expect(registry.get("missing")).toBeUndefined();
  });

  it("rejects duplicate keys", () => {
    const registry = createRegistry<{ key: string; label: string }>();
    registry.register({ key: "a", label: "A" });

    expect(() => registry.register({ key: "a", label: "A2" })).toThrow();
  });
});
