# Phase 3012 Changelog — Operational Preparation ADT and Typed Pipeline Factory

## Runtime changes

- Added `continueToPreparation(dependencies)` to `LaravelControllerInvocationSemanticJudgmentPreparationInput` so the preparation input carries a domain continuation operation instead of being data-only.
- Added `LaravelControllerInvocationSemanticJudgmentPreparationInputData` as the data-only constructor payload, keeping the operation out of the caller's responsibility.
- Added `LaravelControllerInvocationSemanticJudgmentPreparationInputFactoryInterface` and `laravelControllerInvocationSemanticJudgmentPreparationInputFactory`, exported through the upstream barrel. The factory creates a frozen canonical input and closes the continuation over that exact input.
- Migrated the reachable CLI composition path in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` to call `preparationInput.continueToPreparation(...)` rather than invoking the preparation factory directly.
- Replaced the callable export `createPhpSourceInvocationSemanticPipelineAuthority` with `phpSourceInvocationSemanticPipelineAuthorityFactory: PhpSourceInvocationSemanticPipelineAuthorityFactoryInterface = Object.freeze({ create: ... })`.
- Migrated the production CLI source pipeline wiring to `phpSourceInvocationSemanticPipelineAuthorityFactory.create(...)` and updated the core/upstream export barrels. The callable factory export is no longer present in source code or source barrels.
- Kept `laravelControllerInvocationSemanticJudgmentPreparationFactory.prepare(input, dependencies)` for compatibility; the new input continuation delegates to this existing authority operation.

## Verification

- Structural audit: `PHASE3012_AUDIT.json`, 16/16 checks passed.
- TypeScript syntax-only transpilation: 7 changed TypeScript files, 0 syntax diagnostics (`PHASE3012_SYNTAX_CHECK.json`).
- Full typecheck, unit tests, and real Laravel CLI end-to-end were not run; do not interpret syntax/audit checks as runtime proof.

## Preserved constraints

- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- Deleted relation foundation modules and kernel re-exports are not restored.
- No repository-wide mechanical rewrite of `export function`, `if`, `switch`, `===`, `??`, or ternaries.
