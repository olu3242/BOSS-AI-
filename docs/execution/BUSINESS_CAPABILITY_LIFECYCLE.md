# Business Capability Lifecycle

## Status

Adopted policy; enforcement implementation is a separate governed capability.

```text
Concept -> Discovery -> Design -> Architecture Review -> Implementation
-> Integration -> Validation -> Certification -> Release -> Operate
-> Observe -> Optimize -> Upgrade -> Deprecate -> Retire
```

The public capability states are Draft, In Development, Engineering Complete,
Certified, Released, Active, Deprecated, and Retired. Only Certified
capabilities may become Active.

Every transition must preserve capability identity, owner, version,
dependencies, ADRs, certification state, runtime compatibility, pack/bundle
inventory, marketplace state, operational health, and immutable decision
evidence.
