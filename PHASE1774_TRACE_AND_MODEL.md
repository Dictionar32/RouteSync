# Phase 1774 — Trace and Model Decision

## Interface-first finding

`PhpFunctionInvocationSemanticJudgment` previously duplicated a resolved function target by storing both a name-resolution judgment and a separately constructible `Expression`. That is weaker than the desired semantic ownership: two fields could disagree about what was resolved.

## Model correction

The existing invocation judgment has been evolved in place. The resolution judgment owns the resolved target; the invocation judgment closes that resolution together with the typed arguments and invocation source. The invocation authority no longer builds `builtin` or `call` expressions. Those are projections of the already-closed semantic result, not part of the reasoning authority.

## Laravel scanner trace

- `phpExpressionStructureProjector.ts` now preserves full callee tokens and source range from earlier phases.
- `resourceUpstreamExpressionCanonical.ts` still calls the raw-name `phpFunctionCallSemanticAuthority`.
- `phpFunctionCallSemanticAuthority.ts` still classifies a short name against a builtin catalog. This can misclassify namespaced/imported calls and remains the next interface ownership boundary to retire.
- `phpFunctionNameResolutionAuthorityInterface` has no production resolver implementation yet.
- `controllerDataflowAnalyzer.ts` publishes the existing integrated response from `SemanticKnowledgeDataFlow`; that response does not currently consume `PhpFunctionInvocationSemanticJudgment`. Integrating the function-specific judgment into that pipeline must be a deliberate contract evolution, not a claim inferred from the shared word “invocation”.

## Official PHP semantic reference

PHP's official namespace documentation distinguishes unqualified, qualified, and fully-qualified names and specifies fallback behavior for unqualified functions. The resolver contract must preserve those distinctions and must not classify builtins from a short identifier alone:

- https://www.php.net/manual/en/language.namespaces.faq.php
- https://www.php.net/manual/en/language.namespaces.fallback.php

## Validation boundary

Static audits only. No TypeScript typecheck, Vitest, or full build was run.
