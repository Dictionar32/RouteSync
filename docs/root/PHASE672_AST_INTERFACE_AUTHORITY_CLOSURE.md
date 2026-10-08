# Phase 672 — AST Interface Authority Closure

## Objective

Elevate RouteSync from independent stage interfaces to one closed AST semantic authority pipeline. The pipeline is the single compiler contract spanning scanner evidence, upstream mapping, resolver graph, analysis, semantic type lowering, and target projection.

## Architectural elevation

`astSemanticAuthorityPipeline.ts` introduces:

- stage-specific interface types for all six semantic stages;
- one closed `AstSemanticAuthorityPipeline` carrying all six interfaces;
- explicit stage order;
- AST semantic judgment as authority;
- least-fixed-point closure;
- semantic rewrite engine as the transformation authority;
- constructor accepting only stage-specific interfaces.

This is above the individual `AstSemanticStageInterface` layer: ports transport judgments, stage interfaces expose contracts, and the authority pipeline composes the complete semantic contract.

## Analysis elevation

`compiler/analysis/astAnalysisInterface.ts` adds a closed analysis interface over the existing declarative forward/backward fixed-point solvers:

`CFG -> relation fixed point -> AnalysisFact -> AnalysisJudgment -> AnalysisInterface`

The analysis boundary therefore exposes facts and convergence as semantic artifacts instead of making the solver implementation itself the semantic API.

## Scanner/refinement elevation

The following remaining unsafe refinement points were migrated to typed relation variants:

- `controllerActionContract.ts`
- `expressionAstCanonical.ts`
- `semanticEvidenceRelationCompiler.ts`

No `as Extract` remains in those selected scanner authority files.

## Forbidden host constructs at the Phase 672 boundary

The AST-based audit checks actual TypeScript syntax nodes rather than raw text, avoiding false positives from comments and Laravel source vocabulary.

Boundary result: zero occurrences of:

- `if`, `while`, `for`, `switch`
- `.map`, `.filter`, `.reduce`, `.flatMap`
- `undefined`
- `??`
- strict equality operators
- `as unknown`
- `as Extract`
- TypeScript `any`
- `null`
- `new Set`, `new Map`

## Inactive-file vacuum

Phase 525 audit remains clean:

`candidates=[]`

`remainingNonEmptyCandidates=[]`

`allCandidatesEmpty=true`

No additional production file was emptied because no new inactive file was proven by the repository's current vacuum rule.

## Validation

- Phase 672 AST authority audit: PASS
- Phase 671 audit: PASS
- Phase 670 audit: PASS
- Phase 668 audit: PASS
- Phase 525 inactive-file vacuum: PASS
- production TypeScript transpilation: 0 failures
- full `tsc --noEmit`: environment-blocked only by missing `node` and `vitest/globals` type definitions

## Next frontier

The next semantic elevation should consume the authority pipeline in the actual resolver graph and upstream mapping producers, then expose analysis, semantic type legality, and target preservation as proof-carrying stage interfaces. The remaining host-language constructs should be removed by semantic-domain replacement, not token substitution.
