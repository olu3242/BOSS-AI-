import type { RegistryEntry } from "./types.js";

export interface ReadonlyRegistry<TEntry extends RegistryEntry> {
  list(): readonly TEntry[];
  get(key: string): TEntry | undefined;
  register(entry: TEntry): void;
}

export function createReadonlyRegistry<
  TEntry extends RegistryEntry,
>(): ReadonlyRegistry<TEntry> {
  const entries = new Map<string, TEntry>();

  return {
    list: () => Object.freeze(Array.from(entries.values())),
    get: (key) => entries.get(key),
    register: (entry) => {
      if (entries.has(entry.key)) {
        throw new Error(`Registry entry already exists for key "${entry.key}"`);
      }
      entries.set(entry.key, Object.freeze(entry));
    },
  };
}
