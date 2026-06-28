# UCR Error Model

All UCR errors extend `UniversalCapabilityRuntimeError` and expose a stable
`code` plus structured readonly details.

| Error | Code | Meaning |
| --- | --- | --- |
| `CapabilityNotFoundError` | `CAPABILITY_NOT_FOUND` | Capability metadata is absent |
| `ManifestInvalidError` | `MANIFEST_INVALID` | Manifest is absent or mismatched |
| `DependencyResolutionFailedError` | `DEPENDENCY_RESOLUTION_FAILED` | Required capability metadata is absent |
| `PermissionDeniedError` | `PERMISSION_DENIED` | Manifest permission is not granted |
| `InvalidExecutionStateError` | `INVALID_EXECUTION_STATE` | State transition is unsupported |
| `RuntimeFailureError` | `RUNTIME_FAILURE` | Runtime adapter cannot complete its contract |

Adapters fail closed and preserve machine-readable errors. Batch 2 may map
pipeline stage failures onto this model without changing existing codes.
