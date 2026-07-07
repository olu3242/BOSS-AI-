/**
 * Business Objective Service — OKR layer for BOSS.
 *
 * Every recommendation and KPI maps to a Business Objective.
 * Objectives contain Key Results with target/current/confidence tracking.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import type { BusinessObjective, KeyResult, ObjectiveStatus, ObjectivePriority } from "@boss/types";
import { ApiError } from "../http/apiError.js";

export interface CreateObjectiveInput {
  title: string;
  description: string;
  priority?: ObjectivePriority;
  owner?: string;
  dueDate?: string;
  linkedKpis?: string[];
}

export interface CreateKeyResultInput {
  title: string;
  description?: string;
  kpiKey?: string;
  targetValue: number;
  unit: string;
  dueDate: string;
  owner?: string;
}

export interface UpdateObjectiveInput {
  title?: string;
  description?: string;
  status?: ObjectiveStatus;
  priority?: ObjectivePriority;
  owner?: string;
  dueDate?: string;
  linkedKpis?: string[];
}

export interface BusinessObjectiveService {
  create(orgId: string, businessId: string, input: CreateObjectiveInput): Promise<BusinessObjective>;
  getById(orgId: string, id: string): Promise<BusinessObjective>;
  list(orgId: string, businessId: string): Promise<BusinessObjective[]>;
  update(orgId: string, id: string, patch: UpdateObjectiveInput): Promise<BusinessObjective>;
  delete(orgId: string, id: string): Promise<void>;
  addKeyResult(orgId: string, objectiveId: string, input: CreateKeyResultInput): Promise<KeyResult>;
  updateKeyResult(orgId: string, krId: string, patch: Partial<Pick<KeyResult, "currentValue" | "confidence" | "completedAt">>): Promise<KeyResult>;
  linkRecommendation(orgId: string, objectiveId: string, recommendationId: string): Promise<void>;
  progress(orgId: string, businessId: string): Promise<Array<{ objective: BusinessObjective; progressPct: number }>>;
}

export function createBusinessObjectiveService(eventBus: EventBus): BusinessObjectiveService {
  const objectives = new Map<string, BusinessObjective>();
  const keyResults = new Map<string, KeyResult>();

  function computeProgress(obj: BusinessObjective): number {
    const krs = obj.keyResults;
    if (krs.length === 0) return 0;
    const total = krs.reduce((sum, kr) => {
      const pct = kr.targetValue > 0 ? Math.min(1, kr.currentValue / kr.targetValue) : 0;
      return sum + pct;
    }, 0);
    return Math.round((total / krs.length) * 100);
  }

  function getObj(orgId: string, id: string): BusinessObjective {
    const obj = objectives.get(id);
    if (!obj || obj.orgId !== orgId || obj.deletedAt) throw new ApiError(404, "not_found", "Objective not found");
    return obj;
  }

  return {
    async create(orgId, businessId, input) {
      const now = new Date().toISOString();
      const obj: BusinessObjective = {
        id: randomUUID(),
        orgId,
        businessId,
        title: input.title,
        description: input.description,
        status: "active",
        priority: input.priority ?? "medium",
        owner: input.owner ?? null,
        dueDate: input.dueDate ?? null,
        completedAt: null,
        progress: 0,
        confidence: 0.5,
        dependencies: [],
        linkedKpis: input.linkedKpis ?? [],
        linkedRecommendationIds: [],
        keyResults: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      objectives.set(obj.id, obj);

      await eventBus.publish(
        createBossEvent(
          "business.objective.created",
          { objectiveId: obj.id, businessId, title: obj.title },
          { orgId, businessId, actorId: "objective-service", requestId: obj.id, correlationId: obj.id, traceId: obj.id },
        ),
      );
      return obj;
    },

    async getById(orgId, id) {
      return getObj(orgId, id);
    },

    async list(orgId, businessId) {
      return [...objectives.values()].filter((o) => o.orgId === orgId && o.businessId === businessId && !o.deletedAt);
    },

    async update(orgId, id, patch) {
      const obj = getObj(orgId, id);
      const updated: BusinessObjective = {
        ...obj,
        ...patch,
        updatedAt: new Date().toISOString(),
        completedAt: patch.status === "achieved" ? new Date().toISOString() : obj.completedAt,
      };
      updated.progress = computeProgress(updated);
      objectives.set(id, updated);
      return updated;
    },

    async delete(orgId, id) {
      const obj = getObj(orgId, id);
      objectives.set(id, { ...obj, deletedAt: new Date().toISOString() });
    },

    async addKeyResult(orgId, objectiveId, input) {
      const obj = getObj(orgId, objectiveId);
      const now = new Date().toISOString();
      const kr: KeyResult = {
        id: randomUUID(),
        orgId,
        businessId: obj.businessId,
        objectiveId,
        title: input.title,
        description: input.description ?? null,
        kpiKey: input.kpiKey ?? null,
        targetValue: input.targetValue,
        currentValue: 0,
        unit: input.unit,
        confidence: 0.5,
        dueDate: input.dueDate,
        completedAt: null,
        owner: input.owner ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      keyResults.set(kr.id, kr);

      const updatedObj = { ...obj, keyResults: [...obj.keyResults, kr], updatedAt: now };
      updatedObj.progress = computeProgress(updatedObj);
      objectives.set(objectiveId, updatedObj);
      return kr;
    },

    async updateKeyResult(orgId, krId, patch) {
      const kr = keyResults.get(krId);
      if (!kr || kr.orgId !== orgId) throw new ApiError(404, "not_found", "Key result not found");
      const updated: KeyResult = { ...kr, ...patch, updatedAt: new Date().toISOString() };
      keyResults.set(krId, updated);

      // Sync back to parent objective
      const obj = objectives.get(kr.objectiveId);
      if (obj) {
        const updatedObj = {
          ...obj,
          keyResults: obj.keyResults.map((k) => k.id === krId ? updated : k),
          updatedAt: new Date().toISOString(),
        };
        updatedObj.progress = computeProgress(updatedObj);
        objectives.set(obj.id, updatedObj);
      }
      return updated;
    },

    async linkRecommendation(orgId, objectiveId, recommendationId) {
      const obj = getObj(orgId, objectiveId);
      if (!obj.linkedRecommendationIds.includes(recommendationId)) {
        objectives.set(objectiveId, {
          ...obj,
          linkedRecommendationIds: [...obj.linkedRecommendationIds, recommendationId],
          updatedAt: new Date().toISOString(),
        });
      }
    },

    async progress(orgId, businessId) {
      const objs = [...objectives.values()].filter((o) => o.orgId === orgId && o.businessId === businessId && !o.deletedAt);
      return objs.map((obj) => ({ objective: obj, progressPct: computeProgress(obj) }));
    },
  };
}
