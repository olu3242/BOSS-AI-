# Business Capability Model

## Authority

The Business Capability Model is the canonical product architecture.

```text
Business Capability
  -> Capability Bundle
    -> Capability Pack
      -> Runtime Components
        -> Execution Backbone
```

Developers create packs, architects compose bundles, and customers consume
Business Capabilities. Packs are implementation artifacts rather than the
customer-facing planning unit.

Every Business Capability declares identity, purpose, owner, version,
lifecycle, dependencies, inputs, outputs, KPIs, policies, events, runtime
requirements, and certification status. Certification occurs at Pack, Bundle,
and Business Capability levels.

The initial catalog is Identity, Business Context, Knowledge Platform,
Diagnostics, Strategy, Planning, Execution, Optimization, Executive
Operations, Marketplace, AI Workforce, Integrations, and Governance.

## Implementation Status

CPP implements the Pack artifact layer. Bundle composition and the top-level
Business Capability Registry are adopted architecture but not implemented in
the CPP batch.
