# Phase 1997 — Response Pipeline Includes the Existing AST Projection Authority

## Scope

Interface-first contract correction. No runtime wiring, response classification, replacement authority, `semantic/relations` subscanner, or `semantic/foundation` subscanner was added.

## Trace

Phase 1996 introduced `LaravelControllerResponseSemanticPipelineInterface`, but the dependency bundle stopped at the response runtime executor. The repository already has `LaravelControllerAstProjectionSemanticAuthorityInterface`, whose integrated projection context accepts the invocation and response judgments. The response pipeline contract therefore did not yet express the final response-to-AST/ADT projection dependency even though the architecture requires it.

The concrete scanner remains out of sync: `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` does not consume `responseSemanticPipeline`, constructs descriptor-derived response candidates, and omits `responseJudgment` from its artifact. This phase does not claim runtime integration.

## Contract change

- `LaravelControllerResponseSemanticPipelineInterface` now includes the existing `LaravelControllerAstProjectionSemanticAuthorityInterface` as `astProjection`.
- Pipeline contract version advances from 1 to 2.
- The contract explicitly records AST projection ownership, ordering after the closed response judgment, and the boundary that projection semantics remain owned by the existing authority.
- `LaravelControllerScannerInterface` contract version advances from 20 to 21 to record the expanded pipeline dependency contract.
- Existing invocation judgment, source identity, evidence production, source binding, and response executor ownership are preserved.

## Intended flow

```text
source identity judgment
  → successful declaration/source correlation
  → response evidence production
  → per-evidence source binding ADT
  → response runtime executor
  → closed response semantic judgment
  → existing AST projection authority
  → scanner artifact carrying the compatible invocation/response ADT pair
```

The descriptor-derived response reference remains a candidate, not proof of a PHP `return` expression. Source identity alone does not upgrade its provenance.

## Validation

Run `node scripts/audits/audit-phase1997-response-pipeline-ast-projection-interface-first.cjs` from the repository root. This is a structural audit. Syntax transpilation is checked separately; full typecheck/build are not claimed.

## Explicitly unresolved

1. Scanner implementation has not been wired to the new pipeline dependency.
2. Response evidence production, source binding, and response execution are not invoked by the production scanner.
3. `LaravelControllerScanArtifact` still requires `responseJudgment`, while scanner construction omits it.
4. Existing `semantic/relations` references remain in the legacy controller scanner tree; no new relation/foundation subscanner was introduced.
