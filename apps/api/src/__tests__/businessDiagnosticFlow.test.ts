import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@boss/events";
import { InMemoryRuntimeTelemetry } from "@boss/loop";
import { createApiFromContainer } from "../index.js";
import { createInMemoryContainer } from "../container.js";
import { createBusinessDiagnosticService } from "../services/businessDiagnosticService.js";

const ORG_ID = "66666666-6666-4666-8666-666666666666";

describe("business diagnostic engine", () => {
  it("persists an evidence-backed diagnostic without executing workflows", async () => {
    const repos = createInMemoryContainer();
    const api = createApiFromContainer(repos);
    const eventBus = new InMemoryEventBus();
    const telemetry = new InMemoryRuntimeTelemetry();
    const diagnostic = createBusinessDiagnosticService(
      repos,
      eventBus,
      telemetry,
    );
    const eventTypes: string[] = [];
    eventBus.subscribe("*", (event) => {
      eventTypes.push(event.type);
    });

    const { business } = await api.business.create({
      orgId: ORG_ID,
      name: "Lakeside Service Company",
      industry: "professional_services",
      employeeCount: 8,
      annualRevenue: 520000,
      businessType: "services",
      yearsOperating: 4,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
    });
    const mri = await api.businessMri.start(ORG_ID, business.id);
    for (const answer of [
      {
        sectionKey: "sales" as const,
        questionKey: "sales.follow_up_process",
        value: "manual",
      },
      {
        sectionKey: "operations" as const,
        questionKey: "operations.team_responsibilities",
        value: "undefined",
      },
      {
        sectionKey: "operations" as const,
        questionKey: "operations.scheduling",
        value: "spreadsheet",
      },
      {
        sectionKey: "technology" as const,
        questionKey: "technology.crm",
        value: false,
      },
      {
        sectionKey: "pain_points" as const,
        questionKey: "pain_points.challenges",
        value: ["missed_leads", "administrative_overload"],
      },
    ]) {
      await api.businessMri.answer(ORG_ID, mri.id, answer);
    }
    await api.businessMri.complete(ORG_ID, mri.id);
    const dna = await api.businessDna.generate(ORG_ID, business.id, mri.id);
    await api.businessHealth.generate(ORG_ID, business.id, mri.id);
    await api.businessCapability.evaluate(
      ORG_ID,
      business.id,
      mri.id,
      dna,
    );

    const context = {
      orgId: ORG_ID,
      actorId: "owner-1",
      requestId: "request-diagnostic",
      correlationId: "diagnostic-journey-1",
      traceId: "trace-diagnostic",
    };
    const report = await diagnostic.generate(
      ORG_ID,
      business.id,
      mri.id,
      context,
    );

    expect(report.areaScores).toHaveLength(12);
    expect(report.maturity).toHaveLength(9);
    expect(report.rootCauses.length).toBeGreaterThan(0);
    expect(report.opportunities.length).toBeGreaterThan(0);
    expect(
      report.areaScores.every(
        (area) =>
          area.evidence.length > 0 &&
          area.recommendedImprovement.length > 0 &&
          area.confidence > 0,
      ),
    ).toBe(true);
    expect(
      report.opportunities.every(
        (opportunity) => opportunity.evidence.length > 0,
      ),
    ).toBe(true);
    expect(await diagnostic.getLatest(ORG_ID, business.id)).toEqual(report);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        "business.diagnostic.started",
        "business.diagnostic.analysis.completed",
        "business.diagnostic.root_cause.identified",
        "business.diagnostic.completed",
      ]),
    );
    expect(telemetry.metrics().map((metric) => metric.name)).toEqual(
      expect.arrayContaining([
        "diagnostic.duration",
        "diagnostic.root_causes",
        "diagnostic.opportunities",
      ]),
    );

    const second = await diagnostic.generate(
      ORG_ID,
      business.id,
      mri.id,
      context,
    );
    expect(second.version).toBe(2);
    expect(await diagnostic.listVersions(ORG_ID, business.id)).toHaveLength(2);
  });

  it("fails closed when tenant context does not match", async () => {
    const diagnostic = createBusinessDiagnosticService(
      createInMemoryContainer(),
    );
    await expect(
      diagnostic.generate(
        ORG_ID,
        "business-id",
        "mri-id",
        {
          orgId: "different-org",
          actorId: "owner-1",
          requestId: "request-1",
          correlationId: "correlation-1",
          traceId: "trace-1",
        },
      ),
    ).rejects.toThrow("does not match");
  });
});
