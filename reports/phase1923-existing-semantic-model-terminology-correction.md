# Phase 1923 — Correct active interface terminology

## Trace finding

The previous Phase 1922 report incorrectly called `ControllerDataflowInvocationSemanticModelInterface` a "legacy" interface. That label was wrong: the interface is located under `packages/core/src/types/upstream`, is imported by `controllerBodyAstTypes.ts`, and is actively extended by the production `ControllerDataflowAst` type. It is the existing upstream semantic value model, not a retired or compatibility-only interface.

## Ownership confirmed

The interface owns `semanticVariables`, `semanticKnowledgeDataFlow`, `semanticKnowledgeProjection`, `invocationJudgment`, and `invocationSemanticIntegratedResponse`. The latter two remain separate values: the canonical source-correlated judgment is not conflated with the knowledge-bound integrated response result. The production AST inherits this model and does not redeclare `semanticKnowledgeProjection`.

The word "legacy" remains appropriate only where the repository explicitly identifies a compatibility/migration boundary, such as `compiler/compatibility/ContractInputBoundary.ts`; it should not be used as a synonym for "existing interface" or "interface that predates the current phase".

## Changes

- Corrected the Phase 1922 report wording from "legacy" to "existing upstream".
- Corrected the Phase 1922 audit label so it describes the active semantic model accurately.
- Added `scripts/audits/audit-phase1923-existing-interface-not-legacy.cjs` to verify production use, semantic ownership, and terminology.
- No runtime or public contract shape was changed; no version bump is warranted for a documentation/audit-label correction.

## Validation boundary

The Phase 1922 and Phase 1923 static audits are run separately. No TypeScript build, typecheck, or runtime suite is run.
