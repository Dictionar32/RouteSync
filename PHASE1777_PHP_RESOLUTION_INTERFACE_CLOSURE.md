# Phase 1777 — PHP Function Resolution Interface Closure

## Scope

This phase evolves the existing `PhpFunctionNameResolutionContract`; it does not add a parallel interface and does not change scanner wiring. It adds explicit semantic obligations for qualified function-import alias application and builtin identity.

## Interface changes

File: `packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts`

- Qualified import aliases rewrite only the matching leading segment and preserve the remaining qualified suffix.
- A builtin target is valid only after canonical global function identity has been established.
- A matching short name alone is never sufficient evidence that the invocation targets a builtin.
- Deferred namespaced calls retain namespace and global fallback candidates without asserting that either symbol exists.
- The interface file itself has no imports from `semantic/relations` or `semantic/foundation`.

## Trace findings that remain open

1. `packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts` still classifies raw short function names via a builtin catalog and imports `semantic/relations`. That behavior conflicts with the stronger resolution contract and must be retired after the resolver and projection boundary are implemented.
2. No production `phpFunctionNameResolutionAuthority` implementation exists yet. The interface is therefore not executable end-to-end.
3. `packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts` consumes a name-resolution judgment, but no proven source path currently supplies that judgment from Laravel function-call AST evidence.
4. The existing integrated response at `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` is wired through `controllerDataflowAnalyzer.ts`, but it publishes the knowledge-graph invocation analysis. It is not yet proven to include the dedicated `PhpFunctionInvocationSemanticJudgment` from PHP AST function calls.
5. `semantic/relations` and `semantic/foundation` still have many unrelated consumers under `types/upstream` and scanner. They cannot safely be deleted in this phase.

## Next interface-first step

Implement the resolver against this closed contract, then define the projection boundary from resolved PHP function identity to `Expression`. Only after the resolver has complete source environment evidence should the scanner caller be migrated. The dedicated PHP invocation judgment must then be added to the source-bound integrated response contract, with one authoritative source of the judgment and no scanner-side reclassification.

## Verification

Run `node scripts/audits/audit-phase1777-php-resolution-interface-closure.cjs`.

This is a static contract audit only; it does not claim TypeScript typecheck, runtime tests, or full build success.
