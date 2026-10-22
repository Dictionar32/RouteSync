# Phase 2022 — Interface-first trace without relation/foundation subscanners

## Decision

Do not add `relation` or `foundation` subscanners, and do not wrap `RelationOption` in another interface and call that a migration. The existing upstream interfaces must own semantic outcomes; scanner runtime should only acquire evidence, invoke those contracts, and project a closed judgment.

## Trace: AST

- `astClassifierEvidenceContract.ts` already declares `AstClassifierEvidenceInterface`, but its request/result ADTs are syntax-only (`expression`/`block`). It is not itself an AST expression semantic judgment.
- `scannerAstExpressionCandidateInterface.ts` already owns typed candidate identity, candidate evidence, operator evidence, and `SCANNER_AST_EXPRESSION_PRECEDENCE`.
- `scannerExpressionJudgmentInterface.ts` / `scannerExpressionStructure.ts` already provide a closed `ExpressionStructureJudgment` and an upstream `ExpressionStructureJudgmentInterface`. That judgment covers structured compound expressions, not every PHP expression candidate handled by the full classifier.
- `astClassifierRuntime.ts` still imports `SemanticDecisionContract`, builds `AST_CLASSIFICATION_CONTRACT`, and represents rule applicability/derivation using `RelationOption`. The file also uses relation helpers throughout parsing. Therefore the earlier module-level-contract change stabilized policy identity but did **not** remove relation from AST classification or complete interface-first ownership.
- `astClassifierEvidence.ts` is the existing syntax port adapter: it calls `runtimeClassifyAstTokens` / `runtimeClassifyPhpBlock`, while semantic evidence production is routed separately through `produceAstSemanticEvidence` and `AstSemanticStageInterface`.

### AST migration boundary

Do not create a parallel `relation` or `foundation` scanner, and do not claim `AstClassifierEvidenceInterface` already replaces the semantic classifier. The compatible upstream move is to evolve the existing AST classification/candidate contract and its closed judgment so that candidate identity, precedence arbitration, malformed/blocked outcomes, and proof/provenance are represented as typed ADTs. The parser capabilities then project the selected judgment into `PhpAstValue`; the runtime must not decide candidate priority or reconstruct a semantic outcome. The compound-expression judgment remains a constituent contract, not a replacement for all expression kinds.

Until that upstream contract is implemented and all callers migrated, `RelationOption` remains in the parser implementation. This is an explicit unresolved migration boundary, not a completed no-relation result.

## Trace: Laravel invocation and integrated response

- `LaravelControllerInvocationSemanticJudgmentInterface` is already the canonical outcome-indexed ADT. Its response remains correlated to one exact integration outcome: not connected, source binding rejected, complete, or blocked.
- `invocationSemanticRuntimeExecutor.ts` delegates to the existing upstream authority; it should remain an executor, not become a second judgment authority.
- `LaravelControllerScannerInterface` is at contract version 26 and consumes `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`.
- `compiler/scanner/wiring/laravelControllerScanner.ts` carries the exact `invocationJudgment` into response judgment and `astProjection`; it must not infer success from judgment presence or rebuild integrated response provenance.
- `LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>` indexes response judgment by the exact invocation judgment. Preserve that correlation when evolving the AST boundary.

## Required invariants

1. One canonical invocation judgment ADT; no duplicate invocation model.
2. Integrated response outcome and source correlation are preserved end-to-end.
3. Runtime executor performs wiring/execution only; semantic ownership remains upstream.
4. No `relation/foundation` subscanner directories.
5. Do not describe AST as relation-free until the existing AST/candidate judgment contract replaces the `SemanticDecisionContract`/`RelationOption` classifier path and all dependent call sites are migrated.
6. No build/typecheck claim without running those commands in the user's supported environment.

## External reference

MLIR's official interface documentation explains the same architectural principle: generic analyses and transformations should consume interface contracts rather than hard-code every operation's semantics. The Toy tutorial demonstrates using interfaces to let dialect-specific implementations supply the information a generic transformation needs. This supports the ownership boundary above; it does not imply RouteSync's current AST path is already migrated.
