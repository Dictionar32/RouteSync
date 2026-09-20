# Phase 53 — Downstream Dumb Model Access

## Scope

Whole `packages/core/src` active code. `packages/core/src/compiler.ts` is legacy and excluded.

## Trace

The model semantic surface still allowed consumers to do:

```text
property lookup
  -> inspect property.kind
  -> decide column/accessor/relation
```

and relation consumers used the generic `ModelSemanticPropertyIndex` for a relation-only operation.

## Repair

### Canonical access fact

`ModelSemanticPropertyIndex` now exposes:

- `access(PropertyName) -> Lookup<ModelPropertyAccessFact>`
- `column(PropertyName) -> Lookup<ModelSemanticColumn>`

`ModelPropertyAccessFact` is a closed semantic contract:

```text
scalar -> ModelSemanticColumn | ModelSemanticAccessor
relation -> ModelSemanticRelation
```

The classification happens once at the semantic surface boundary, not in downstream consumers.

### Dedicated relation index

Added `ModelSemanticRelationIndex`.

`ModelSemanticSurface.relationsByName` now has the exact type:

```text
ModelSemanticRelationIndex
```

rather than the generic `ModelSemanticPropertyIndex`.

Therefore a relation consumer receives `ModelSemanticRelation` directly and cannot receive a column/accessor that it must re-classify.

### Consumers repaired

Updated:

- `property-access/index.ts`
- `ConditionalWrapperResolver.ts`
- `selectRawProjectionParser.ts`
- `selectRawProjectionTypes.ts`
- `ModelSemanticDefinitionDescriptor`
- model surface construction

They now consume the semantic boundary directly.

## Trace result

The following semantic re-classification patterns were removed from active model consumers:

```text
surface.byName.get(...) + property.kind
relationsByName generic property lookup + kind === relation
column lookup + property.kind === column
```

Remaining `Lookup.kind === missing/found` checks are absence handling, not semantic classification.

`compiler.ts` remains excluded.
