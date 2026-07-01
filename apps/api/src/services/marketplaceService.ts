import type { RepositoryContainer } from "../container.js";

export interface PackCatalogEntry {
  key: string;
  name: string;
  description: string;
  version: string;
  category: "field_service" | "healthcare" | "food_service" | "retail" | "professional_services" | "general";
  industries: string[];
  kpiCount: number;
  workflowCount: number;
  aiEmployeeCount: number;
  decisionCount: number;
  constraintCount: number;
  playbookCount: number;
  featured: boolean;
  comingSoon: boolean;
}

export interface InstalledPack {
  packKey: string;
  orgId: string;
  installedAt: string;
  version: string;
}

export interface MarketplaceService {
  listCatalog(): PackCatalogEntry[];
  searchCatalog(query: string, category?: string): PackCatalogEntry[];
  getPackDetail(packKey: string): PackCatalogEntry | null;
  listInstalled(orgId: string): Promise<InstalledPack[]>;
  installPack(orgId: string, packKey: string): Promise<InstalledPack>;
  uninstallPack(orgId: string, packKey: string): Promise<void>;
}

const PACK_CATALOG: PackCatalogEntry[] = [
  {
    key: "general_smb",
    name: "General Small Business",
    description: "Universal KPIs, workflows, and AI employees that apply to any small business. Included with every BOSS account.",
    version: "1.0.0",
    category: "general",
    industries: ["general_smb", "consulting", "services", "b2b"],
    kpiCount: 12,
    workflowCount: 8,
    aiEmployeeCount: 5,
    decisionCount: 6,
    constraintCount: 4,
    playbookCount: 3,
    featured: true,
    comingSoon: false,
  },
  {
    key: "home_services",
    name: "Home Services",
    description: "End-to-end lead-to-cash lifecycle for HVAC, plumbing, electrical, garage door, and appliance repair businesses.",
    version: "0.1.0",
    category: "field_service",
    industries: ["hvac", "plumbing", "electrical", "garage_door", "appliance_repair", "home_services"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 7,
    constraintCount: 6,
    playbookCount: 4,
    featured: true,
    comingSoon: false,
  },
  {
    key: "dental",
    name: "Dental Practice",
    description: "Complete patient journey from intake to recall for dental practices. Covers chair utilization, case acceptance, collections, and hygiene.",
    version: "0.1.0",
    category: "healthcare",
    industries: ["dental", "dentistry", "dental_practice", "orthodontics", "oral_surgery", "periodontics"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 6,
    playbookCount: 4,
    featured: true,
    comingSoon: false,
  },
  {
    key: "restaurant",
    name: "Restaurant",
    description: "Full service cycle for restaurants: reservations to close, prime cost management, table turns, and reputation.",
    version: "0.1.0",
    category: "food_service",
    industries: ["restaurant", "casual_dining", "fine_dining", "fast_casual", "bar_and_grill", "cafe", "food_truck"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: true,
    comingSoon: false,
  },
  {
    key: "retail",
    name: "Retail",
    description: "Buy-sell-replenish cycle for retail stores: gross margin, inventory turns, conversion rate, shrinkage, and customer loyalty.",
    version: "0.1.0",
    category: "retail",
    industries: ["retail", "specialty_retail", "fashion_retail", "grocery", "convenience_store", "sporting_goods", "home_goods"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: true,
    comingSoon: false,
  },
  {
    key: "legal",
    name: "Law Firm",
    description: "Matter lifecycle management, billable hour tracking, and client development workflows for small law firms.",
    version: "0.1.0",
    category: "professional_services",
    industries: ["legal", "law_firm", "legal_services", "family_law", "personal_injury", "corporate_law"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 10,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
  {
    key: "accounting",
    name: "Accounting & Bookkeeping",
    description: "Engagement lifecycle, billing efficiency, and client retention workflows for accounting and bookkeeping practices.",
    version: "0.1.0",
    category: "professional_services",
    industries: ["accounting", "bookkeeping", "cpa", "tax_preparation", "payroll_services", "advisory"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 9,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
  {
    key: "landscaping",
    name: "Landscaping & Lawn Care",
    description: "Estimate-to-invoice lifecycle for landscaping, lawn care, tree service, and irrigation businesses.",
    version: "0.1.0",
    category: "field_service",
    industries: ["landscaping", "lawn_care", "tree_service", "irrigation", "snow_removal", "hardscaping"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
  {
    key: "coffee_shop",
    name: "Coffee Shop & Café",
    description: "Full operations for coffee shops and cafés: from morning open to daily close, loyalty, and waste management.",
    version: "0.1.0",
    category: "food_service",
    industries: ["coffee_shop", "cafe", "espresso_bar", "drive_thru_coffee", "bakery_cafe", "tea_house"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
  {
    key: "cleaning",
    name: "Cleaning & Janitorial",
    description: "Client-to-invoice lifecycle for residential and commercial cleaning businesses: scheduling, quality, and retention.",
    version: "0.1.0",
    category: "field_service",
    industries: ["cleaning", "janitorial", "maid_service", "commercial_cleaning", "carpet_cleaning", "window_cleaning", "pressure_washing"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
  {
    key: "home_care",
    name: "Home Care & Senior Care",
    description: "Intake-to-billing lifecycle for non-medical home care businesses: caregiver matching, visit management, and retention.",
    version: "0.1.0",
    category: "healthcare",
    industries: ["home_care", "senior_care", "in_home_care", "companion_care", "personal_care", "respite_care"],
    kpiCount: 10,
    workflowCount: 11,
    aiEmployeeCount: 6,
    decisionCount: 8,
    constraintCount: 7,
    playbookCount: 4,
    featured: false,
    comingSoon: false,
  },
];

export function createMarketplaceService(repos: RepositoryContainer): MarketplaceService {
  return {
    listCatalog() {
      return PACK_CATALOG;
    },

    searchCatalog(query: string, category?: string) {
      const q = query.toLowerCase();
      return PACK_CATALOG.filter((pack) => {
        const matchesQuery =
          !q ||
          pack.name.toLowerCase().includes(q) ||
          pack.description.toLowerCase().includes(q) ||
          pack.industries.some((i) => i.includes(q));
        const matchesCategory = !category || pack.category === category;
        return matchesQuery && matchesCategory;
      });
    },

    getPackDetail(packKey: string) {
      return PACK_CATALOG.find((p) => p.key === packKey) ?? null;
    },

    async listInstalled(orgId: string) {
      const events = await repos.eventLog.listByType("marketplace.pack.installed", 100);
      return events
        .filter((e) => (e.payload as { orgId?: string }).orgId === orgId)
        .map((e) => {
          const payload = e.payload as { orgId: string; packKey: string; version: string };
          return {
            packKey: payload.packKey,
            orgId: payload.orgId,
            installedAt: e.occurredAt,
            version: payload.version,
          };
        });
    },

    async installPack(orgId: string, packKey: string) {
      const pack = PACK_CATALOG.find((p) => p.key === packKey);
      if (!pack) {
        throw new Error(`Unknown pack: ${packKey}`);
      }
      if (pack.comingSoon) {
        throw new Error(`Pack '${packKey}' is not yet available`);
      }

      // Check if already installed
      const installed = await this.listInstalled(orgId);
      const alreadyInstalled = installed.find((i) => i.packKey === packKey);
      if (alreadyInstalled) {
        return alreadyInstalled;
      }

      const installedAt = new Date().toISOString();

      await repos.eventBus.publish({
        type: "marketplace.pack.installed",
        payload: { orgId, packKey, version: pack.version },
        occurredAt: installedAt,
      });

      return { packKey, orgId, installedAt, version: pack.version };
    },

    async uninstallPack(orgId: string, packKey: string) {
      await repos.eventBus.publish({
        type: "marketplace.pack.uninstalled",
        payload: { orgId, packKey },
        occurredAt: new Date().toISOString(),
      });
    },
  };
}
