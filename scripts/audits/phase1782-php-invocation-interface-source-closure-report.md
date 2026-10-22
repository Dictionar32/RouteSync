# Phase 1782 — PHP Invocation Interface Source Closure

## Scope

This phase is intentionally interface-first. It changes only upstream contracts and adds an audit; it does not implement runtime resolution or rewire Laravel scanner consumers.

## Interface changes

1. `phpFunctionNameResolutionInterface.ts`
   - Advances `PhpFunctionNameResolutionContract` from version 3 to version 4.
   - Makes source-file identity binding explicit for the resolution input and every name-syntax evidence span.
   - Requires the completeness witness span and its declared source-file identity to refer to the same source file as the resolution environment.
   - Aligns the typed rule union and ordered rule contract so exact function-import resolution precedes namespaced declaration resolution, which precedes deferred namespace/global fallback.
   - Preserves canonical global identity as the only basis for builtin classification.
2. `phpFunctionInvocationSemanticAuthorityInterface.ts`
   - Promotes the inline batch-entry shape to the named `PhpFunctionInvocationSemanticJudgmentBatchEntry` interface.
   - Keeps a completed source inventory and its judgment batch as the unit accepted by integrated response composition.
3. `invocationSemanticPipelineInterface.ts`
   - Existing aggregate integrated-response shape is retained; this phase does not introduce a parallel response contract.

## Trace results

- `PhpFunctionNameResolutionAuthorityInterface` exists, but `phpFunctionNameResolutionAuthority.ts` is still missing.
- `invocationSemanticPipeline.ts` still does not construct the aggregate response shape declared by the interface.
- `controllerDataflowAnalyzer.ts` still calls integrated composition without a PHP invocation judgment batch.
- `resourceUpstreamExpressionCanonical.ts` still uses the legacy raw-function-name call input.
- Therefore, the integrated response contract is not yet executable end-to-end and subscanner removal is not safe.

## Audit

Run:

```sh
node scripts/audits/audit-phase1782-php-invocation-interface-source-closure.cjs
```

Result: 7/7 interface checks passed. Four production migration blockers remain explicitly reported as `PENDING`. No TypeScript build or `npm run build` was run.

## External semantic references

- PHP Manual — fallback to global space: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP Manual — namespace FAQ and function name resolution: https://www.php.net/manual/en/language.namespaces.faq.php
- TypeScript Handbook — unions and intersection types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
