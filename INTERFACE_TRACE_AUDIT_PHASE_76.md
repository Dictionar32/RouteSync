# Interface Trace Audit Phase 76

## Scope
Interface/ADT only. Producer, scanner, factory and consumer flow migration is intentionally deferred.

## Finding
`responseDescriptors.ts` still exposed response-domain identity through unconstrained primitive strings: route name, resource/model name, response type name, mapper name, validator name and domain name. These values carried semantic roles but the interface encoded them only as `string`.

## Repair
Introduced semantic value objects: `RouteName`, `ResourceName`, `DomainName`, `ResponseTypeName`, `MapperName`, and `ValidatorName`. Response analysis and artifact identity now require those semantic types. Model names reuse the existing `ModelName`.

## Invariant
Canonical response-domain interfaces no longer represent these semantic identities as free primitive strings. Raw strings belong at an upstream parsing/normalization boundary and are not accepted by the repaired domain contract.

## Deferred
Existing implementations still construct strings. They are intentionally not migrated in this phase. Resulting compile failures identify flow boundaries that must be adapted later.
