export enum ProviderErrorCode {
  AUTH_FAILED = "AUTH_FAILED",
  RATE_LIMITED = "RATE_LIMITED",
  INVALID_INPUT = "INVALID_INPUT",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

export interface MappedProviderError {
  code: ProviderErrorCode;
  retryable: boolean;
  message: string;
}

export function mapProviderError(error: unknown, _providerKey: string): MappedProviderError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("econnrefused") || msg.includes("network") || msg.includes("fetch")) {
      return { code: ProviderErrorCode.NETWORK_ERROR, retryable: true, message: error.message };
    }
    if (msg.includes("timeout")) {
      return { code: ProviderErrorCode.TIMEOUT, retryable: true, message: error.message };
    }
    if (msg.includes("401") || msg.includes("403") || msg.includes("unauthorized") || msg.includes("forbidden")) {
      return { code: ProviderErrorCode.AUTH_FAILED, retryable: false, message: error.message };
    }
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
      return { code: ProviderErrorCode.RATE_LIMITED, retryable: true, message: error.message };
    }
    if (msg.includes("400") || msg.includes("invalid") || msg.includes("bad request")) {
      return { code: ProviderErrorCode.INVALID_INPUT, retryable: false, message: error.message };
    }
    if (msg.includes("503") || msg.includes("502") || msg.includes("service unavailable")) {
      return { code: ProviderErrorCode.PROVIDER_UNAVAILABLE, retryable: true, message: error.message };
    }
  }
  return { code: ProviderErrorCode.UNKNOWN, retryable: false, message: String(error) };
}

export function isRetryableErrorCode(code: ProviderErrorCode | string | null): boolean {
  if (!code) return false;
  return ([
    ProviderErrorCode.NETWORK_ERROR,
    ProviderErrorCode.TIMEOUT,
    ProviderErrorCode.RATE_LIMITED,
    ProviderErrorCode.PROVIDER_UNAVAILABLE,
  ] as string[]).includes(code);
}
