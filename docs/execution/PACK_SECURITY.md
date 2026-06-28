# Pack Security

## Controls

- Ed25519 verification over a canonical SHA-256 manifest digest.
- Explicit trust-store key lookup; unknown keys fail closed.
- Platform and runtime compatibility validation before publication and install.
- Approved-registry allowlist.
- Tenant-context equality on every installation mutation.
- Required-permission checks before activation and active upgrade.
- Required-dependency checks and dependent-aware removal.
- Immutable audit history with actor, correlation ID, and trace ID.

Unsigned, altered, incompatible, or untrusted packs cannot publish. Invalid
manifest and signature attempts emit `capability.pack.validation.failed`.

## Residual Risk

The in-memory trust store has no key rotation or revocation feed. Pack modules
run in the host process and are not sandboxed. Production certification
requires durable keys, artifact provenance, malware scanning, isolation,
resource limits, and live authorization integration.
