# Interface Trace Audit - Phase 87.26

## Target
Raise the Laravel AST semantic boundary one level: semantic meaning must be a closed ADT, not a bag of optional/free fields.

## Trace: ecommerce-shop -> RouteSync

`Laravel PHP AST`
-> `ResolverPlugin`
-> `SemanticResolution`
-> `BoundSemanticNode`
-> downstream IR/lowering

The ecommerce-shop manifest already proves the scanner is carrying useful upstream evidence. For example, `$this` is traced to `model: Payment`, while an unresolved accessor is explicitly traced as unknown. fileciteturn48file5L721-L751

The problem was the TypeScript contract did not preserve that meaning structurally: `SemanticResolution` still exposed `type: string` plus optional `model`, `resource`, `collection`, `paginated`, `nullable`, and `fields`. That forces downstream code to reconstruct meaning from combinations of fields. Humanity has apparently decided bags of nullable properties are a type system.

## Repairs

### 1. New closed upstream ADT
Added `packages/core/src/types/domain/semanticResolution.ts`:

- `scalar`
- `model`
- `resource`
- `object`
- `unknown`

No semantic identity field is optional inside the variants.

### 2. Semantic meaning is typed

- scalar -> `SemanticType`
- model -> `ModelName`
- resource -> `ResourceName`
- object field -> `ResponseFieldName + SemanticType`
- model/resource shape -> `BoundCardinality`

This removes free-form semantic identity from the new upstream contract.

### 3. Exhaustive ADT dispatch
Added `matchSemanticResolution()` so consumers can dispatch on the closed discriminator instead of checking arbitrary combinations of `type`, `model`, and `resource`.

### 4. Factory-only construction
Added `SemanticResolutionFactory`. New semantic producers have one explicit construction boundary for valid variants.

### 5. Explicit migration boundary
The old `types/contract.ts::SemanticResolution` is renamed internally to `LegacySemanticResolution` and kept as a deprecated compatibility alias. `toLegacySemanticResolution()` is the one-way bridge:

`strict ADT -> legacy consumer`

It is intentionally not reversible. Downstream cannot silently become the source of semantic truth again.

### 6. ModelColumnResolver moved to strict construction
Database-column resolution now constructs `SemanticResolutionFactory.scalar()` with a first-class `SemanticType` and an existing `BoundModelColumnNode`, then crosses the legacy adapter only at the plugin interface. This is the first concrete upstream producer migration in this phase.

## Important boundary rule

The strict ADT is the new architectural target. The compatibility alias is temporary migration infrastructure, not the domain model. No new resolver should construct the legacy object directly.

## Remaining upstream work

1. Migrate `PrimitiveResolver` to `SemanticResolutionFactory`.
2. Migrate `VariableResolver` and `AccessorResolver`.
3. Migrate `ResourceGraphResolver`, framework, method, conditional, binary and ternary resolvers.
4. Change `SemanticResolutionKernelContract.resolve()` to return the strict ADT.
5. Delete the legacy alias and adapter after all consumers migrate.
6. Replace legacy relation descriptors containing free `type/model` with the existing qualified relation/cardinality ADTs.
7. Remove fallback semantics such as `meta.model || ''`, fake relation defaults, and primitive default-to-string behavior.

## Validation

- Changed-file TypeScript structural check was run with the system TypeScript compiler.
- The changed semantic ADT/factory/adapter/ModelColumnResolver introduced no TypeScript diagnostics in that targeted check.
- The snapshot has no installed `node_modules`, and the repository has pre-existing unrelated type diagnostics, so full build/Vitest green status is **not claimed**.
