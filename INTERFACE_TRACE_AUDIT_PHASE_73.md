# Interface Trace Audit Phase 73

## Scope
Interface/domain contract only. Producer, scanner, factory, and consumer flow migration is intentionally deferred.

## Trace finding
`routeEntityDefinition.ts` claimed a complete `RouteDef` contract while exporting a second permissive `RouteDef` type containing optional fields and `null` values.

The permissive type also mixed raw source representation with the canonical domain representation. This allowed semantic absence to leak into the domain contract and made the claimed zero-porosity invariant false.

## Repair
- Renamed the permissive representation to `RawRouteDefInput`.
- Removed optional and nullable fields from that raw input as well, requiring the boundary adapter to provide a complete raw shape.
- Rebound `RouteDef` to `RouteDefContract` so the canonical name cannot bypass the complete contract.
- Updated `RouteDefDescriptor.fromRouteDef` to explicitly consume `RawRouteDefInput`.
- Re-exported `RawRouteDefInput` as a named boundary type.
- Added a compile-time interface contract test.

## Dataflow boundary

`RawRouteDefInput`
→ boundary normalization
→ `RouteDefContract` / `RouteDef`
→ downstream consumers

The raw boundary may contain `unknown` schema values because those values are not yet semantically classified. They are now explicitly marked as raw input instead of masquerading as canonical domain data.

## Invariant
The canonical `RouteDef` has no `?` or `| null` fields.

## Deferred
Existing producers and callers that still construct the old permissive `RouteDef` shape are expected to fail until migrated. No usage flow was repaired in this phase.
