import { describe, it, expect } from "vitest";
import { createGoogleCalendarAdapter } from "../services/providerAdapters/googleCalendarAdapter.js";
import { createQuickBooksAdapter } from "../services/providerAdapters/quickbooksAdapter.js";

const MOCK_TOOL = { toolKey: "tool_schedule_appointment", providerKey: "google_calendar", capabilityKey: "schedule_appointment", resolvedInput: {} };
const MOCK_CREDENTIAL = { secretRef: "TEST_TOKEN", value: "Bearer test-oauth-token" };

describe("RC1 — Provider Adapters", () => {
  describe("Google Calendar Adapter", () => {
    it("calls the Google Calendar API with correct parameters", async () => {
      let capturedUrl = "";
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedBody = JSON.parse(init?.body as string ?? "{}") as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "evt123", htmlLink: "https://calendar.google.com/event?id=evt123" }), { status: 200 });
      };

      const adapter = createGoogleCalendarAdapter(mockFetch as typeof fetch);
      const result = await adapter.execute(MOCK_TOOL as never, {
        title: "Q1 Review",
        startTime: "2026-07-01T09:00:00Z",
        endTime: "2026-07-01T10:00:00Z",
        attendees: ["alice@example.com"],
      }, MOCK_CREDENTIAL);

      expect(result.status).toBe("succeeded");
      expect(capturedUrl).toContain("googleapis.com/calendar/v3/calendars/primary/events");
      expect((capturedBody as { summary: string }).summary).toBe("Q1 Review");
      expect(result.output?.eventId).toBe("evt123");
    });

    it("returns AUTH_FAILED on 401", async () => {
      const mockFetch = async () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const adapter = createGoogleCalendarAdapter(mockFetch as typeof fetch);
      const result = await adapter.execute(MOCK_TOOL as never, { title: "Test" }, MOCK_CREDENTIAL);
      expect(result.status).toBe("failed");
      expect(result.errorCode).toBe("AUTH_FAILED");
    });

    it("returns NETWORK_ERROR on fetch throw", async () => {
      const mockFetch = async () => { throw new Error("Network unreachable"); };
      const adapter = createGoogleCalendarAdapter(mockFetch as typeof fetch);
      const result = await adapter.execute(MOCK_TOOL as never, {}, MOCK_CREDENTIAL);
      expect(result.status).toBe("failed");
      expect(result.errorCode).toBe("NETWORK_ERROR");
    });
  });

  describe("QuickBooks Adapter", () => {
    const QB_TOOL = { toolKey: "tool_create_invoice", providerKey: "quickbooks", capabilityKey: "create_invoice", resolvedInput: {} };

    it("calls the QuickBooks API with correct invoice body", async () => {
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string ?? "{}") as Record<string, unknown>;
        return new Response(JSON.stringify({ Invoice: { Id: "INV-001", DocNumber: "1001", TotalAmt: 250 } }), { status: 200 });
      };

      const adapter = createQuickBooksAdapter(mockFetch as typeof fetch);
      const result = await adapter.execute(QB_TOOL as never, {
        realmId: "company123",
        customerId: "cust456",
        lineItems: [{ description: "Consulting services", amount: 250 }],
      }, MOCK_CREDENTIAL);

      expect(result.status).toBe("succeeded");
      expect(result.output?.invoiceId).toBe("INV-001");
      expect(result.output?.totalAmt).toBe(250);
      const invoice = (capturedBody as { Invoice: { CustomerRef: { value: string } } }).Invoice;
      expect(invoice.CustomerRef.value).toBe("cust456");
    });

    it("returns INVALID_INPUT when realmId is missing", async () => {
      const adapter = createQuickBooksAdapter(fetch);
      const result = await adapter.execute(QB_TOOL as never, { customerId: "cust1", lineItems: [] }, MOCK_CREDENTIAL);
      expect(result.status).toBe("failed");
      expect(result.errorCode).toBe("INVALID_INPUT");
    });

    it("returns AUTH_FAILED on 403", async () => {
      const mockFetch = async () => new Response(JSON.stringify({}), { status: 403 });
      const adapter = createQuickBooksAdapter(mockFetch as typeof fetch);
      const result = await adapter.execute(QB_TOOL as never, { realmId: "r1", customerId: "c1", lineItems: [] }, MOCK_CREDENTIAL);
      expect(result.status).toBe("failed");
      expect(result.errorCode).toBe("AUTH_FAILED");
    });
  });
});
