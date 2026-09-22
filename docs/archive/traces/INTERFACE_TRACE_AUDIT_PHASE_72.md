# Interface Trace Audit - Phase 72

## Scope
Interface/ADT contract only. Producer, factory, scanner, resolver, and consumer flow migration is intentionally deferred.

## Trace Finding
`EndpointProvenanceDescriptor` represented missing controller/request/response provenance with `ProvenanceSourceRef | null`. That makes semantic absence depend on JavaScript null rather than the domain contract.

## Repair
Introduced `ProvenanceLink`:

- `{ kind: 'absent' }` means the provenance relation does not exist.
- `{ kind: 'present', source: ProvenanceSourceRef }` means a concrete source reference exists.

The three optional provenance edges now carry this closed ADT. `route` remains mandatory because the endpoint itself must have a provenance origin.

## Invariant
Provenance absence is an explicit domain state, not `null` or an omitted property.

## Deferred
Existing `ScannedEndpointProvenanceDescriptor` construction still uses null and conditional normalization. That is intentionally not migrated in this phase because the current priority is strengthening interfaces before changing data-flow usage.

## Verification
Added `interface-contract-phase-72.test.ts` to assert the exact `ProvenanceLink` union and the three descriptor fields.
