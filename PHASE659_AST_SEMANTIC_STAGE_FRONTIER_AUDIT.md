# Phase 659 — AST Semantic Stage Frontier Audit

## Model escalation

Phase 658 established a closed AST semantic interface. Phase 659 raises that interface into a cross-stage semantic port algebra:

```text
Laravel source evidence
        |
        v
scanner_evidence_port
        |
        v
upstream_mapping_port
        |
        v
resolver_graph_port
        |
        v
analysis_port
        |
        v
semantic_type_lowering_port
        |
        v
target_projection_port
        |
        v
Next.js / TypeScript target surface
```

The important change is architectural: stages no longer need to expose traversal objects as their semantic contract. A stage publishes a closed `AstSemanticStagePort`; a complete compilation view is an `AstSemanticPipeline`.

## AST ADT boundary

`packages/core/src/types/upstream/astSemanticStageInterface.ts` adds:

- `AstSemanticStagePort`
- `AstSemanticStagePortKind`
- `AstSemanticPipeline`
- `AstSemanticBoundary`
- `createAstSemanticStagePort`
- `createAstSemanticBoundary`
- `createAstSemanticPipeline`
- `appendAstSemanticPort`
- `pipelineFacts`
- `stageFacts`
- `astSemanticFactAtStage`
- `astSemanticJudgmentPipeline`

This is intentionally a closed ADT rather than a generic payload bag. The six compiler stages are explicit vocabulary.

## Generic solver -> rewrite engine

`semanticRelationSolver.ts` was a misleading authority name for the semantic substrate. The implementation is now named:

`packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts`

All source imports were migrated to the rewrite-engine name. The old solver file is intentionally zero-byte and has no imports remaining.

The engine remains relation-based and stratified. It provides plan compilation, matching, derivation, strata calculation, and fixed-point saturation. The next escalation is to bind these generic relation rules to the closed AST semantic vocabulary rather than treating the generic engine as a semantic authority.

## Inactive-file vacuum

The Phase 525 audit identified four non-test files without source references. They are now empty rather than retained as dormant authorities:

- `compiler/scanner/descriptors/validation/fieldNodes.ts`
- `compiler/scanner/subscanners/resource/resourceBindingPathBuilder.ts`
- `compiler/scanner/subscanners/resource/resourceBindingSemanticInterface.ts`
- `compiler/scanner/subscanners/validationRuleChecker.ts`

No source import remains for those files.

## Forbidden construct frontier

Canonical Phase 659 boundaries were checked for the requested implementation constructs:

- `if`, `while`, `for`, `switch`
- `.map`, `.filter`, `.reduce`, `.flatMap`
- `undefined`, `??`, `===`, `!==`
- `as unknown`
- `any`
- `new Set`, `new Map`

Result: zero occurrences in the four canonical boundary files.

This is a boundary guarantee, not a claim that every historical test, compatibility surface, or utility in the repository has already been migrated. The remaining repository-wide frontier must be migrated stage-by-stage so that old constructs are replaced by semantic relations rather than mechanically rewritten.

## Research trace

The architectural direction was checked against several established compiler/verification/dataflow approaches:

- MLIR interfaces decouple analyses and transformations from concrete operation/dialect implementations.
- K makes executable semantics explicit through configurations and rewrite rules.
- SeaHorn separates language syntax/operational semantics from verification semantics and represents verification conditions with Horn clauses.
- Alive2 validates IR transformations through refinement/translation validation.
- CompCert makes semantic preservation an explicit compiler correctness boundary.
- WebAssembly WIT uses closed typed interfaces/worlds as cross-component contracts.
- Spoofax separates declarative syntax, static semantics/scope graphs, and term transformations.
- Datafrog, differential dataflow, Flix, Nemo and Ascent demonstrate recursive relation/fixed-point models for graph and logic computation.

These are architectural reference points, not claims that RouteSync should reproduce any one implementation.

## Next frontier

The next work should not be another syntax cleanup pass. It should make each remaining stage emit `AstSemanticStagePort` directly:

1. scanner/lexer evidence adapter;
2. Laravel upstream mapping adapter;
3. resolver-graph relation adapter;
4. analysis/dataflow adapter;
5. semantic-type lowering adapter;
6. Next.js target extraction adapter;
7. proof/derivation witnesses connecting every projection back to source evidence.

Only after these ports become authoritative should legacy traversal models and generic compatibility layers be vacuumed.
