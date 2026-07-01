import { triggerRegistry } from "@boss/registries";
import type { TriggerEntry } from "@boss/registries";
import { workflows } from "./workflows.js";

const triggerSources = [
  {
    id: "manual",
    displayName: "Manual",
    description: "A user or approved caller requests workflow execution.",
  },
  {
    id: "event",
    displayName: "Event",
    description: "A registered event requests workflow execution.",
  },
  {
    id: "schedule",
    displayName: "Schedule",
    description: "A declared schedule requests workflow execution.",
  },
] as const;

export const triggers: readonly TriggerEntry[] = Object.freeze(
  triggerSources.map((source): TriggerEntry => ({
    id: source.id,
    displayName: source.displayName,
    key: source.id,
    label: source.displayName,
    description: source.description,
    workflowIds: workflows
      .filter((workflow) => workflow.triggerType === source.id)
      .map((workflow) => workflow.id),
    eventIds: [],
    owner: "Automation",
    version: "1.0.0",
    status: "active",
    documentation: "industry-packs/general-smb/src/data/triggers.ts",
  })),
);

export function seedTriggers(): void {
  for (const trigger of triggers) {
    triggerRegistry.register(trigger);
  }
}
