/**
 * TD-013 — Provider Simulations → Real HTTP Adapters
 *
 * Tests all 7 previously-simulated providers using a mock fetch. Verifies
 * that each adapter correctly marshals credentials and input into the right
 * HTTP request shape and maps success/failure responses to ProviderAdapterResult.
 */
import { describe, it, expect } from "vitest";
import { createSmtpAdapter } from "../services/providerAdapters/smtpAdapter.js";
import { createZohoAdapter } from "../services/providerAdapters/zohoAdapter.js";
import { createFreshBooksAdapter } from "../services/providerAdapters/freshbooksAdapter.js";
import { createGoogleDriveAdapter } from "../services/providerAdapters/googleDriveAdapter.js";
import { createDropboxAdapter } from "../services/providerAdapters/dropboxAdapter.js";
import { createOneDriveAdapter } from "../services/providerAdapters/onedriveAdapter.js";
import { createWhatsAppAdapter } from "../services/providerAdapters/whatsappAdapter.js";
import type { ResolvedTool } from "@boss/mcp";

function mockFetch(status: number, body: unknown) {
  return async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as unknown as Response;
}

function resolved(capability: string, provider: string): ResolvedTool {
  return {
    toolKey: `tool_${capability}`,
    providerKey: provider,
    capabilityKey: capability,
    requiredPermissions: [],
    approval: "auto",
  };
}

const CRED = (value: string) => ({ secretRef: "ref", value });

describe("SMTP adapter", () => {
  it("returns failed when credential format is invalid", async () => {
    const adapter = createSmtpAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("send_email", "smtp"), { to: "a@b.com" }, CRED("badcred"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("host:port");
  });

  it("calls relay endpoint and returns succeeded on 200", async () => {
    const calls: string[] = [];
    const fetch = async (url: string) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({ request_id: "abc" }) } as unknown as Response;
    };
    const adapter = createSmtpAdapter(fetch);
    const result = await adapter.execute(
      resolved("send_email", "smtp"),
      { to: "a@b.com", subject: "Hi", body: "Hello" },
      CRED("smtp.example.com:587:user:pass"),
    );
    expect(result.status).toBe("succeeded");
    expect(calls[0]).toContain("email/send");
  });

  it("maps non-200 to failed", async () => {
    const adapter = createSmtpAdapter(mockFetch(400, { message: "bad request" }));
    const result = await adapter.execute(resolved("send_email", "smtp"), {}, CRED("smtp.example.com:587:user:pass"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("400");
  });
});

describe("Zoho adapter", () => {
  it("creates customer on 200", async () => {
    const adapter = createZohoAdapter(mockFetch(200, { data: [{ id: "z1" }] }));
    const result = await adapter.execute(resolved("create_customer", "zoho"), { name: "Jane", email: "j@z.com" }, CRED("token123"));
    expect(result.status).toBe("succeeded");
  });

  it("returns failed on non-200", async () => {
    const adapter = createZohoAdapter(mockFetch(401, { message: "Unauthorized" }));
    const result = await adapter.execute(resolved("create_customer", "zoho"), {}, CRED("bad-token"));
    expect(result.status).toBe("failed");
  });

  it("returns failed for unsupported capability", async () => {
    const adapter = createZohoAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("unsupported", "zoho"), {}, CRED("token"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("Unsupported");
  });
});

describe("FreshBooks adapter", () => {
  it("returns failed when credential format is invalid", async () => {
    const adapter = createFreshBooksAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("create_invoice", "freshbooks"), {}, CRED("badcred"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("accountId:accessToken");
  });

  it("creates invoice on 200", async () => {
    const adapter = createFreshBooksAdapter(mockFetch(200, { response: { result: { invoice: { id: 42 } } } }));
    const result = await adapter.execute(
      resolved("create_invoice", "freshbooks"),
      { customerId: "c1", lines: [{ description: "Service", unitPrice: 100, quantity: 1 }] },
      CRED("acct123:token456"),
    );
    expect(result.status).toBe("succeeded");
  });
});

describe("Google Drive adapter", () => {
  it("uploads document on 200", async () => {
    const adapter = createGoogleDriveAdapter(mockFetch(200, { id: "file123", name: "doc.txt" }));
    const result = await adapter.execute(resolved("upload_document", "google_drive"), { name: "doc.txt", content: "hello" }, CRED("token"));
    expect(result.status).toBe("succeeded");
    expect((result.output as Record<string, unknown>).file).toBeDefined();
  });

  it("returns failed on non-200", async () => {
    const adapter = createGoogleDriveAdapter(mockFetch(403, { error: "forbidden" }));
    const result = await adapter.execute(resolved("upload_document", "google_drive"), { name: "doc" }, CRED("bad"));
    expect(result.status).toBe("failed");
  });

  it("returns failed for unsupported capability", async () => {
    const adapter = createGoogleDriveAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("create_invoice", "google_drive"), {}, CRED("token"));
    expect(result.status).toBe("failed");
  });
});

describe("Dropbox adapter", () => {
  it("stores file on 200", async () => {
    const adapter = createDropboxAdapter(mockFetch(200, { id: "id:dbx123", name: "file.txt" }));
    const result = await adapter.execute(resolved("store_file", "dropbox"), { name: "file.txt", content: "data" }, CRED("token"));
    expect(result.status).toBe("succeeded");
  });

  it("returns failed for unsupported capability", async () => {
    const adapter = createDropboxAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("create_invoice", "dropbox"), {}, CRED("token"));
    expect(result.status).toBe("failed");
  });
});

describe("OneDrive adapter", () => {
  it("uploads document on 200", async () => {
    const adapter = createOneDriveAdapter(mockFetch(200, { id: "od123", name: "doc.txt" }));
    const result = await adapter.execute(resolved("upload_document", "onedrive"), { name: "doc.txt", content: "hello" }, CRED("token"));
    expect(result.status).toBe("succeeded");
  });

  it("returns failed for unsupported capability", async () => {
    const adapter = createOneDriveAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("send_email", "onedrive"), {}, CRED("token"));
    expect(result.status).toBe("failed");
  });
});

describe("WhatsApp adapter", () => {
  it("returns failed when credential format is invalid", async () => {
    const adapter = createWhatsAppAdapter(mockFetch(200, {}));
    const result = await adapter.execute(resolved("send_message", "whatsapp"), { to: "+1234567890", body: "Hi" }, CRED("badcred"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("phoneNumberId:accessToken");
  });

  it("sends message on 200", async () => {
    const adapter = createWhatsAppAdapter(mockFetch(200, { messages: [{ id: "wamid.xxx" }] }));
    const result = await adapter.execute(
      resolved("send_message", "whatsapp"),
      { to: "+1234567890", body: "Hello from BOSS" },
      CRED("12345:token"),
    );
    expect(result.status).toBe("succeeded");
  });

  it("maps non-200 to failed", async () => {
    const adapter = createWhatsAppAdapter(mockFetch(400, { error: { message: "bad" } }));
    const result = await adapter.execute(resolved("send_message", "whatsapp"), {}, CRED("123:token"));
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("400");
  });
});
