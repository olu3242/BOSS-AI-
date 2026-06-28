export type UniversalCapabilityRuntimeErrorCode =
  | "CAPABILITY_NOT_FOUND"
  | "MANIFEST_INVALID"
  | "DEPENDENCY_RESOLUTION_FAILED"
  | "PERMISSION_DENIED"
  | "INVALID_EXECUTION_STATE"
  | "RUNTIME_FAILURE";

export abstract class UniversalCapabilityRuntimeError extends Error {
  abstract readonly code: UniversalCapabilityRuntimeErrorCode;

  constructor(
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class CapabilityNotFoundError extends UniversalCapabilityRuntimeError {
  readonly code = "CAPABILITY_NOT_FOUND" as const;
}

export class ManifestInvalidError extends UniversalCapabilityRuntimeError {
  readonly code = "MANIFEST_INVALID" as const;
}

export class DependencyResolutionFailedError extends UniversalCapabilityRuntimeError {
  readonly code = "DEPENDENCY_RESOLUTION_FAILED" as const;
}

export class PermissionDeniedError extends UniversalCapabilityRuntimeError {
  readonly code = "PERMISSION_DENIED" as const;
}

export class InvalidExecutionStateError extends UniversalCapabilityRuntimeError {
  readonly code = "INVALID_EXECUTION_STATE" as const;
}

export class RuntimeFailureError extends UniversalCapabilityRuntimeError {
  readonly code = "RUNTIME_FAILURE" as const;
}
