export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

export function nowIso(): string {
  return new Date().toISOString();
}
