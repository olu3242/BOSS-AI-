# UCR Execution Context

`CapabilityExecutionContext` is the canonical tenant-aware runtime envelope:

| Field group | Fields |
| --- | --- |
| Tenant | `tenantId`, `organizationId` |
| Actor | `userId` |
| Capability | `capabilityId`, `capabilityVersion`, `manifest` |
| Controls | `featureFlags`, `permissions` |
| Trace | `requestId`, `correlationId`, `traceId` |

The default resolver verifies that request identity/version match the manifest
and that every manifest permission is present. It clones and freezes all data,
leaving caller-owned objects untouched.

Events map tenant to `EventContext.orgId` and organization to
`EventContext.businessId`, preserving the existing observability contract.
No business-specific fields are permitted.
