# Interface Trace Audit Phase 87.23

## Target
Ecommerce-shop ADT/AST relation dataflow: ParsedRelation -> OriginModelSymbol -> resource binders -> BoundSemanticNode.

## Findings
1. `ResolvedPropertyBinding` compressed relation meaning into `isCollection`, while `ParsedRelation` already carries `type`, `targetModel`, and `cardinality`.
2. `propertyAccessBinder` reconstructed relation type from that boolean, collapsing every collection to `hasMany` and every single relation to `belongsTo`.
3. `collectionArrayBinders` invented `hasMany`/`hasOne` when no relation was indexed, creating semantic data that did not originate upstream.
4. `matchBoundSemantic` used dynamic visitor indexing plus a cast instead of an exhaustive ADT match.

## Repairs
- Split `ResolvedPropertyBinding` into explicit column, accessor, and relation variants.
- Relation bindings now carry canonical `relationType`, `targetModel`, and `cardinality`.
- Removed `isCollection` from relation bindings.
- `OriginModelSymbol` forwards the exact `ParsedRelation` semantics.
- `propertyAccessBinder` consumes canonical relation semantics and no longer guesses relation type or target model.
- `collectionArrayBinders` creates a relation Bound AST only when the model actually declares that relation; otherwise it preserves the resource expression and records `unresolved_relation` in the Bound AST.
- `matchBoundSemantic` now uses an exhaustive switch.
- Updated the Phase 87.21 factory regression to the canonical relation contract.

## Invariants
- `ParsedRelation.type` is the sole source for Eloquent relation kind.
- `ParsedRelation.cardinality` is the sole source for relation cardinality.
- A resource collection without a declared model relation is not silently converted into an Eloquent relation.
- Bound AST matching must be exhaustive over the closed `BoundSemanticNode` union.

## Verification
Targeted source tracing and regression assertions were updated. Full repository build/test is not claimed when dependencies are unavailable in the supplied snapshot.

## Next target
`BoundSemanticFactory` still accepts raw strings and legacy coercion paths for semantic types, model/column names, operators, and condition expressions. Migrate those call sites to qualified ADTs before tightening the factory signatures.
