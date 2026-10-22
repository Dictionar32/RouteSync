# Phase 2211 — Action Body Judgment Provenance Preservation

## Trace finding

The existing `ControllerBodySemanticJudgmentAuthorityInterface` already owns controller-body derivation, including the closed body schema, validation-entry provenance, and known error responses. The action semantic publication previously copied only `statements` and `errorResponses` into its `body` surface, while separately publishing schema output. That compatibility projection did not retain the exact source-correlated body judgment as a first-class member of canonical action knowledge.

## Change

- Evolved the existing `LaravelControllerActionSemanticKnowledge` contract with `bodyJudgment: ControllerBodySemanticJudgment<SourceFile>`.
- The production adapter publishes `result.contract.bodySemanticJudgment` directly; it does not reconstruct the judgment or classify its fields again.
- Added `bodyJudgment` to the explicit published-knowledge inventory.
- Added regression assertions that the existing body authority and its source-correlation contract remain the owner.

## Boundaries intentionally left open

- `scanControllerAction` and `resolveControllerActionContract` still form the legacy production derivation path. This change preserves the existing body's exact judgment; it does not retire that path.
- `resolveResponseAttributeAst` still performs response DTO class-file resolution, declaration extraction, and observed-return field merging. The correct next migration is to enrich and wire the existing `LaravelControllerResponseSemanticPipelineInterface` with complete source-correlated DTO declaration evidence, not to create a parallel response-descriptor authority.
- Resource-binding domain publication still traverses the legacy action adapter.
- `ChannelScanner.scanCanonicalAsts` still lacks an authoritative client-subscription evidence inventory.
- `semantic/relations` imports remain and require call-by-call ownership tracing; no relation/foundation or replacement subscanner layer was introduced.

## Validation

Syntax transpilation, structural assertions, and ZIP integrity are checked for this phase. Full typecheck, Vitest, and package build are not run in this environment.
