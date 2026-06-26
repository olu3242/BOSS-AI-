/**
 * Core Business Capability Pack (general-smb).
 * Reusable capabilities, constraints, KPIs, workflows, AI employees and
 * prompts for any local small business — installed into the shared
 * @boss/registries layer. Nothing here is industry-specific; vertical
 * packs (dental, legal, etc.) layer on top of this one.
 */
import { seedCapabilities } from "./data/capabilities.js";
import { seedConstraints } from "./data/constraints.js";
import { seedKpis } from "./data/kpis.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedPrompts } from "./data/prompts.js";

export const GENERAL_SMB_PACK_VERSION = "0.1.0";

export function installGeneralSmbPack(): void {
  seedCapabilities();
  seedConstraints();
  seedKpis();
  seedAiEmployees();
  seedWorkflows();
  seedPrompts();
}

export {
  seedCapabilities,
  seedConstraints,
  seedKpis,
  seedAiEmployees,
  seedWorkflows,
  seedPrompts,
};
