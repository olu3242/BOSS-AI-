import { describe, expect, it, vi } from "vitest";
import { createServiceTitanAdapter } from "../services/providerAdapters/serviceTitanAdapter.js";
import { createJobberAdapter } from "../services/providerAdapters/jobberAdapter.js";
import { createOutlookCalendarAdapter } from "../services/providerAdapters/outlookCalendarAdapter.js";
import { createXeroAdapter } from "../services/providerAdapters/xeroAdapter.js";
import { createSalesforceAdapter } from "../services/providerAdapters/salesforceAdapter.js";
import { createHubSpotAdapter } from "../services/providerAdapters/hubspotAdapter.js";
import { createStripeAdapter } from "../services/providerAdapters/stripeAdapter.js";
import { createMailchimpAdapter } from "../services/providerAdapters/mailchimpAdapter.js";
import { createActiveCampaignAdapter } from "../services/providerAdapters/activeCampaignAdapter.js";
import type { ResolvedTool } from "@boss/mcp";

function makeResolved(toolKey: string, capabilityKey: string, providerKey: string): ResolvedTool {
  return { toolKey, capabilityKey, providerKey, requiredPermissions: [], approval: "auto" };
}

const bearerCred = { secretRef: "TOKEN", value: "Bearer test-token" };
const apiKeyCred = { secretRef: "API_KEY", value: "test-api-key" };

// ─── ServiceTitan ────────────────────────────────────────────────────────────

describe("ServiceTitanAdapter", () => {
  it("returns INVALID_INPUT when tenantId is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createServiceTitanAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "servicetitan"),
      {},
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded on 200 with job details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: 42, jobNumber: "JOB-001", status: "Scheduled" }),
    } as unknown as Response);
    const result = await createServiceTitanAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "servicetitan"),
      { tenantId: "123", customerId: 1, locationId: 2, jobTypeId: 3, businessUnitId: 4, scheduledStart: "2024-01-15T09:00:00Z", scheduledEnd: "2024-01-15T11:00:00Z" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.jobId).toBe(42);
    expect(result.output?.jobNumber).toBe("JOB-001");
  });

  it("returns AUTH_FAILED on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: "unauthorized" }),
    } as unknown as Response);
    const result = await createServiceTitanAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "servicetitan"),
      { tenantId: "123" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("AUTH_FAILED");
  });

  it("returns RATE_LIMITED on 429", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 429,
      json: async () => ({ error: "too_many_requests" }),
    } as unknown as Response);
    const result = await createServiceTitanAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "servicetitan"),
      { tenantId: "123" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("RATE_LIMITED");
  });
});

// ─── Jobber ──────────────────────────────────────────────────────────────────

describe("JobberAdapter", () => {
  it("returns INVALID_INPUT when clientId is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createJobberAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "jobber"),
      {},
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with job details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        data: {
          jobCreate: {
            job: { id: "job-abc", title: "Lawn Mowing", jobStatus: "ACTIVE" },
            userErrors: [],
          },
        },
      }),
    } as unknown as Response);
    const result = await createJobberAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "jobber"),
      { clientId: "client-1", title: "Lawn Mowing" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.jobId).toBe("job-abc");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("getjobber.com");
  });

  it("returns failed when GraphQL userErrors present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        data: {
          jobCreate: {
            job: null,
            userErrors: [{ message: "Client not found" }],
          },
        },
      }),
    } as unknown as Response);
    const result = await createJobberAdapter(mockFetch).execute(
      makeResolved("tool_create_job", "create_job", "jobber"),
      { clientId: "bad-id", title: "Test" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(result.errorMessage).toContain("Client not found");
  });
});

// ─── OutlookCalendar ─────────────────────────────────────────────────────────

describe("OutlookCalendarAdapter", () => {
  it("returns INVALID_INPUT when subject is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createOutlookCalendarAdapter(mockFetch).execute(
      makeResolved("tool_schedule_appointment", "schedule_appointment", "outlook_calendar"),
      { startDateTime: "2024-01-15T10:00:00", endDateTime: "2024-01-15T11:00:00" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with event details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ id: "event-123", webLink: "https://outlook.office.com/event-123" }),
    } as unknown as Response);
    const result = await createOutlookCalendarAdapter(mockFetch).execute(
      makeResolved("tool_schedule_appointment", "schedule_appointment", "outlook_calendar"),
      { subject: "Client Meeting", startDateTime: "2024-01-15T10:00:00", endDateTime: "2024-01-15T11:00:00" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.eventId).toBe("event-123");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("graph.microsoft.com");
  });

  it("returns AUTH_FAILED on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: { code: "InvalidAuthenticationToken" } }),
    } as unknown as Response);
    const result = await createOutlookCalendarAdapter(mockFetch).execute(
      makeResolved("tool_schedule_appointment", "schedule_appointment", "outlook_calendar"),
      { subject: "Meeting", startDateTime: "2024-01-15T10:00:00", endDateTime: "2024-01-15T11:00:00" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("AUTH_FAILED");
  });
});

// ─── Xero ────────────────────────────────────────────────────────────────────

