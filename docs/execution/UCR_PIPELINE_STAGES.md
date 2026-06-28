# UCR Pipeline Stages

Every `PipelineStage` exposes:

```text
initialize -> validate -> execute -> complete -> cleanup
```

Cleanup runs once even when another lifecycle hook fails. Stage snapshots and
results are deeply frozen.

| Stage | Responsibility |
| --- | --- |
| `request` | Validate the generic execution envelope |
| `resolve_capability` | Load active capability metadata |
| `load_manifest` | Load the exact published manifest version |
| `resolve_dependencies` | Resolve capability and pack dependency graphs |
| `build_context` | Build immutable tenant/user/capability context |
| `validate_runtime` | Verify feature and runtime registry availability |
| `create_session` | Create and advance the session to ready |
| `execute_capability` | Invoke the injected generic executor once |
| `collect_evidence` | Persist generic execution evidence |
| `persist_result` | Persist the immutable generic result |
| `publish_events` | Confirm lifecycle event delivery boundary |
| `finalize_session` | Apply completed, failed, or cancelled terminal state |

`FunctionalPipelineStage` is the reusable independently testable stage adapter.
Parallel stages and rollback hooks are intentionally absent.
