# Phase 1781 — PHP Invocation Interface-First Closure

## Scope

This phase changes contracts in `packages/core/src/types/upstream` only. It deliberately does not modify Laravel scanner wiring or production authority implementations. The point is to close the upstream semantic model first and make the remaining migration boundary explicit.

## Contract changes

1. `phpFunctionNameResolutionInterface.ts`
   - Advances `PhpFunctionNameResolutionContract` to version 3.
   - Makes source-file/environment-file identity an explicit resolution rule and contract invariant.
   - Preserves canonical qualified identity as the only basis for builtin classification; short-name matching remains forbidden.

2. `phpFunctionInvocationSemanticAuthorityInterface.ts`
   - Introduces source evidence and a complete source inventory model.
   - Adds a completeness witness so an empty inventory cannot silently mean that the scanner did not visit calls.
   - Defines total one-to-one inventory/judgment correspondence and source/environment binding obligations for a PHP invocation batch.
   - Keeps resolved, ambiguous, unresolved, and deferred resolution outcomes represented by the existing closed invocation judgment.

3. `invocationSemanticPipelineInterface.ts`
   - Advances the integrated-response contract to version 7 and the composition contract to version 11.
   - Makes `InvocationSemanticIntegratedResponse` one aggregate containing the exact generic publication result and the source-bound PHP invocation judgment batch. The PHP batch is no longer modeled as a detached sibling field on the composition result.
   - Declares that the PHP batch's source file must match the source represented by the integrated knowledge input.

## Trace findings still open

- `PhpFunctionNameResolutionAuthorityInterface` exists, but a concrete production name-resolution authority has not been found in this trace.
- `controllerDataflowAnalyzer.ts` still calls `integrate({ knowledge: semanticKnowledgeDataFlow })` and does not provide the now-required PHP invocation batch.
- `invocationSemanticPipeline.ts` still places the publication result directly into `response`; it has not yet constructed the new aggregate response shape.
- `resourceUpstreamExpressionCanonical.ts` and its consumers have not yet been migrated from the old call path.
- Subscanner removal is not safe until those consumers have migrated and an audit shows no remaining references.

These are intentionally surfaced as follow-up migration blockers. This phase does not claim a successful TypeScript build or end-to-end integration.

## Audit

Run:

```sh
node scripts/audits/audit-phase1781-php-invocation-interface-closure.cjs
```

Result: 12/12 static interface checks passed. The audit also reports the two known integration blockers above. No TypeScript build or `npm run build` was run.

## External semantic references

- PHP Manual, “Fallback to global space”: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP Manual, “Namespace FAQ / name resolution”: https://www.php.net/manual/en/language.namespaces.faq.php
- TypeScript Handbook, “Unions and Intersection Types” (discriminated unions): https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
