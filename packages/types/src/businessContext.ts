import type { ID } from "./primitives.js";

export type BusinessDiscoveryStatus =
  | "draft"
  | "in_progress"
  | "validated"
  | "published"
  | "archived";

export interface BusinessContextMetadata {
  readonly source?: string;
  readonly confidence?: number;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface DiscoveryOrganizationProfile extends BusinessContextMetadata {
  readonly organizationId: ID;
  readonly displayName: string;
  readonly legalName?: string;
  readonly industry: string;
  readonly businessModel: string;
  readonly website?: string;
  readonly locations: readonly string[];
}

export interface DiscoveryCatalogItem extends BusinessContextMetadata {
  readonly id: ID;
  readonly name: string;
  readonly description?: string;
}

export interface DiscoveryRevenueStream extends DiscoveryCatalogItem {
  readonly model: string;
  readonly percentage?: number;
}

export interface DiscoveryDepartment extends DiscoveryCatalogItem {
  readonly owner?: string;
  readonly responsibilities: readonly string[];
}

export interface DiscoveryTeamStructure extends BusinessContextMetadata {
  readonly employeeCount: number;
  readonly leadershipRoles: readonly string[];
  readonly teams: readonly DiscoveryCatalogItem[];
}

export interface DiscoveryGoal extends BusinessContextMetadata {
  readonly id: ID;
  readonly title: string;
  readonly description: string;
  readonly status: "planned" | "active" | "achieved" | "paused";
  readonly targetDate?: string;
}

export interface DiscoveryChallenge extends BusinessContextMetadata {
  readonly id: ID;
  readonly title: string;
  readonly description: string;
  readonly status: "active" | "mitigated" | "resolved";
  readonly severity: "low" | "medium" | "high" | "critical";
}

export interface DiscoveryKpi extends BusinessContextMetadata {
  readonly id: ID;
  readonly name: string;
  readonly unit: string;
  readonly currentValue?: number;
  readonly targetValue?: number;
  readonly owner?: string;
}

export interface DiscoveryComplianceRequirement extends BusinessContextMetadata {
  readonly id: ID;
  readonly name: string;
  readonly jurisdiction?: string;
  readonly status: "unknown" | "not_applicable" | "required" | "compliant";
}

export interface CanonicalBusinessContextData {
  readonly organizationProfile: DiscoveryOrganizationProfile;
  readonly productsAndServices: readonly DiscoveryCatalogItem[];
  readonly customerSegments: readonly DiscoveryCatalogItem[];
  readonly revenueStreams: readonly DiscoveryRevenueStream[];
  readonly departments: readonly DiscoveryDepartment[];
  readonly teamStructure: DiscoveryTeamStructure;
  readonly goals: readonly DiscoveryGoal[];
  readonly challenges: readonly DiscoveryChallenge[];
  readonly kpis: readonly DiscoveryKpi[];
  readonly complianceRequirements: readonly DiscoveryComplianceRequirement[];
  readonly extensions: Readonly<Record<string, unknown>>;
}

export interface BusinessDiscoveryRecord {
  readonly id: ID;
  readonly orgId: ID;
  readonly businessId: ID;
  readonly status: BusinessDiscoveryStatus;
  readonly discoveryVersion: number;
  readonly lockVersion: number;
  readonly schemaVersion: string;
  readonly createdBy: ID;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BusinessContextSnapshot extends BusinessDiscoveryRecord {
  readonly context: CanonicalBusinessContextData;
  readonly versionCreatedBy: ID;
  readonly versionCreatedAt: string;
}

export interface BusinessDiscoveryHistoryEntry {
  readonly id: ID;
  readonly orgId: ID;
  readonly discoveryId: ID;
  readonly discoveryVersion: number;
  readonly action: "created" | "updated" | "transitioned";
  readonly previousStatus: BusinessDiscoveryStatus | null;
  readonly newStatus: BusinessDiscoveryStatus;
  readonly actorId: ID;
  readonly reason: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly occurredAt: string;
}

export interface ActiveConstraintSummary {
  readonly id: ID;
  readonly title: string;
  readonly priority: string;
}

export interface BusinessCapabilitySummary {
  readonly total: number;
  readonly byMaturity: Readonly<Record<string, number>>;
}

export interface ResolvedBusinessContext extends BusinessContextSnapshot {
  readonly activeGoals: readonly DiscoveryGoal[];
  readonly activeConstraints: readonly ActiveConstraintSummary[];
  readonly capabilitySummary: BusinessCapabilitySummary;
}
