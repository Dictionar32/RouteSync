# Phase 1493 — Model-Origin Static Contract Closure

## Goal

Strengthen the upstream semantic authority so that a recognized static Eloquent operation cannot establish model-origin provenance when its known argument contract is malformed.

## Changes

- Replaced the arity-only model-origin static vocabulary predicate with a typed rule over positional expression evidence.
- `select` now requires at least one argument.
- `with` now requires at least one relation path and validates each supplied relation path through the upstream `resolveRelationPath` judgment.
- Existing `where` property evidence and minimum arity checks remain upstream-owned.
- Added regression coverage for empty `select()` and malformed `with('posts..comments')` evidence.

## Boundary

`queryEvidenceProducer.ts` continues to forward the upstream `resolveModelOrigin` judgment. This phase does not claim the full model-static operation catalog has been migrated out of the scanner; that is a separate vertical cutover still required for a fully executor-only scanner.

## Verification

- TypeScript verification attempted with the installed global compiler, but the workspace cannot typecheck in this environment: repository dependencies/type definitions are absent and the global compiler is older than the repository's configured TypeScript target.
- No build or test pass is claimed.
