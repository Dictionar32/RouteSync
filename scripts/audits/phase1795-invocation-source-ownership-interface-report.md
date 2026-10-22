# Phase 1795 — Invocation Source Ownership Interface-First

## Trace finding

`PhpFunctionInvocationSemanticInput` duplicated provenance by accepting both a completed `PhpFunctionNameResolutionJudgment` and an independent `source: SourceSpan`. The invocation authority copied the caller-provided span into the judgment, even though the resolution judgment already owns the original source span at `resolution.source.source`. This made contradictory source claims representable until batch closure caught them later.

## Model upgrade

- Added `PhpFunctionInvocationSemanticContract` and `PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT` version 1.
- Made `PhpFunctionInvocationSemanticAuthorityInterface` expose the contract as its authority declaration.
- Removed the duplicate source field from `PhpFunctionInvocationSemanticInput`.
- Made the invocation judgment inherit its source span exclusively from `input.resolution.source.source`.
- Preserved the existing closed outcome mapping: resolved resolution -> resolved invocation; ambiguous/unresolved/deferred resolution -> unresolved invocation.
- Kept arguments as carried source evidence; no name lookup, builtin classification, expression construction, or downstream response layer was added.

## Scanner and integrated response trace

`controllerDataflowAnalyzer.ts` still receives `PhpFunctionInvocationSemanticIntegrationState` through injection and passes it into the existing integrated response composition. `controllerVariableSemanticRuntimeBinding.ts` still supplies the explicit pending state because source-complete PHP inventory is not wired. The integrated response continues to use its existing `phpFunctionInvocations` slot.

## Verification

Run `node scripts/audits/audit-phase1795-invocation-source-ownership-interface-first.cjs` for the phase audit. This is a static contract/boundary audit only. TypeScript build and typecheck were not run.

## External language references

- PHP function fallback rules: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP-Parser AST location and name resolution capabilities: https://github.com/nikic/PHP-Parser
