# RouteSync Interface Trace Audit — Phase 87.22

## Scope

`ecommerce_shop` Laravel relation ADT/AST boundary.

## Trace

Laravel relation declaration
→ `memberRelationsParser`
→ `ScannedModelRelationDescriptor`
→ `ParsedRelation`
→ `OriginModelSymbol`
→ `ModelColumnResolver` / `ConditionalWrapperResolver`
→ `BoundSemanticFactory.relation`
→ `BoundRelationNode`

## Findings fixed

1. `ParsedRelation` already had `cardinality`, while scanner descriptors also carried `isCollection`.
   This duplicated the same semantic fact and allowed the two values to diverge.

2. Relation consumers still read legacy `relation.model` even though the canonical field is `targetModel`.

3. Relation consumers reclassified collection-ness from relation method names instead of consuming canonical `cardinality`.

4. `BoundSemanticFactory.relation` accepted `isCollection` instead of receiving canonical cardinality.

5. Bound relation construction accepted arbitrary strings and cast them to `BoundRelationKind`. The factory now accepts `EloquentRelationType` and performs an exhaustive mapping.

## Dataflow invariant after repair

```text
relation.type
      ↓
EloquentRelationRegistry
      ↓
relation.cardinality
      ↓
BoundCardinality
      ↓
BoundRelationNode
```

`isCollection` is now derived only at compatibility/output boundaries when a boolean is explicitly required.

## Remaining next target

`ModelColumnResolver` and `AccessorResolver` still contain empty-string/default fallbacks such as `meta.model || ''` and `meta.column || ''`.
Those should be removed only after `ResolverMeta` is tightened so the origin boundary guarantees qualified model/column values.

The model-column scanner also still has name-based inference for `*_id`. That is a separate semantic-origin issue and should not be reintroduced into the relation ADT.

## Verification

Static source trace and contract test added. Full package typecheck/test execution is unavailable in this snapshot because no TypeScript project configuration/node_modules is present in the supplied archive.
