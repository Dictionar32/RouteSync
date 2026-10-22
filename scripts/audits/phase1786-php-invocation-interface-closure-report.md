# Phase 1786 — PHP Invocation Interface Closure

Date: 2026-10-13
Base: `RouteSync-phase1785-php-invocation-interface-first-20261013.zip`

## Scope

This phase finishes the upstream PHP name-resolution and invocation-batch authority boundaries before attempting full Laravel scanner wiring. It intentionally does not claim end-to-end invocation integration.

## Changes

1. Added `phpFunctionNameResolutionAuthority.ts` implementing the existing `PhpFunctionNameResolutionAuthorityInterface` and `PHP_FUNCTION_NAME_RESOLUTION_CONTRACT`.
   - Rejects malformed name evidence as unresolved.
   - Binds source, syntax segments, completeness witness, imports, and declarations to one source file.
   - Applies exact function imports before unqualified namespace/runtime fallback.
   - Applies qualified import aliases only to the leading segment.
   - Preserves fully-qualified identities.
   - Emits explicit ambiguity for conflicting imports/declarations and deferred judgments for unqualified namespaced calls whose namespace-vs-global fallback cannot be proven statically.
   - Classifies a PHP builtin only after canonical global identity is known.
   - Excludes Laravel helpers such as `response`, `collect`, `config`, and `route` from the PHP-builtin target type/catalog.
   - Adds no `semantic/relations`, `semantic/foundation`, `Map`, `Set`, or `as` dependency to this authority.

2. Added `phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts` implementing the existing closure authority interface.
   - Checks inventory/witness file identity, source/environment/syntax provenance, total inventory-entry correspondence, duplicate source occurrences, judgment resolution provenance, and exact argument-object correspondence.
   - Produces a validated receipt only when all checks pass; otherwise returns a non-empty typed violation ledger.

3. Evolved the integrated-response contract to version 9 and composition contract to version 13. The aggregate retains the PHP integration state inside `response`, rather than a detached sidecar.

4. Added an explicit `php_function_invocation_semantic_integration_pending` state with named blockers. This is deliberate: the Laravel scanner does not yet inventory PHP namespace regions, `use function` imports, or declared functions, so fabricating a complete batch would be unsound.

5. Updated `controllerDataflowAnalyzer.ts` to pass the explicit pending state to the existing composition, so the response honestly reports the incomplete PHP invocation path.

6. Updated `resourceUpstreamExpressionCanonical.ts` to preserve the complete lexical callee spelling from `functionNameEvidence` and stop classifying a raw short name through the old call authority. Calls remain ordinary `call` expressions until the scanner supplies resolution evidence; this is a conservative transitional projection, not the final semantic integration.

7. Exported both production authorities through `types/upstream/index.ts`.

## Verification

Run:

```sh
node scripts/audits/audit-phase1786-php-invocation-interface-closure.cjs
```

Result: **14/14 static source-contract checks passed**.

The audit is static and checks source-level ownership, export boundaries, explicit pending integration state, and the absence of prohibited dependencies in the new authorities. It is not a TypeScript compile or end-to-end test.

No `npm run build` or TypeScript build was run.

## Remaining work — intentionally not marked complete

- Add parser/source evidence for namespace regions, `use function` imports, and declared functions.
- Build the per-file invocation source inventory from every PHP function-call AST node, including explicit empty inventory proof.
- Derive name-resolution judgments and invocation judgments from that inventory.
- Close the batch with `phpFunctionInvocationSemanticJudgmentBatchClosureAuthority` and pass its actual result to integrated response composition.
- Migrate remaining consumers of `resourceUpstreamExpressionCanonical.ts` to the completed invocation contract.
- Only then remove the subscanner after a full consumer/reference audit.

## External semantic references

- PHP Manual — namespace fallback: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP Manual — namespace FAQ: https://www.php.net/namespaces.faq.php
- PHP Manual — aliasing/importing: https://www.php.net/language.namespaces.importing.php
- TypeScript Handbook — unions and intersection types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
