# Phase Upstream Interface Repair 35 — Model Surface Member

## Scope
Upstream interface only. Consumer/compiler migration is intentionally deferred.

## Trace
The previous ResourceModelSurface trace showed consumers resolving a model member and then checking whether the member is a relation. A deeper trace found that the canonical upstream `ModelSurfaceFacts` itself split semantic members into independent collections:

- `columns`
- `accessors`
- `relations`
- `methods`
- `constants`

This forces downstream consumers to reconstruct one semantic member from multiple collections and re-classify its kind.

## Root defect
The model surface was structurally complete but semantically fragmented. The interface exposed storage categories instead of one closed semantic member vocabulary.

## Repair
`packages/core/src/types/upstream/modelSourceFacts.ts` now defines:

```ts
export type ModelSurfaceMemberFact =
  | ModelColumnFact
  | ModelAccessorFact
  | ModelRelationFact
  | ModelMethodFact
  | ModelConstantFact;
```

and `ModelSurfaceFacts` now contains only:

```ts
{
  kind: 'model_surface_facts';
  members: Sequence<ModelSurfaceMemberFact>;
}
```

This makes member kind part of the upstream semantic value itself.

## Why this is higher-level
Before:

```text
columns + accessors + relations + methods + constants
                    ↓
              consumer merges
                    ↓
             determine member kind
```

After:

```text
ModelSurfaceFacts
      ↓
ModelSurfaceMemberFact
      ├── column
      ├── accessor
      ├── relation
      ├── method
      └── constant
```

No downstream correlation across independent collections is required.

## SSOT
`ModelColumnFact` remains canonical in `modelSourceFacts.ts`. No duplicate ModelColumnFact was introduced.

## Migration state
Existing scanner/domain consumers are expected to report type errors because they still construct/read the old fragmented shape. These are intentional migration signals. They are not repaired in this interface-first phase.

## Verification
The upstream interface now has one semantic member collection. No runtime `null`, `undefined`, `any`, `Record<>`, `??`, or `?.` was introduced by this repair.
