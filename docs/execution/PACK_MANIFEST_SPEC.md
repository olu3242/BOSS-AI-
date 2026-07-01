# Pack Manifest Specification

Schema version `1.0.0` is defined by `CapabilityManifest`.

| Field | Contract |
| --- | --- |
| `id` | Stable lowercase identifier |
| `name`, `description` | Required human-readable identity |
| `version` | Semantic version |
| `type` | One of the ten supported pack types |
| `dependencies` | Unique pack IDs, version ranges, optionality |
| `compatibility` | Platform range and exact runtime API version |
| `requiredCapabilities` | Upstream capability contracts |
| `requiredPermissions` | Activation permissions |
| `eventsPublished`, `eventsConsumed` | Canonical dotted event IDs |
| `registriesUsed` | Approved registry IDs only |
| `entrypoint` | Pack documentation/module descriptor |
| `metadata` | String-valued extension data |

The canonical manifest serializer recursively orders object keys. Its SHA-256
digest is the signed installation contract. Validation rejects malformed IDs,
versions, duplicate/self dependencies, invalid events, duplicate declarations,
unsupported registries, and incompatible platform/runtime versions.

Manifests are backward compatible within schema `1.0.0`. Breaking fields require
a new schema version and a governed compatibility adapter.
