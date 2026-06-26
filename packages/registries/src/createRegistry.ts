import type { Registry, RegistryEntry } from "./types.js";

/**
 * In-memory registry factory. Capability packs call `register()` to add
 * entries at module-load time; platform code only ever reads via
 * `list()`/`get()`. No registry may be mutated outside this factory.
 */
export function createRegistry<TEntry extends RegistryEntry>(): Registry<TEntry> & {
  register(entry: TEntry): void;
} {
  const entries = new Map<string, TEntry>();

  return {
    register(entry: TEntry) {
      if (entries.has(entry.key)) {
        throw new Error(`Registry entry already exists for key "${entry.key}"`);
      }
      entries.set(entry.key, entry);
    },
    list() {
      return Array.from(entries.values());
    },
    get(key: string) {
      return entries.get(key);
    },
  };
}
