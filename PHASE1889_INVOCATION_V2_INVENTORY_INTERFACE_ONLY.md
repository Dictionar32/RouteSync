# Phase 1889 — Invocation V2 Inventory Interface Only

## Scope

Continue the Phase 1888 interface-first migration without implementing or wiring runtime. The V2 invocation semantic judgment remains a proposed contract; the active authority, V1 inventory authority, and Laravel controller scanner continue to use V1.

## Trace finding

`LaravelControllerInvocationSemanticJudgmentInventoryAuthority` reads `judgment.sourceFile` directly for missing, duplicate, and orphan judgment checks. That is valid for V1 but invalid for the proposed V2 shape, because V2 intentionally removes duplicated `sourceFile` fields from source-bound outcomes and makes source identity owned by the corresponding source-binding identity judgment. Therefore V2 cannot safely be substituted into the current V1 inventory contract.

## Interface changes

- Added `LaravelControllerInvocationSemanticJudgmentV2SourceSubjectInterface` as a contract-only identity projection boundary. Its contract states the identity owner for each of the four outcomes and forbids outcome reclassification or duplicate source storage.
- Added `LaravelControllerInvocationSemanticJudgmentV2InventoryInterface`, whose input and closure receipt retain the V2 judgment type and whose authority contract explicitly depends on the V2 subject projection interface.
- Exported the new type contracts from the upstream and core type barrels.
- Recorded the V1 inventory incompatibility in the V2 judgment contract.

## Explicit non-goals

- No source-subject projection implementation.
- No V2 inventory authority implementation.
- No change to the V1 judgment authority or V1 inventory authority.
- No change to `laravelControllerScanner.ts` or scanner wiring.
- No parser, AST, or runtime behavior changes.
- No `semantic/foundation` dependency.

## Verification

The Phase 1889 audit is a static contract audit only. `node --check` validates the audit script and `package.json` is parsed as JSON. No full TypeScript compilation or build is claimed.
