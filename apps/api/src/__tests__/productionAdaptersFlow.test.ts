import { describe, expect, it, vi } from "vitest";
import { createGmailAdapter } from "../services/providerAdapters/gmailAdapter.js";
import { createSlackAdapter } from "../services/providerAdapters/slackAdapter.js";
import { createMicrosoft365Adapter } from "../services/providerAdapters/microsoft365Adapter.js";
import { createTeamsAdapter } from "../services/providerAdapters/teamsAdapter.js";
import { createMessageBirdAdapter } from "../services/providerAdapters/messagebirdAdapter.js";
import type { ResolvedTool } from "@boss/mcp";


function makeResolved(toolKey: string, capabilityKey: string, providerKey: string): ResolvedTool {
  return { toolKey, capabilityKey, providerKey, requiredPermissions: [], approval: "auto" };
}

const bearerCred = { secretRef: "TOKEN", value: "Bearer test-token" };

describe("GmailAdapter", () => {
  it("returns succeeded on 200 response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: "msg-123", threadId: "thread-1" }),
    } as unknown as Response);
    const adapter = createGmailAdapter(mockFetch);
    const result = await adapter.execute(
      makeResolved("tool_send_email", "send_email", "gmail"),
      { to: "user@example.com", subject: "Hi", body: "Hello" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.errorCode).toBeNull();
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("gmail.googleapis.com");
  });

  it("returns AUTH_FAILED on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: "invalid_token" }),
    } as unknown as Response);
    const result = await createGmailAdapter(mockFetch).execute(
      makeResolved("tool_send_email", "send_email", "gmail"), {}, bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("AUTH_FAILED");
  });
});

describe("SlackAdapter", () => {
  it("returns succeeded when ok: true", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ ok: true, ts: "1234.5678" }),
    } as unknown as Response);
    const result = await createSlackAdapter(mockFetch).execute(
      makeResolved("tool_send_message", "send_message", "slack"),
      { channel: "#general", text: "Hello world" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
  });

  it("maps Slack ok:false + token_revoked to AUTH_FAILED", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ ok: false, error: "token_revoked" }),
    } as unknown as Response);
    const result = await createSlackAdapter(mockFetch).execute(
      makeResolved("tool_send_message", "send_message", "slack"), {}, bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("AUTH_FAILED");
  });
});

describe("Microsoft365Adapter", () => {
  it("returns succeeded on 202 Accepted", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 202,
      json: async () => ({}),
    } as unknown as Response);
    const result = await createMicrosoft365Adapter(mockFetch).execute(
      makeResolved("tool_send_email", "send_email", "microsoft365"),
      { to: "user@example.com", subject: "Hello", body: "World" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("graph.microsoft.com");
  });
});

describe("TeamsAdapter", () => {
  it("returns INVALID_INPUT when neither teamId+channelId nor chatId is provided", async () => {
    const mockFetch = vi.fn();
    const result = await createTeamsAdapter(mockFetch).execute(
      makeResolved("tool_send_message", "send_message", "teams"),
      { text: "Hello" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends to chatId endpoint when chatId is provided in input", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ id: "msg-abc" }),
    } as unknown as Response);
    const result = await createTeamsAdapter(mockFetch).execute(
      makeResolved("tool_send_message", "send_message", "teams"),
      { chatId: "chat-id-123", text: "Hello" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("chats/chat-id-123/messages");
  });
});

describe("MessageBirdAdapter", () => {
  it("returns succeeded on 201", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ id: "mb-123" }),
    } as unknown as Response);
    const result = await createMessageBirdAdapter(mockFetch).execute(
      makeResolved("tool_send_sms", "send_sms", "messagebird"),
      { to: "+1234567890", from: "BOSS", body: "Hello" },
      { secretRef: "MB_API_KEY", value: "test-api-key" }
    );
    expect(result.status).toBe("succeeded");
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("messagebird.com");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toContain("AccessKey");
  });

  it("returns INVALID_INPUT on 422", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ errors: [{ description: "Invalid recipient" }] }),
    } as unknown as Response);
    const result = await createMessageBirdAdapter(mockFetch).execute(
      makeResolved("tool_send_sms", "send_sms", "messagebird"),
      { to: "invalid", from: "BOSS", body: "Hi" },
      { secretRef: "MB_API_KEY", value: "test-api-key" }
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
  });
});
