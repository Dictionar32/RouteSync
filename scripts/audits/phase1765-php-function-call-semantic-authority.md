# Phase 1765 — PHP Function Call Semantic Authority

## Trace finding

The previous upstream interface exposed `lookup(FunctionName) -> Lookup<Binding>`. That made the scanner consume a search result and decide whether to construct a `builtin` or ordinary `call` expression. The source-to-semantic relation was owned upstream, but the semantic decision boundary remained split between catalog lookup and scanner projection.

## Interface-first correction

- Introduced `PhpFunctionCallSemanticAuthorityInterface` with typed `PhpFunctionCallSemanticInput` and closed `PhpFunctionCallSemanticJudgment`.
- The authority returns the complete canonical `Expression` variant (`builtin` or `call`) with its arguments and source span.
- The binding relation is private to the upstream authority implementation. The interface does not expose a catalog, lookup method, binding array, or `found`/`missing` result.
- The Laravel expression mapper delegates function-call semantics to the authority and no longer branches on lookup outcomes.
- Retired catalog files are left as comments rather than deleted, preserving the repository's unused-file policy.
- Invocation integrated response remains the direct publication result; no detached projection was reintroduced.

## Scope boundary

This phase does not claim that the entire resource subscanner has been removed. Other consumers still import `mapResourcePhpAstToUpstream`; they remain a tracked migration target. The new authority currently centralizes the function-call semantic decision, while the broader AST mapper still handles other PHP expression forms.

## Verification

Run `node scripts/audits/phase1765-php-function-call-semantic-authority.mjs` for the static contract audit. TypeScript typecheck, Vitest, and full build were not run in this phase.
