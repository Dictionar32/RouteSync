# Phase 1783 — PHP Invocation Closure Interface First

## Scope

This phase changes upstream contracts only. It does not wire the Laravel scanner or claim the production pipeline is complete.

## Interface changes

- `PhpFunctionInvocationSemanticJudgmentBatchContract` advances to version 2.
- The contract now states exact argument correlation, uniqueness of each source invocation occurrence, and truthful rejection when closure obligations fail.
- Added a typed closure-violation ADT for inventory-file mismatch, incomplete inventory witness, missing/orphan/duplicate entries, and source/argument mismatches.
- Added `PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt`, which retains the source inventory, entry ledger, correspondence ledger, and the total-bijection invariant.
- Added `PhpFunctionInvocationSemanticJudgmentBatchClosureResult` as a discriminated union: validated receipt or rejected closure with a non-empty typed violation ledger.
- Added `PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface` as the explicit owner of closure validation. It does not perform PHP name resolution or reclassify invocation meaning.
- The integrated response now models the closure result explicitly, so a rejected batch cannot be silently represented as an empty or partial valid batch. Composition input accepts only the validated receipt.
- Integrated-response contract version advances to 8; composition contract version advances to 12.

## Trace findings still open

1. Production PHP name-resolution authority is absent.
2. Production batch-closure authority is absent.
3. `invocationSemanticPipeline.ts` still assigns the publication result directly to `InvocationSemanticIntegratedResponse`, and returns `phpFunctionInvocations` as a detached top-level property. This contradicts the integrated-response interface and is a concrete migration target for the next phase.
4. `controllerDataflowAnalyzer.ts` still calls composition with only `{ knowledge: semanticKnowledgeDataFlow }`; it does not supply a validated PHP invocation batch.
5. `resourceUpstreamExpressionCanonical.ts` still constructs legacy raw-name call evidence before resolution.
6. Subscanner removal remains blocked until every consumer is migrated.

## Audit

Run `node scripts/audits/audit-phase1783-invocation-closure-interface.cjs` for static interface checks and explicit pending gates. These checks are not a TypeScript build or end-to-end verification.

## External semantic references

- PHP function fallback semantics: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP namespace name-resolution rules: https://www.php.net/manual/en/language.namespaces.rules.php
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

The PHP documentation matters because unqualified function calls in a namespace can fall back to global functions; short-name matching is not sufficient to prove a canonical target. The TypeScript reference supports using a discriminated union to preserve validated and rejected closure outcomes explicitly.
