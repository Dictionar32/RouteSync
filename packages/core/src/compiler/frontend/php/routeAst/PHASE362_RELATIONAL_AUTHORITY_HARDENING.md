# Phase 362 — Relational Authority Hardening

Phase 362 continues the semantic cutover from host-language control/data traversal to declarative semantic relations, solver closure, and rewrite rules.

## Research basis

The architecture is aligned with several primary compiler/formal-method systems:

- WebAssembly specifies validation through declarative typing constraints and execution through reduction rules.
- MLIR exposes declarative graph rewrite rules and PDLL pattern/rewrite separation.
- egglog combines equality saturation with Datalog.
- Flix treats relation and lattice computations as least-fixed-point problems and supports first-class constraints.

These systems are references for the architecture, not runtime dependencies of RouteSync.

## Phase 362 cutovers

### 1. AST semantic adapter

`phpAstSemanticKnowledgeDataFlowAdapter.ts` now uses relation presence and semantic absence rather than host `undefined` for optional semantic evidence. PHP null remains a tagged semantic literal (`SemanticLiteral.kind = 'null'`) rather than a host absence sentinel.

### 2. Versioned state

`semanticVersionedStateDataFlowRelations.ts` is canonical. The former `semanticVersionedStateDataFlow.ts` file is an empty legacy boundary.

Version candidates are selected through relation lookup. Merge inputs are resolved through origin relations. No host `undefined`, `??`, strict equality, or type assertion is used by the authority.

### 3. Interprocedural flow

`semanticInterproceduralDataFlowRelations.ts` is canonical. The former `semanticInterproceduralDataFlow.ts` file is an empty legacy boundary.

Call targets are produced by a declarative relation rewrite:

`data-flow(source,target,callable) -> call-target(source,target)`

Argument/parameter and emission flows are relational expansions with explicit presence witnesses.

### 4. Relational infrastructure

`semanticRelationalCollections.ts` no longer uses `undefined` as a recursion result.

`semanticRelationStore.ts` no longer uses `undefined` or `??` for index absence; map lookup is represented through `RelationOption`.

## Eradication contract

Canonical semantic authorities must not use:

- `if`, `for`, `while`, `switch`
- `.map`, `.filter`, `.reduce`, `.flatMap`
- `undefined`
- `??`
- `===`
- `as`
- host `null` as an absence sentinel

Allowed semantic representation:

- `SemanticPresence` / `RelationOption` for absence
- tagged semantic null (`kind: 'null'`) for PHP null
- relation equality predicates
- relation projection/selection/expansion
- solver/rewrite closure
- fixed-point evaluation

This contract applies to semantic authority files; syntax evidence may still contain the source-language constructs as evidence.
