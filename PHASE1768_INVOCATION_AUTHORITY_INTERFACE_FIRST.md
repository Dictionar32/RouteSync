# Phase 1768 — Invocation Authority Implementation, Interface First

## Scope

This phase implements the upstream authority already specified by `phpFunctionInvocationSemanticAuthorityInterface.ts`. It intentionally does not rewire Laravel scanner consumers yet: name-resolution evidence production and its authority must be made real before the scanner can supply a completed `PhpFunctionNameResolutionJudgment`.

## Trace findings

1. `phpFunctionNameResolutionInterface.ts` defines a closed judgment with resolved, ambiguous, and unresolved variants.
2. `phpFunctionInvocationSemanticAuthorityInterface.ts` consumes that judgment, but Phase 1767 only declared the interface; there was no corresponding implementation or export.
3. `resourceUpstreamExpressionCanonical.ts` still calls `phpFunctionCallSemanticAuthority.derive()` with a short `FunctionName`. The older authority still matches its builtin table by the short name. Therefore, the new name-resolution path is not yet in the live Laravel scanner path.
4. Invocation integrated response composition remains owned by the existing inventory, pipeline, and publication authority. This phase does not add a second response/projection layer or modify that composition.

## Change

Added `phpFunctionInvocationSemanticAuthority.ts`:

- consumes a completed name-resolution judgment;
- maps resolved builtin targets to the existing `Expression` builtin variant;
- maps declared/external resolved targets to the existing `Expression` call variant;
- preserves ambiguous/unresolved results as explicit invocation judgments;
- does not perform lookup or compare raw function-name strings;
- is exported from the upstream barrel.

## Static audit

Run from the repository root:

`node scripts/audits/phase1768-invocation-authority-implementation.mjs`

Result: 12/12 static checks passed.

This audit checks source structure and ownership boundaries only. TypeScript typecheck, Vitest, and full build have not been run.

## Next interface-first step

Before wiring scanner consumers, model and implement the source evidence producer for PHP function-name syntax and lexical scope (namespace, function imports, and declarations), then implement `PhpFunctionNameResolutionAuthorityInterface`. Only after that judgment is available from real AST evidence should `mapResourcePhpAstToUpstream` be changed to consume the invocation authority. The legacy short-name catalog must not remain a fallback for unresolved or ambiguous resolution. Migrate all consumers and retire the resource subscanner only after a repository-wide reference audit proves it unused.
