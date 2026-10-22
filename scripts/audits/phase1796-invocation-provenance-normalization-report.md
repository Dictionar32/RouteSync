# Phase 1796 — Invocation Provenance Normalization

## Trace finding
`PhpFunctionInvocationSemanticJudgment` duplicated the source span already owned by `PhpFunctionNameResolutionJudgment`. The invocation authority copied `resolution.source.source` into both resolved and unresolved invocation variants, and batch closure then compared this copied span back to the source evidence.

## Interface-first model upgrade
- Removed the duplicate `source` property from both invocation judgment variants.
- Bumped `PhpFunctionInvocationSemanticContract` to version 2 and made provenance normalization an explicit contract obligation.
- Bumped `PhpFunctionInvocationSemanticJudgmentBatchContract` to version 4.
- Reframed batch source correlation around the resolution input as the single provenance owner.
- Updated batch closure to bind the judgment to the exact source resolution input, without checking a duplicated judgment span.
- Kept the existing invocation authority, batch closure authority, and integrated response slot; no parallel response layer was introduced.

## Scanner status
The Laravel scanner continues to accept injected `PhpFunctionInvocationSemanticIntegrationState`; composition root still supplies the explicit pending state because a source-complete PHP inventory is not yet wired from parser evidence. This phase does not claim end-to-end invocation integration.

## Validation limits
Run `node scripts/audits/audit-phase1796-invocation-provenance-normalization-interface-first.cjs` and `node scripts/audits/audit-phase1795-invocation-source-ownership-interface-first.cjs` for static invariant checks. TypeScript build/typecheck was intentionally not run.

## References
- PHP-Parser NameResolver documentation: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
