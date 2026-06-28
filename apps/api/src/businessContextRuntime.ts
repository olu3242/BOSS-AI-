import type {
  AgentContextProvider,
  ExecutionContext,
  ExecutionContextGuard,
} from "@boss/loop";
import type {
  ResolvedBusinessContext,
  QueryResult,
} from "@boss/types";
import type { BusinessContextService } from "./services/businessContextService.js";
import type {
  BusinessQueryService,
} from "./services/businessQueryService.js";

export class BusinessContextExecutionGuard implements ExecutionContextGuard {
  constructor(private readonly contexts: BusinessContextService) {}

  async assertReady(
    businessId: string,
    context: ExecutionContext,
  ): Promise<void> {
    const resolved = await this.resolve(businessId, context);
    if (resolved.status !== "published") {
      throw new Error(
        `Execution requires published Business Context; received ${resolved.status}.`,
      );
    }
  }

  async resolve(
    businessId: string,
    context: ExecutionContext,
  ): Promise<ResolvedBusinessContext> {
    const resolved = await this.contexts.getCurrent(context.orgId, businessId);
    if (!resolved) {
      throw new Error("Execution requires a canonical Business Context.");
    }
    if (resolved.orgId !== context.orgId) {
      throw new Error("Resolved Business Context does not match the execution tenant.");
    }
    return resolved;
  }
}

export class BusinessContextAgentProvider implements AgentContextProvider {
  constructor(private readonly guard: BusinessContextExecutionGuard) {}

  async retrieve(
    _agent: Parameters<AgentContextProvider["retrieve"]>[0],
    context: ExecutionContext,
  ): Promise<Readonly<Record<string, unknown>>> {
    if (!context.businessId) {
      throw new Error("Agent context retrieval requires a businessId.");
    }
    const resolved = await this.guard.resolve(context.businessId, context);
    return Object.freeze({ businessContext: resolved });
  }
}

export class BusinessQueryExecutionGuard implements ExecutionContextGuard {
  constructor(
    private readonly contextGuard: BusinessContextExecutionGuard,
    private readonly queries: BusinessQueryService,
  ) {}

  async assertReady(
    businessId: string,
    context: ExecutionContext,
  ): Promise<void> {
    const [businessContext, query] = await Promise.all([
      this.contextGuard.resolve(businessId, context),
      this.queries.execute({
        queryId: "execution_context",
        orgId: context.orgId,
        businessId,
        execution: context,
      }),
    ]);
    if (businessContext.status !== "published") {
      throw new Error("Execution requires published Business Context.");
    }
    if (query.view.lifecycle !== "active") {
      throw new Error("Execution requires active Business Query Context.");
    }
    if (
      query.execution.discoveryVersion !== businessContext.discoveryVersion
    ) {
      throw new Error(
        "Execution requires Business Query Context synchronized to Business Context.",
      );
    }
  }

  async resolve(
    businessId: string,
    context: ExecutionContext,
  ): Promise<{
    readonly businessContext: ResolvedBusinessContext;
    readonly businessQueryContext: QueryResult;
  }> {
    await this.assertReady(businessId, context);
    const [businessContext, businessQueryContext] = await Promise.all([
      this.contextGuard.resolve(businessId, context),
      this.queries.execute({
        queryId: "execution_context",
        orgId: context.orgId,
        businessId,
        execution: context,
      }),
    ]);
    return Object.freeze({
      businessContext,
      businessQueryContext,
    });
  }
}

export class BusinessQueryAgentProvider implements AgentContextProvider {
  constructor(private readonly guard: BusinessQueryExecutionGuard) {}

  async retrieve(
    _agent: Parameters<AgentContextProvider["retrieve"]>[0],
    context: ExecutionContext,
  ): Promise<Readonly<Record<string, unknown>>> {
    if (!context.businessId) {
      throw new Error(
        "Agent Business Query Context retrieval requires a businessId.",
      );
    }
    return this.guard.resolve(context.businessId, context);
  }
}

/** @deprecated Use BusinessQueryExecutionGuard. */
export class BusinessSemanticExecutionGuard extends BusinessQueryExecutionGuard {}

/** @deprecated Use BusinessQueryExecutionGuard. */
export class BusinessGraphExecutionGuard extends BusinessQueryExecutionGuard {}

/** @deprecated Use BusinessQueryAgentProvider. */
export class BusinessSemanticAgentProvider extends BusinessQueryAgentProvider {}

/** @deprecated Use BusinessQueryAgentProvider. */
export class BusinessGraphAgentProvider extends BusinessQueryAgentProvider {}
