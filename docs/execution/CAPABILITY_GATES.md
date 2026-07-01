# Capability Gates

| Gate | Required evidence |
| --- | --- |
| Discovery | Problem, scope, success criteria, dependencies |
| Architecture | Registries, runtime, events, security, tenant model |
| Engineering | Foundation, runtime, integration, documentation |
| Validation | Typecheck, lint, tests, build, performance baseline |
| Certification | Engineering GO, environmental blockers, or NO-GO |
| Release | Package, compatibility, upgrade, rollback |
| Operations | Adoption, health, performance, errors, upgrades, notices |

Promotion is sequential and fail-closed. Gate evidence references executable
artifacts; a document-only assertion cannot promote a capability.
