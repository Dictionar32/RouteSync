# Phase 585 — Graph Resolver Relational Cutover

Phase 585 moves the active service-graph resolver boundary from host collection state to explicit relation-backed state.

## Closed surface

The following graph files are now free of the targeted host constructs: `if`, `for`, `while`, `switch`, ternary selection, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `null`, `??`, `===`, `!==`, `&&`, `||`, `as unknown`, `Set`, `Map`, `any`, and `new`.

- `packages/core/src/graph/ServiceGraphBuilder.ts`
- `packages/core/src/graph/service/graphNodeIndex.ts`
- `packages/core/src/graph/service/nodeFactories.ts`
- `packages/core/src/graph/service/graphAssembler.ts`
- `packages/core/src/graph/service/manifestGraphCompiler.ts`

## Model

The graph resolver now uses:

- `RelationIndex<K,V>` for keyed graph facts.
- `relationIndexLookup` for explicit presence witnesses.
- relation projection/selection for graph-node assembly.
- relation membership for controller route/action deduplication.
- `Lookup<T>` at public graph-node lookup boundaries instead of host absence sentinels.
- route handler ADTs as the source of controller identity rather than flat fallback fields.

`GraphNodeIndex` is a factory-backed relation object rather than a class backed by `Map` indexes. Controller indexes are relation tuples as well.

## Research basis

The design follows the strongest common direction across declarative compiler systems: relations as the semantic state, explicit constraints for validity, scope/lookup as graph relations, and rewriting/projection as the mechanism for deriving canonical forms. Soufflé models analysis facts as typed tuple relations; Statix models name binding through scope graphs and constraints; MLIR PDLL treats rewrite patterns declaratively; egglog combines equality saturation with Datalog; and WebAssembly's current validation specification formulates validity as declarative constraints rather than prescribing an implementation algorithm. CompCert provides the complementary correctness target: semantic preservation across transformations.

## Remaining frontier

Phase 585 intentionally closes the graph resolver surface first. The remaining frontier is now concentrated in:

1. scanner/lexer construction boundaries (`SourceStream`, static catalogs, controller scanner maps),
2. resolver/AST/upstream mapping and source-model indexing,
3. analysis/verification passes,
4. semantic type lowering and constructor-based semantic ADTs.

These must be migrated by replacing their host collection/control authority with relation facts, candidate/witness relations, monotone closure, and rewrite/equality-saturation projections rather than performing textual syntax substitutions.
