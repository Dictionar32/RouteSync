# Phase2467 — Model Property Upstream Authority (based on Phase2466)

## Scope and baseline

This phase starts from the user-provided Phase2466 archive. It does **not** start from Phase2468 and does not move files or reorganize scanner directories. The change targets one concrete ownership defect in the existing Laravel model scanner: `memberPropertiesParser.ts` previously classified Laravel model property names and values locally, including `$keyType` vocabulary and unsupported-value handling.

## Root cause

The upstream model relation authority introduced in Phase2466 only closed Eloquent relation semantics. It did not own the semantics of model configuration properties. As a result, `memberPropertiesParser.ts` performed domain decisions in the scanner subscanner and depended on `semantic/relations` to interpret values.

## Changes

- Added `ModelPropertyFactsAuthorityInterface` and a closed `ModelPropertyFactsJudgment` ADT under `packages/core/src/types/upstream/`.
- Added `modelPropertyFactsAuthority` using `export const modelPropertyFactsAuthority: ModelPropertyFactsAuthorityInterface = ...`.
- Reworked the existing `memberPropertiesParser.ts` in place into a typed AST evidence producer.
- Converted the existing model producer and AST-to-semantic-definition export to `export const name: Interface = ...` boundaries; no files were moved. It now records syntax-level evidence and no longer imports `semantic/relations` or `semantic/foundation`, and no longer owns `$keyType` vocabulary or property-name semantic decisions.
- Wired the existing `modelParser.ts` to call the upstream authority and execute its closed judgment into the existing model projection state.
- Exported the authority through the existing upstream barrel and added a static audit plus a runtime smoke script.
- No files were moved and no subscanner directory was deleted in this phase.

## Validation

- `audit-phase2467-model-property-upstream-authority.cjs`: 13/13 checks passed.
- `smoke-phase2467-model-property-upstream-authority.cjs`: 7/7 runtime checks passed against the actual TypeScript authority (transpiled for the smoke harness).
- Changed TypeScript modules were syntax-transpiled separately.
- Package JSON parsed successfully.

## Explicit limitations

- Full repository typecheck, full Vitest, package build, and end-to-end CLI were not run.
- `modelParser.ts` and `columnInferrer.ts` still import `semantic/relations` for other operations. This phase does not claim the whole model subscanner or all of `subscanners` is free of relation/foundation dependencies. Five model subscanner files still import `semantic/relations`; zero files in that model subdirectory directly import `semantic/foundation`.
- The remaining work is to trace each surviving operation to its upstream owner and migrate its semantic responsibility without moving files merely for organizational reasons.
