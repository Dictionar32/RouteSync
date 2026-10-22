# Phase 1952 — AST Projection Semantic Authority Interface First

## Problem traced

Phase 1951's AST projection rule was present in the canonical invocation reasoning contract, but `controllerBodyParser.ts` still interpreted the input context discriminator directly. That left the parser acting as a semantic decision point rather than consuming a judgment from an authority contract.

## Interface-first change

- Extended the existing upstream interface module with `LaravelControllerAstProjectionSemanticJudgment`, a closed ADT for syntax-only versus semantic projection.
- Added `LaravelControllerAstProjectionSemanticAuthorityInterface`, whose `reasoning` is the existing canonical `astProjection` rule and whose `judge` publishes the closed projection judgment.
- Added `laravelControllerAstProjectionSemanticAuthority`, which interprets that existing rule and preserves the exact canonical invocation judgment.
- Updated `controllerBodyParser.ts` to call the authority and dispatch only on the returned projection ADT. It no longer interprets `LaravelControllerAstProjectionContext.kind` itself.
- Exported the authority through the existing upstream barrel and core public API.
- Added Vitest coverage for syntax-only closure, exact judgment identity preservation, and shared reasoning-contract identity.
- Updated historical audit expectations so regression checks test the current authority-owned projection boundary rather than the old parser-owned context dispatch.

## Invariants retained

- No duplicate invocation judgment authority is created.
- `syntax_only` remains distinct from `invocation_semantic_judgment`.
- Semantic projection means judgment presence, not successful invocation integration.
- `complete`, `blocked`, `source_binding_rejected`, and `not_connected` remain distinct nested integrated-response outcomes.
- The exact invocation judgment object is passed downstream; response provenance is not reconstructed.
- No build was run.
