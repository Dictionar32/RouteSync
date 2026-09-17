# Interface Trace Audit - Phase 64

## Scope
Interface/ADT only. Producer and consumer flow migration is intentionally deferred.

## Trace
Laravel response declaration
-> ResponseDescriptor
-> generated artifact identity
-> downstream lowering

## Fixed
- `ResponseDescriptorBase` now carries one `ResponseArtifactIdentity` instead of three independent generated-name fields.
- Resource/model/void/inline descriptors expose the identity as one closed contract.
- Inline response provenance is mandatory. It can be `attribute` or `inferred`, so the absence of provenance can no longer be represented by omission.
- `ResponseDescriptorOrigin.trace` no longer accepts arbitrary `{ stage, rule, input, output }` strings. It uses a closed `ResponseOriginTraceEntry` ADT.

## Deliberately not fixed
- Existing producer construction sites still need migration to the new interface.
- `InlineResponseDescriptor.fields` and `semanticContract.properties` still coexist. They are intentionally left for a later SSOT migration because changing the response-body lowering at the same time would mix interface work with flow work.
- Route-level duplicate fields such as `responseTypeName`, `isMutating`, and the flat route accessors remain for the next interface phase.

## Invariant
A response descriptor has one explicit generated-artifact identity and mandatory provenance. Missing identity/provenance is a compile-time construction failure rather than a downstream fallback.
