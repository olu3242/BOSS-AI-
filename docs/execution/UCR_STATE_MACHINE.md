# UCR State Machine

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Initializing
  Pending --> Cancelled
  Initializing --> Validating
  Initializing --> Failed
  Validating --> Ready
  Validating --> Failed
  Ready --> Running
  Ready --> Failed
  Running --> Waiting
  Waiting --> Running
  Running --> Retrying
  Retrying --> Running
  Running --> Completed
  Running --> Failed
  Running --> Cancelled
  Completed --> Replaying
  Failed --> Replaying
  Cancelled --> Replaying
  Replaying --> Initializing
```

Initializing, validating, waiting, retrying, and replaying also permit
controlled failure or cancellation where applicable. Every unsupported edge,
including self-transition, throws `InvalidExecutionStateError`.

Transitions return new deeply frozen execution snapshots. Metadata records
timestamps, duration, retry count, failure reason, and immutable transition
history. This models replay state only; replay execution is out of scope.
