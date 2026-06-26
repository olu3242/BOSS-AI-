import type { BusinessMriResponse } from "@boss/types";

/** Flattens MRI responses into a lookup map keyed by questionKey. Pure, no I/O. */
export function toResponseMap(responses: BusinessMriResponse[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const response of responses) {
    map.set(response.questionKey, response.value);
  }
  return map;
}

export function asBoolean(map: Map<string, unknown>, key: string): boolean {
  return map.get(key) === true;
}

export function asNumber(map: Map<string, unknown>, key: string): number {
  const value = map.get(key);
  return typeof value === "number" ? value : 0;
}

export function asString(map: Map<string, unknown>, key: string): string {
  const value = map.get(key);
  return typeof value === "string" ? value : "";
}

export function asStringArray(map: Map<string, unknown>, key: string): string[] {
  const value = map.get(key);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
