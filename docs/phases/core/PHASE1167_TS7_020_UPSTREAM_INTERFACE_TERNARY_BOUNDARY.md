# Phase 1167 — TS7.0.2 Upstream Interface / Dataflow Boundary

## Trace

```text
Laravel / examples/ecommerce-shop-source
  -> CompleteLaravelSourceModel
  -> SemanticDataflowInput
  -> semanticDataflowAuthority
  -> DataFlowInterface<Input, State, Node>
  -> analysis / IR
```

Structural graph remains a separate lane:

```text
CompleteLaravelSourceModel.relations
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph
```

## Boundary decision

`DataFlowInterface<Input, State, Node>` remains generic. It exposes only:

- seed
- derive
- close
- state
- reaches
- kind

Laravel route/controller/request/resource semantics remain upstream. IR consumes the canonical closed state and does not recompute closure.

This follows the compiler-interface principle that generic analyses should consume stable interfaces rather than encode domain-specific operation knowledge.

## Upstream ternary closure

Runtime ternary expressions were removed from the touched upstream semantic boundary, including:

- `semanticReconciliation.ts`
- `effectiveControllerActionPolicyResolver.ts`
- `modelPrimaryKey.ts`
- `schemaRelation.ts`
- `routeBinding.ts`
- `routeResourceFlow.ts`
- `routeSyncManifestDataflowProjection.ts`

Conditional *types* in type-level tests are intentionally not treated as runtime ternary syntax.

Optional properties such as `guard?: ...` are also not ternary expressions.

## TypeScript baseline

- TypeScript compiler dependency: `7.0.2`
- RouteSync manifest schema: `6.0.0`

These are separate vocabularies and must not be conflated.

## External architectural evidence

- TypeScript 7 is the official native TypeScript release and preserves the existing type-checking architecture while moving the compiler to native code.
- MLIR interfaces are designed so generic analyses/transformations do not encode operation/dialect-specific semantics.
- CodeQL distinguishes AST nodes from semantic data-flow nodes and uses generic data-flow configuration/solver concepts.

## Validation limitation

The checkpoint was not claimed as a successful TS7 build because the working extraction does not contain local `tsc`/`tsup` binaries. Validate with `npm install`, `npx tsc --version`, and `npm run build` in the RouteSync workspace.