describe("XeroAdapter", () => {
  it("returns INVALID_INPUT when tenantId is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createXeroAdapter(mockFetch).execute(
      makeResolved("tool_create_invoice", "create_invoice", "xero"),
      {},
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with invoice details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        Invoices: [{ InvoiceID: "inv-xyz", InvoiceNumber: "INV-001", Total: 500 }],
      }),
    } as unknown as Response);
    const result = await createXeroAdapter(mockFetch).execute(
      makeResolved("tool_create_invoice", "create_invoice", "xero"),
      { tenantId: "tenant-123", contactId: "contact-1", lineItems: [{ description: "Service", quantity: 1, unitAmount: 500 }] },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.invoiceId).toBe("inv-xyz");
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("xero.com");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Xero-tenant-id"]).toBe("tenant-123");
  });
});

// ─── Salesforce ──────────────────────────────────────────────────────────────

describe("SalesforceAdapter", () => {
  it("returns INVALID_INPUT when instanceUrl is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createSalesforceAdapter(mockFetch).execute(
      makeResolved("tool_create_opportunity", "create_opportunity", "salesforce"),
      { name: "Big Deal", closeDate: "2024-12-31" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with opportunity details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ id: "opp-123", success: true }),
    } as unknown as Response);
    const result = await createSalesforceAdapter(mockFetch).execute(
      makeResolved("tool_create_opportunity", "create_opportunity", "salesforce"),
      { instanceUrl: "https://myorg.salesforce.com", name: "Big Deal", accountId: "acc-1", closeDate: "2024-12-31" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.opportunityId).toBe("opp-123");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("salesforce.com");
  });
});

// ─── HubSpot ─────────────────────────────────────────────────────────────────

describe("HubSpotAdapter", () => {
  it("returns succeeded with contact details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ id: "ct-456", properties: { email: "user@example.com" } }),
    } as unknown as Response);
    const result = await createHubSpotAdapter(mockFetch).execute(
      makeResolved("tool_create_contact", "create_contact", "hubspot"),
      { email: "user@example.com", firstName: "Jane", lastName: "Doe" },
      bearerCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.contactId).toBe("ct-456");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("hubapi.com");
  });

  it("returns AUTH_FAILED on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ status: "UNAUTHORIZED" }),
    } as unknown as Response);
    const result = await createHubSpotAdapter(mockFetch).execute(
      makeResolved("tool_create_contact", "create_contact", "hubspot"),
      { email: "user@example.com" },
      bearerCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("AUTH_FAILED");
  });
});

// ─── Stripe ──────────────────────────────────────────────────────────────────

describe("StripeAdapter", () => {
  it("returns INVALID_INPUT when amount is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createStripeAdapter(mockFetch).execute(
      makeResolved("tool_create_payment_intent", "create_payment_intent", "stripe"),
      {},
      apiKeyCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with payment intent details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: "pi_123", status: "requires_payment_method", client_secret: "pi_123_secret" }),
    } as unknown as Response);
    const result = await createStripeAdapter(mockFetch).execute(
      makeResolved("tool_create_payment_intent", "create_payment_intent", "stripe"),
      { amount: 5000, currency: "usd" },
      apiKeyCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.paymentIntentId).toBe("pi_123");
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("stripe.com");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Content-Type"]).toContain("application/x-www-form-urlencoded");
  });

  it("returns PAYMENT_DECLINED on 402", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 402,
      json: async () => ({ error: { code: "card_declined" } }),
    } as unknown as Response);
    const result = await createStripeAdapter(mockFetch).execute(
      makeResolved("tool_create_payment_intent", "create_payment_intent", "stripe"),
      { amount: 5000 },
      apiKeyCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("PAYMENT_DECLINED");
  });
});

// ─── Mailchimp ───────────────────────────────────────────────────────────────

describe("MailchimpAdapter", () => {
  it("returns INVALID_INPUT when serverPrefix is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createMailchimpAdapter(mockFetch).execute(
      makeResolved("tool_add_subscriber", "add_subscriber", "mailchimp"),
      { listId: "abc", email: "user@example.com" },
      apiKeyCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with subscriber details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: "sub-hash", email_address: "user@example.com", status: "subscribed" }),
    } as unknown as Response);
    const result = await createMailchimpAdapter(mockFetch).execute(
      makeResolved("tool_add_subscriber", "add_subscriber", "mailchimp"),
      { serverPrefix: "us6", listId: "list-1", email: "user@example.com", firstName: "Jane" },
      apiKeyCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.subscriberId).toBe("sub-hash");
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("mailchimp.com");
  });
});

// ─── ActiveCampaign ──────────────────────────────────────────────────────────

describe("ActiveCampaignAdapter", () => {
  it("returns INVALID_INPUT when apiUrl is missing", async () => {
    const mockFetch = vi.fn();
    const result = await createActiveCampaignAdapter(mockFetch).execute(
      makeResolved("tool_create_contact", "create_contact", "activecampaign"),
      { email: "user@example.com" },
      apiKeyCred
    );
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("INVALID_INPUT");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns succeeded with contact details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ contact: { id: "1234", email: "user@example.com" } }),
    } as unknown as Response);
    const result = await createActiveCampaignAdapter(mockFetch).execute(
      makeResolved("tool_create_contact", "create_contact", "activecampaign"),
      { apiUrl: "https://myaccount.api-us1.com", email: "user@example.com", firstName: "Jane" },
      apiKeyCred
    );
    expect(result.status).toBe("succeeded");
    expect(result.output?.contactId).toBe("1234");
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain("api-us1.com");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Api-Token"]).toBe("test-api-key");
  });
});
