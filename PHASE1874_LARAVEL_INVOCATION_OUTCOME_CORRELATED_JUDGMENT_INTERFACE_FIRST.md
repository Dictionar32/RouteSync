# Phase 1874 — Laravel Invocation Outcome-Correlated Judgment (Interface First)

## Trace finding

The upstream integrated-response model already preserves four outcomes: `not_connected`, `source_binding_rejected`, `complete`, and `blocked`. The controller invocation judgment previously exposed the response as the entire broad `PhpSourceInvocationSemanticPipelineIntegrationResult` union, so its public judgment shape did not encode which exact response outcome a given judgment member carried.

## Contract change

- `LaravelControllerInvocationSemanticJudgmentInterface` is now a discriminated union of four outcome-correlated judgment members.
- Each member's `response` is narrowed to exactly one integrated-response variant with `Extract<...>`; no outcome is collapsed or reclassified.
- Source identity remains co-located with the integrated response in the same judgment value.
- The authority now uses an exhaustive outcome projection to construct the corresponding judgment member.
- The contract explicitly records the response/outcome correlation guarantee.

## Scope boundary

This phase changes the upstream judgment interface and its authority implementation only. It does not modify scanner runtime, scanner wiring, subscanner lifecycle, or `semantic/relations`; no claim is made that those migrations are complete. `semantic/foundation` remains excluded.

## Verification

Run `node scripts/audits/audit-phase1874-laravel-invocation-outcome-correlated-judgment-interface-first.cjs` and the Phase 1873, 1872, 1871, 1870, 1869, 1838, and 1808 regression audits. No full build or TypeScript compilation is run in this environment.

## References

- TypeScript Handbook — discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing
- Laravel 13 routing — controller routing and route model binding: https://laravel.com/framework/docs/routing

## Production trace still open

The active `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts` path still composes `invocationSemanticIntegratedResponseComposition.integrate({ knowledge, phpSourceInvocationPipeline })` directly. Its `InvocationPhpSourcePipelineInput` accepts both raw composition evidence and integrated results. The new controller judgment authority exists upstream, but the active scanner path has not yet been migrated to consume that closed judgment. The next interface-first step should close the scanner-facing input around an authority-produced judgment before changing wiring or retiring the legacy subscanner path.
