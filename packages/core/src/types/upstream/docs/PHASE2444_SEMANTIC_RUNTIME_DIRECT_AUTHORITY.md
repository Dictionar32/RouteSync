# Phase 2444 — Semantic Runtime Direct Authority

## Trace

The previous path still used `semanticRewriteRuntimeExecutor` as a forwarding layer in resource-model binding, semantic behavior closure, and semantic object identity. Each caller already had access to the upstream semantic rewrite authority, so the runtime wrapper did not own a distinct operation on those paths.

The scanner resolver graph also called `solveClosedSemanticRelations` through the scanner compatibility facade, while that helper was implemented in the runtime-executor module.

## Changes

- Resource-model binding now calls `semanticRewriteAuthority.resolveRelations(...)` directly.
- Semantic behavior closure now calls `semanticRewriteAuthority.resolveConstraints(...)` and `resolveRelations(...)` directly.
- Semantic object identity now calls `semanticRewriteAuthority.resolveRelations(...)` directly.
- `solveClosedSemanticRelations(...)` is now owned by `semanticRewriteAuthority.ts` and delegates to the authority's closed judgment operation.
- The scanner-facing compatibility facade exports that upstream-owned operation directly.
- The manifest builder stores its fixed manifest version as a closed value rather than a zero-argument `const` factory.
- The runtime executor no longer owns the compatibility helper.

## Deliberate boundaries

- `semanticRewriteRuntimeExecutor.ts` remains exported as a compatibility surface. This phase does not claim it has been removed from the public API.
- `semanticDataflowRuntimeExecutor.ts` remains because it composes authority judgment with the existing admission boundary and explicit no-evidence result; that behavior must be migrated at its contract owner before removing the boundary.
- `upstreamManifestBuilder.ts` still calls `sourceAstPipeline.execute(pipelineInput)`. This is a source acquisition/pipeline operation and is not a pass-through identity wrapper; the active CLI manifest route remains a separate trace target.
- Existing semantic relation engine imports within the upstream authority have not been migrated by this phase. No new relation/foundation dependency was introduced.

## Validation

The phase audit checks direct authority calls, ownership of the closed relation operation, the scanner facade target, absence of the removed helper from the runtime module, and explicit recognition of the remaining source-pipeline boundary. Syntax-only validation is not a substitute for package typecheck, build, tests, or CLI end-to-end verification.
