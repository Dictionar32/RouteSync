# Phase 1800 — PHP Source Invocation Semantic Pipeline Interface-First

## Trace result

The upstream source frontend and extraction validation interfaces exist, as do the whole-file source inventory authority, name-resolution judgments, invocation batch derivation/closure, and integrated response composition. The active Laravel controller analyzer still receives `PhpFunctionInvocationSemanticIntegrationState`; it does not yet extract a complete PHP source document through the new frontend contract. Therefore this phase does not claim end-to-end runtime wiring.

## Change

Added `phpSourceInvocationSemanticPipelineInterface.ts` and exported it from the upstream index. The contract fixes the stage order:

1. whole-file source extraction;
2. provenance and coverage validation;
3. namespace/import/declaration inventory validation;
4. name-resolution judgments;
5. invocation batch derivation and closure;
6. publication of a complete result only after all closure requirements hold.

The result is a closed union. A complete result requires complete frontend coverage, a complete source inventory, and a validated invocation batch. Rejected extraction, incomplete coverage, incomplete inventory, and rejected batch remain distinct blocked results.

## Boundaries retained

- The frontend owns syntax evidence only; it does not resolve names or derive invocation judgments.
- Existing inventory, name-resolution, invocation and batch authorities remain the semantic owners.
- No new `semantic/foundation` or `semantic/relations` dependency was introduced.
- The Laravel scanner was not rewired to a placeholder implementation. Wiring is deliberately deferred until a real whole-file parser adapter can provide source-bound namespace regions, imports, declarations, call nodes, and argument evidence.

## Verification

- Phase 1800 static interface audit: 17/17 passed.
- Phase 1799 static regression audit: 16/16 passed.
- Build/typecheck not run.
