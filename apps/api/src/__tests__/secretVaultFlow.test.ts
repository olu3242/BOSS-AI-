import { describe, expect, it } from "vitest";
import { createEnvSecretStore } from "../services/secretVault/envSecretStore.js";
import { createEncryptedInMemorySecretStore } from "../services/secretVault/encryptedInMemorySecretStore.js";

describe("EnvSecretStore", () => {
  it("returns env var value via get and records audit entry", async () => {
    process.env["TEST_SECRET_KEY"] = "my-secret-value";
    const store = createEnvSecretStore();
    const ref = { orgId: "org-1", key: "TEST_SECRET_KEY" };
    const value = await store.get(ref, "test-actor");
    expect(value).toBe("my-secret-value");
    const audit = await store.audit(ref);
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe("get");
    expect(audit[0]?.actor).toBe("test-actor");
    delete process.env["TEST_SECRET_KEY"];
  });

  it("returns null when env var is not set", async () => {
    const store = createEnvSecretStore();
    const value = await store.get({ orgId: "org-1", key: "NONEXISTENT_KEY_ABC" }, "actor");
    expect(value).toBeNull();
  });

  it("throws on put/rotate/delete (read-only store)", async () => {
    const store = createEnvSecretStore();
    const ref = { orgId: "org-1", key: "X" };
    await expect(store.put(ref, "v", { providerKey: "twilio" })).rejects.toThrow("read-only");
    await expect(store.rotate(ref, "v", "actor")).rejects.toThrow("read-only");
    await expect(store.delete(ref, "actor")).rejects.toThrow("read-only");
  });
});

describe("EncryptedInMemorySecretStore", () => {
  it("encrypts, stores, and decrypts a secret", async () => {
    const store = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org-a", key: "PROVIDER_KEY" };
    await store.put(ref, "super-secret-token", { providerKey: "slack" });
    const value = await store.get(ref, "actor");
    expect(value).toBe("super-secret-token");
  });

  it("enforces tenant isolation (same key, different orgId returns null)", async () => {
    const store = createEncryptedInMemorySecretStore();
    await store.put({ orgId: "org-a", key: "SAME_KEY" }, "tenant-a-secret", { providerKey: "twilio" });
    const value = await store.get({ orgId: "org-b", key: "SAME_KEY" }, "actor");
    expect(value).toBeNull();
  });

  it("supports rotate — new value is returned after rotation", async () => {
    const store = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org-a", key: "ROTATABLE_KEY" };
    await store.put(ref, "old-value", { providerKey: "gmail" });
    await store.rotate(ref, "new-value", "admin");
    const value = await store.get(ref, "actor");
    expect(value).toBe("new-value");
  });

  it("deletes a secret so get returns null", async () => {
    const store = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org-a", key: "DELETE_ME" };
    await store.put(ref, "will-be-deleted", { providerKey: "slack" });
    await store.delete(ref, "admin");
    const value = await store.get(ref, "actor");
    expect(value).toBeNull();
  });

  it("records a full audit trail for all operations", async () => {
    const store = createEncryptedInMemorySecretStore();
    const ref = { orgId: "org-a", key: "AUDITED_KEY" };
    await store.put(ref, "v1", { providerKey: "twilio" });
    await store.get(ref, "service");
    await store.rotate(ref, "v2", "ops");
    const trail = await store.audit(ref);
    expect(trail.map((e) => e.action)).toEqual(["put", "get", "rotate"]);
  });

  it("throws rotate on a key that does not exist", async () => {
    const store = createEncryptedInMemorySecretStore();
    await expect(store.rotate({ orgId: "org-x", key: "MISSING" }, "v", "actor")).rejects.toThrow("not found");
  });
});
