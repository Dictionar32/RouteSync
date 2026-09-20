# PHASE UPSTREAM INTERFACE REPAIR 37 — Semantic Node Facts

## Scope
Upstream interface only. No downstream/compiler flow repair.

## Trace
The semantic catalog had four inconsistent node shapes:
- ResourceSemanticNode: `definition + fields`
- RequestSemanticNode: `definition + fields`
- ResponseSemanticNode: `definition + contract`
- RouteSemanticNode: `definition + endpoint`

These shapes duplicated source definitions and semantic projections, forcing consumers to correlate overlapping data.

## Repair
Raised each semantic node to one correlated `facts` model:

- `ResourceFacts`
- `RequestFacts`
- `ResponseFacts`
- `RouteFacts`

The source AST definitions remain intact in their AST boundary. They are not deleted.

New semantic node shapes:

```text
ResourceSemanticNode -> facts: ResourceFacts
RequestSemanticNode  -> facts: RequestFacts
ResponseSemanticNode -> facts: ResponseFacts
RouteSemanticNode    -> facts: RouteFacts
```

`RouteFacts.endpoint` remains the high-level endpoint contract, while route identity/domain/response are correlated at the same fact boundary.

## Trace-back verification
`packages/core/src/types/upstream` has zero matches for:
- runtime `null`
- `undefined`
- `any`
- `Record<...>`
- `??`
- `?.`

No duplicate `*Facts` declarations were introduced.

## Important migration signal
Existing scanner/compiler consumers may still use old `resource.fields` or similar properties. Those consumers are intentionally not rewritten in this phase. They must be migrated only after their producer/upstream construction is traced and confirmed complete.

## Next root
Trace the producers that construct `ResourceSemanticNode`, `RequestSemanticNode`, `ResponseSemanticNode`, and `RouteSemanticNode`. Ensure each producer can populate the complete `facts` contract without re-deriving semantic meaning downstream.
