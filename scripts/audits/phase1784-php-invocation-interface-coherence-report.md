# Phase 1784 — PHP Invocation Interface Coherence

Date: 2026-10-13
Base: RouteSync Phase 1783 archive

## Trace findings

Phase 1783's interface audit did not detect a missing declaration: `PhpFunctionInvocationSemanticJudgmentBatchEntry` was referenced by the closure contract but was not declared in the upstream interface file. The composition boundary also disagreed with its own aggregate model: the input accepted only a validated receipt even though the response contract said rejected closure outcomes must be preserved, and the runtime returned the publication result as `response` while attaching PHP invocation data as a detached sidecar.

## Changes

1. Declared `PhpFunctionInvocationSemanticJudgmentBatchEntry` in `phpFunctionInvocationSemanticAuthorityInterface.ts`, binding source evidence and its invocation judgment as one typed entry.
2. Changed `InvocationSemanticIntegratedResponseCompositionInput.phpFunctionInvocations` to accept the closed validated-or-rejected closure result. This matches the response contract's promise to preserve failure evidence instead of excluding it at the input boundary.
3. Updated `invocationSemanticPipeline.ts` to construct the `InvocationSemanticIntegratedResponse` aggregate containing both the exact publication result and the exact PHP closure result.
4. Removed the detached `phpFunctionInvocations` property from `InvocationSemanticIntegratedResponseCompositionResult`; the PHP result now belongs inside `response` as specified by the interface.
5. Updated the composition contract's coverage statement to describe preservation of both validated and rejected closure results.
6. Added `audit-phase1784-php-invocation-interface-coherence.cjs` and the captured static audit output.

## Static audit

`node scripts/audits/audit-phase1784-php-invocation-interface-coherence.cjs`

Result: 12/12 interface-coherence checks passed.

The audit explicitly reports these remaining blockers as `PENDING`:

- Production PHP function-name resolution authority is not implemented.
- Batch closure authority is not implemented.
- Laravel `controllerDataflowAnalyzer.ts` does not supply the PHP invocation closure result to integrated composition.
- `resourceUpstreamExpressionCanonical.ts` still uses pre-resolution call evidence.

The static audit is not a TypeScript build or an end-to-end test. No `npm run build` or TypeScript build was run.

## Recommended next phase

Continue interface-first. Trace the parser-owned name syntax evidence and complete source environment into a single resolution input; then define the closure authority's full evidence/correspondence obligations. Implement those authorities only after their contracts are coherent. Migrate the Laravel scanner after it can supply the actual closure result; do not fabricate an empty batch or bypass rejected outcomes. Remove subscanners only after all consumers have moved and an audit proves no references remain.

## External semantic references

- PHP Manual — fallback to global space for functions and constants: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP Manual — namespace FAQ and unqualified function resolution: https://www.php.net/manual/en/language.namespaces.faq.php
- TypeScript Handbook — discriminated unions and union exhaustiveness: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
