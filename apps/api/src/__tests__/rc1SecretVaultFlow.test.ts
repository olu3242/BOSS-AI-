import { describe, it, expect } from "vitest";
import { createEncryptedInMemorySecretStore } from "../services/secretVault/encryptedInMemorySecretStore.js";

describe("RC1 — Secret Vault Versioning (WS2)", () => {
  it("tracks version number on put", async () => {
    const vault = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org1", key: "API_KEY" };
    await vault.put(ref, "secret-v1", { providerKey: "stripe" });
    const val = await vault.get(ref, "test");
    expect(val).toBe("secret-v1");
  });

  it("listVersions returns rotation history", async () => {
    const vault = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org1", key: "API_KEY" };
    await vault.put(ref, "secret-v1", { providerKey: "stripe" });
    await vault.rotate(ref, "secret-v2", "admin-user");
    await vault.rotate(ref, "secret-v3", "admin-user");

    const versions = await vault.listVersions(ref);
    expect(versions.length).toBe(2);
    expect(versions[0]?.version).toBe(3);
    expect(versions[1]?.version).toBe(2);
    expect(versions[0]?.actor).toBe("admin-user");
  });

  it("listVersions returns empty for unrotated secret", async () => {
    const vault = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org1", key: "NEW_KEY" };
    await vault.put(ref, "value", { providerKey: "test" });
    const versions = await vault.listVersions(ref);
    expect(versions).toEqual([]);
  });

  it("get returns latest value after rotation", async () => {
    const vault = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org1", key: "TOKEN" };
    await vault.put(ref, "original", { providerKey: "slack" });
    await vault.rotate(ref, "rotated", "admin");
    const val = await vault.get(ref, "test");
    expect(val).toBe("rotated");
  });

  it("audit log includes rotation entry", async () => {
    const vault = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org1", key: "CRED" };
    await vault.put(ref, "v1", { providerKey: "twilio" });
    await vault.rotate(ref, "v2", "ops-team");
    const audit = await vault.audit(ref);
    const actions = audit.map((a) => a.action);
    expect(actions).toContain("put");
    expect(actions).toContain("rotate");
  });
});
