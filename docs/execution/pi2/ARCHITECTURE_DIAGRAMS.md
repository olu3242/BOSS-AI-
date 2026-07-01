# PI-2 Architecture Diagrams

## Context

```mermaid
flowchart LR
  Owner[Business Owner] --> Web[MVP Journey]
  Web --> API[Application Services]
  API --> Outcome[Business Outcome Plans]
  Outcome --> MCP[MCP Intelligence]
  Outcome --> Registries[Existing Registries]
  API --> Runtime[Existing Loop Runtime]
  Runtime --> Systems[Business Systems]
  Runtime --> Metrics[KPIs and TTFBV]
```

## Capability Dependency Graph

```mermaid
flowchart LR
  Goal --> Definition[Business Outcome Definition]
  Definition --> Plan[Business Outcome Plan Version]
  Plan --> Workflow
  Plan --> Agent
  Plan --> AtomicCapability[Atomic Capability]
  Plan --> Automation
  Plan --> Policy
  Plan --> KPI
```

## Runtime Sequence

```mermaid
sequenceDiagram
  actor Owner
  participant API
  participant Resolver
  participant Registries
  participant DB
  participant Queue
  participant Loop
  Owner->>API: Approve plan version
  API->>DB: Persist approval
  API->>Resolver: Resolve approved version
  Resolver->>Registries: Validate IDs and versions
  Resolver-->>API: Execution command
  API->>Queue: Enqueue idempotently
  Queue->>Loop: Claim command
  Loop->>DB: Persist execution state
  Loop-->>API: Correlated result/event
```

## Registry Diagram

```mermaid
flowchart TB
  Definition -->|references| CapabilityRegistry
  Definition -->|references| WorkflowRegistry
  Definition -->|references| AgentRegistry
  Definition -->|references| AutomationRegistry
  Definition -->|references| EventRegistry
  Definition -->|references| PolicyRegistry
  Definition -->|references| KPIRegistry
  Plan -->|snapshots IDs + versions| Definition
```

## Event Flow

```mermaid
flowchart LR
  PlanService --> Created[business.capability.created]
  PlanService --> Approved[business.capability.approved]
  RuntimeAdapter --> Requested[business.capability.execution.requested]
  Loop --> Executed[business.capability.executed]
  Loop --> Failed[business.capability.failed]
  Executed --> Dashboard
  Executed --> KPI
  Executed --> Audit
```

## Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Proposed
  Proposed --> Approved
  Proposed --> Archived
  Approved --> Queued
  Queued --> Running
  Running --> Completed
  Running --> Failed
  Failed --> Queued: approved retry
  Completed --> Archived
  Failed --> Archived
```

## Marketplace

```mermaid
flowchart LR
  Definition --> Certification
  Certification --> InternalCatalog
  InternalCatalog -. future .-> Marketplace
  Marketplace -. deferred .-> Installation
```

## Builder

```mermaid
flowchart LR
  Recommendation --> TemplateMatch
  TemplateMatch --> ExplainablePlan
  ExplainablePlan --> OwnerReview
  OwnerReview --> Approval
```

The visual or AI builder is deferred; this is template resolution only.

## Learning Loop

```mermaid
flowchart LR
  Execution --> KPI
  KPI --> OutcomeEvidence
  OutcomeEvidence -. future governed proposal .-> DefinitionReview
  DefinitionReview -. human approval .-> NewVersion
```

Learning is deferred.

## Simulation

```mermaid
flowchart LR
  Plan --> StaticValidation
  StaticValidation --> ReferenceCheck
  ReferenceCheck --> PolicyCheck
  PolicyCheck -. future .-> SimulationEngine
```

Only static validation is in the MVP roadmap.

## Certification

```mermaid
flowchart LR
  References --> Gate
  TenantIsolation --> Gate
  Lifecycle --> Gate
  Approval --> Gate
  RuntimeRecovery --> Gate
  TTFBV --> Gate
  Gate --> Decision[GO / CONDITIONAL GO / NO-GO]
```

## Analytics

```mermaid
flowchart LR
  Plan --> ExecutionDuration
  Plan --> SuccessRate
  Plan --> KPIChange
  Plan --> TTFBV
  ExecutionDuration --> ProductReport
  SuccessRate --> ProductReport
  KPIChange --> ProductReport
  TTFBV --> ProductReport
```

## Deployment

```mermaid
flowchart TB
  Web --> API
  API --> Postgres
  API --> Worker
  Worker --> Postgres
  Worker --> Providers
  Postgres --> Backup
```

This is a target single-region topology, not deployed evidence.
