/**
 * Declarative registries that back the MCP knowledge layer.
 * Capability packs (e.g. general-smb) populate these registries;
 * nothing about a business vertical is hardcoded in platform code.
 */
export interface RegistryEntry {
  key: string;
  label: string;
}

export interface Registry<TEntry extends RegistryEntry = RegistryEntry> {
  list(): TEntry[];
  get(key: string): TEntry | undefined;
}
