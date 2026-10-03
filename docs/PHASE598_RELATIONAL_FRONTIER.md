# Phase 598 — Relational Frontier Cutover

## Objective

Push RouteSync past the remaining scanner/lexer, resolver-graph, AST/upstream mapping, analysis, and semantic-collection leakage by moving semantic state into immutable relations and recursive fixed-point evaluation.

The design is informed by declarative relation and rewrite systems: Soufflé models typed tuple relations; MLIR PDLL/DRR represents matching and rewriting declaratively; WebAssembly specifies validity through declarative typing judgements; Statix models name binding with scope/edge/declaration constraints; and egglog combines Datalog with equality saturation.

## Cutovers

### Scanner facade

`compiler/scanner/LaravelSourceLexer.ts` is now an immutable facade object rather than a class/static-constructor surface. Scanner entry points remain explicit projections over the tokenizer, AST classifier, array parser, route parser, controller parser and DTO parser.

### Dominator analysis

The dominator frontier was converted from mutable `Map`/`Set` state to relation indexes:

- `dominatorRpo.ts` — recursive graph closure.
- `dominatorIntersect.ts` — relation-backed immediate-dominator intersection.
- `dominatorTree.ts` — immutable idom and child relations plus recursive dominance closure.
- `dominanceFrontier.ts` — immutable frontier relation.
- `DominatorAnalysis.ts` — pure composition of the two relations.

The selected analysis surfaces contain zero AST occurrences of the forbidden host constructs.

### Semantic collection algebra

`types/domain/semanticCollections.ts` no longer owns `Map` instances, collection classes, constructors, or host collection iteration. The eight previous collection classes are now relation-backed structural catalogs with:

- immutable tuple indexes;
- relational lookup witnesses;
- recursive projection/fold;
- explicit `Lookup` absence;
- object projection only at the boundary.

### Vacuum

Unused zero-byte production scaffolds were removed. Historical tests whose only purpose was importing those empty scaffolds were removed with them. The remaining route-group production path is the non-empty descriptor/upstream implementation.

Production `.ts` tree now has **0 empty files**.

## Audit

AST-aware audit:

```text
production files: 1012
empty production files: 0
```

Selected Phase 598 frontier files have zero occurrences of:

```text
if while for switch
.map .filter .reduce .flatMap
undefined ?? null === !==
as unknown Set Map any new ternary
```

Repository-wide counts are intentionally not represented as a zero-leakage claim. Remaining authority is concentrated in older domain collections, SSA/loop/graph algorithms, generators, verification, and upstream compatibility surfaces.

## Verification

All Phase 598 modified TypeScript files transpile with zero parse/transpile diagnostics.

A focused no-emit typecheck was run with project type libraries disabled. The Phase 598 modified files introduced no diagnostics in that focused set; unrelated pre-existing diagnostics remain in the larger scanner AST classifier surface.

The repository's normal full typecheck remains environment-blocked by missing `node` and `vitest/globals` type definitions.

## Next frontier

Phase 599 should remove host authority from SSA construction/renaming and loop analysis, then move `types/upstream/expression.ts` from optional host values to explicit relation presence. After that, semantic lowering can converge on a single typed rewrite algebra rather than parallel semantic classes/factories.
