# Phase 1550 — Interface-First Semantic Authority and Scanner Reasoning Inventory

## Objective

Move semantic ownership based on the actual reasoning call graph, not one file at a time by filename. Keep scanner syntax processing and compatibility imports, but place semantic relation validation, constraints, closure, and judgment ownership behind upstream contracts and an injected runtime executor.

## Full-tree inventory

`PHASE1550_SCANNER_REASONING_INVENTORY.json` records every TypeScript/TSX file under `packages/core/src/compiler/scanner`.

- 464 scanner TS/TSX files accounted for.
- 371 production files and 93 test files.
- 187 production/test files match one or more semantic reasoning, relation, classifier, or evidence signals. These are heuristic candidates, not 187 confirmed violations.
- After Phase 1550, the configured direct calls to generic relation solvers in production scanner files are **0**. High-level semantic entrypoints and domain resolvers are tracked separately and still require ownership review.

## Ownership cutover in this phase

The following scanner files are compatibility facades now:

- `lexer/routeAst/semanticConstraintCalculus.ts`
- `lexer/routeAst/semanticRelationProgram.ts`
- `lexer/routeAst/semanticRelationTheory.ts`
- `lexer/routeAst/semanticRelationalBehaviorCatalog.ts`
- `lexer/routeAst/semanticRelationalBehaviorKernel.ts`
- `lexer/routeAst/semanticClosureEngine.ts`

Their implementation now lives in `types/upstream`. The constraint authority reuses the existing `semantic/foundation/semanticRewriteEngine`; it does not create a second solver. The same `SemanticRewriteAuthorityInterface` owns constrained closure and generic relation execution. `SemanticRewriteRuntimeExecutorInterface` exposes delegation methods for both.

Resource expression mapping consumers now invoke `createSemanticRewriteRuntimeExecutor(...).executeRelations(...)` instead of directly invoking `solveSemanticRelations`.

## Semantic model improvements

- Constraint judgments use a closed/incomplete discriminated union.
- Derivations preserve the originating rule, premises, bindings, and the fact that constraints were satisfied.
- `not-equals` constraints are evaluated explicitly rather than falling through to rejection.
- Relation closure facts are canonicalized by relation name and serialized argument tuple, so the public judgment does not repeat the same fact while preserving separate derivation evidence.
- Relation-program validation now returns updated variable bindings across premise patterns. The previous implementation reassigned a local parameter, causing valid output variables to be reported as unbound. The upstream catalog smoke test exposed and verified this fix.

## Remaining scanner reasoning frontiers

The inventory deliberately does **not** claim that all semantic reasoning has left scanner. The next audit should trace semantic ownership and consumers for:

1. `lexer/astClassifier.ts`, `astClassifierEvidence.ts`, and `astClassifierRuntime.ts` — distinguish syntax-shape evidence from domain classification.
2. `descriptors/route/routeGroupContextResolver.ts`, `routeGroupSemanticResolver.ts`, and `wiring/route/*Resolver.ts` — route grouping, middleware and effective controller policy resolution.
3. `resolvers/RouteCrudClassifier.ts`, `RouteDomainResolver.ts`, `RouteSecurityResolver.ts`, `ResourceModelResolver.ts`, and `resolverGraphSemanticInterface.ts` — domain decision authority and consumer boundaries.
4. `subscanners/ModelScanner.ts`, `RouteScanner.ts`, `ResourceScanner.ts`, `RequestTypeDeriver.ts`, `SemanticTypeDeriver.ts`, and resource relation/mapping producers — model/type inference and semantic producer ownership.
5. `lexer/routeAst/semanticDataFlowAnalyzer.ts`, `semanticKnowledgeDataFlowRelations.ts`, `semanticInterproceduralDataFlowRelations.ts`, `semanticVersionedStateDataFlowRelations.ts`, `syntaxJudgmentRewriteEngine.ts`, and related consumers — dataflow inference, relation construction, rewrite decisions, and projection boundaries.
6. `semantic/semanticEvidenceRelations.ts`, `semantic/route/routeParameterSemanticFactory.ts`, and controller/resource binders — check whether they produce typed evidence or independently infer domain meaning.

For each frontier, trace the complete chain: source producer → evidence adapter → upstream semantic knowledge/algebra → authority contract → runtime executor → consumer. Do not migrate a classifier merely because it contains `if`/`switch`; first identify whether it is parsing syntax or deciding domain semantics.

## Verification

- Static inventory audit: see `PHASE1550_AUDIT.json`.
- Targeted TypeScript check: upstream constraint/relation authority cluster and scanner facades pass.
- Runtime smoke test: upstream relation closure derives `permits`, returns a saturated judgment, and emits unique facts.
- Constraint smoke test: `not-equals` rejects a guest role; accepted derivation retains premise/binding witnesses.
- Full `npm run build` and Vitest suite are not claimed: the repository has no installed `node_modules`/`tsdown` in this workspace. The resource expression mapper also has unrelated existing TypeScript diagnostics outside the changed executor call sites.

## Architectural references

- MLIR interfaces let analyses and transformations use generic contracts without encoding knowledge of every concrete operation: https://mlir.llvm.org/docs/Interfaces/
- TypeScript compiler architecture separates syntax parsing from binding, semantic checking, and output emission: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2
