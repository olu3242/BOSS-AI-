import type { Document, DocumentType, DocumentStatus } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface DocumentService {
  create(
    orgId: string,
    businessId: string,
    input: {
      title: string;
      documentType: DocumentType;
      status?: DocumentStatus;
      storagePath?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
      tags?: string[];
    },
    actorId: string,
  ): Promise<Document>;

  get(orgId: string, id: string): Promise<Document>;
  list(orgId: string, businessId: string): Promise<Document[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      title: string;
      documentType: DocumentType;
      status: DocumentStatus;
      storagePath: string | null;
      mimeType: string | null;
      sizeBytes: number | null;
      version: number;
      tags: string[];
    }>,
    actorId: string,
  ): Promise<Document>;

  delete(orgId: string, id: string, actorId: string): Promise<void>;
}

export function createDocumentService(repos: RepositoryContainer): DocumentService {
  return {
    async create(orgId, businessId, input, actorId) {
      const doc = await repos.documents.create({
        orgId,
        businessId,
        title: input.title,
        documentType: input.documentType,
        status: input.status ?? "draft",
        storagePath: input.storagePath ?? null,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        version: 1,
        tags: input.tags ?? [],
      });

      await repos.eventBus.publish(
        createBossEvent(
          "document.created",
          { documentId: doc.id, businessId, documentType: doc.documentType },
          { orgId, businessId, actorId, requestId: doc.id, correlationId: doc.id, traceId: doc.id },
        ),
      );

      return doc;
    },

    async get(orgId, id) {
      const doc = await repos.documents.findById(orgId, id);
      if (!doc) throw Object.assign(new Error(`Document ${id} not found`), { statusCode: 404 });
      return doc;
    },

    async list(orgId, businessId) {
      return repos.documents.listByBusinessId(orgId, businessId);
    },

    async update(orgId, id, patch, actorId) {
      const existing = await repos.documents.findById(orgId, id);
      if (!existing) throw Object.assign(new Error(`Document ${id} not found`), { statusCode: 404 });

      const updated = await repos.documents.update(orgId, id, patch);

      if (patch.status && patch.status !== existing.status) {
        await repos.eventBus.publish(
          createBossEvent(
            patch.status === "signed" ? "document.signed" : patch.status === "approved" ? "document.approved" : "document.updated",
            { documentId: id, status: patch.status },
            { orgId, businessId: existing.businessId, actorId, requestId: id, correlationId: id, traceId: id },
          ),
        );
      }

      return updated;
    },

    async delete(orgId, id, actorId) {
      const doc = await repos.documents.findById(orgId, id);
      if (!doc) throw Object.assign(new Error(`Document ${id} not found`), { statusCode: 404 });

      await repos.documents.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "document.deleted",
          { documentId: id },
          { orgId, businessId: doc.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },
  };
}
