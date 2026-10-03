# Phase 587 — Upstream / Scanner Relational Cutover

Phase 587 continues the declarative semantic cutover after Phase 586.

## Implemented

### Upstream semantic model

The following surfaces were moved away from host control/storage authority:

- `types/upstream/model.ts`
  - property and relation indexes are relation-backed tuples;
  - lookup uses relation witnesses rather than `Map`/`undefined` absence;
  - semantic property/relation lookup is projection over the relation algebra.
- `types/upstream/routeResourceFlow.ts`
  - Laravel resource action selection is relation membership;
  - resource-name singularization is a declarative rewrite catalog;
  - route action expansion is relation expansion;
  - no host `Map`, `Set`, collection-method traversal, or control statement in the resolver.
- `types/upstream/presence.ts`
  - presence is an explicit ADT;
  - branch selection uses relational resolution rather than host conditional expressions.
- `types/upstream/resourceVocabulary.ts`
  - operation dispatch is a data dispatch relation;
  - method lookup uses relational first-match semantics.
- `types/upstream/highLevelSourceModel.ts`
  - sequence traversal/projection/expansion is recursive relation algebra;
  - source reference graph construction is relation expansion;
  - service dependency resolution is candidate matching over model relations;
  - contract projection is relation projection.
- `types/upstream/assignment.ts`
  - assignment-target dispatch is declarative visitor selection.
- `types/upstream/request.ts`
  - request-validation capability dispatch is declarative visitor selection.

### Scanner support

- `scanner/subscanners/scannerUtils.ts`
  - source-text cache moved from host `Map` to `RelationIndex`.
- `scanner/subscanners/controller/controllerDataflowContract.ts`
  - controller semantic variable index moved from host `Map` to `RelationIndex`;
  - semantic lookup is relation-witness based.

## Architectural rule

The intended direction is:

`AST evidence -> semantic candidates -> relation index -> constraint witness -> fixed-point closure -> canonical semantic fact`

rather than:

`AST -> mutable Map -> imperative branch -> fallback -> semantic result`

## Research basis

The design continues the ideas found in declarative relation and rewrite systems: Soufflé treats relations as typed ordered tuples; Statix models binding through scope-graph constraints; MLIR PDLL/DRR represents rewrite matching and transformation declaratively; egglog combines Datalog with equality saturation; WebAssembly specifies validation as declarative constraints; and CompCert treats semantic preservation as a compiler correctness theorem.

## Verification

Targeted TypeScript checks were run for the changed upstream model/resolver files with ES2022 target and skipLibCheck. They produced no diagnostics for those changed files.

The repository-wide compiler is not claimed clean because this checkpoint still has pre-existing dependency/type-environment and unrelated semantic-kernel diagnostics.

## Remaining frontier

The audit still identifies residual work in:

- `types/upstream/expression.ts` — legacy `undefined` union vocabulary and traversal code;
- `types/upstream/routeSemanticFlow.ts` — recursive traversal residual;
- scanner controller/resource/request subscanners using relation-backed state inconsistently;
- `RouteSemanticFlowFactory` constructor authority;
- graph/AST upstream projections outside this checkpoint;
- analysis/verification passes;
- semantic type lowering and TypeScript projection.

These must be cut over as semantic relations and rewrite rules rather than mechanically replacing syntax tokens.
