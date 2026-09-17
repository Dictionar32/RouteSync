# Interface Trace Audit - Phase 59

## Scope

Interface/ADT only. Consumer flow, scanner flow, lowerers, and emitters are intentionally not migrated in this phase.

## Changes

1. `ResponseSemanticContract.collection` removed. Collection-ness belongs to `ResponseShape`, not the object schema contract.
2. `InlineResponseDescriptorParams.semanticContract` is now required. An inline response descriptor cannot exist without its semantic contract.
3. `InlineResponseDescriptor.semanticContract` is now required.
4. `ResponseShapeSpecification` no longer exposes three independently combinable booleans (`isCollection`, `isPaginated`, `isSingle`). It now carries closed state dimensions:
   - `cardinality: 'single' | 'collection'`
   - `pagination: 'none' | 'paginated'`
5. `defaultWrapperKey` is restricted to `'data' | null` because Laravel response envelope semantics are not an arbitrary string at this domain boundary.

## Invariants

- Object schema does not encode collection state twice.
- Inline response identity cannot be constructed without a semantic contract.
- Response shape cannot represent contradictory boolean combinations such as `isSingle=true` and `isCollection=true`.
- Runtime evidence remains separate from declared response semantics.

## Intentionally deferred

- `RouteResponseAnalysis` nullable identities.
- Legacy producer/consumer migration.
- `ResponseBody` lowering.
- `ParsedRoute` / `RouteManifest` migration.
- End-to-end test execution.

The current source snapshot has no installed `node_modules`, so this phase is not claimed as build/test green.
