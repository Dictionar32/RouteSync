# Phase 2197 — Response Authority / Executor Closure

## Trace finding

The existing integrated response factory accepted an explicit dependency contract, but its implementation still executed a module-level `responseExecutor`. That executor was permanently bound to the module-level `responseSemanticAuthority`, whose source identity semantics were also fixed to the default singleton. Consequently, overriding the response pipeline dependency contract did not replace the actual response authority or executor. The public contract and runtime composition could diverge.

## Upstream-first correction

- Evolved `LaravelControllerResponseSemanticPipelineDependenciesInterface` to require the existing `LaravelControllerResponseSemanticJudgmentAuthorityInterface` as the canonical response-meaning owner.
- Removed the duplicate `sourceIdentitySemantics` dependency slot. Correlation and evidence binding now use `dependencies.responseSemanticAuthority.sourceIdentitySemantics`, so identity semantics follow the selected response authority.
- Added `createLaravelControllerResponseSemanticJudgmentAuthority(sourceIdentitySemantics)` to construct the existing authority with an explicit identity owner. This does not create a second semantic authority type.
- Added `createLaravelControllerResponseSemanticRuntimeExecutor(authority)`; the executor's `authority`, `returnResponseProjection`, and `execute` members are derived from the exact authority passed to it.
- `createLaravelControllerResponseSemanticPipeline(dependencies)` now constructs the executor from `dependencies.responseSemanticAuthority`, and `judgeIntegratedResponse` executes that pipeline-owned executor. No module-level executor can override the selected authority.
- Advanced the existing response pipeline contract from version 26 to 27 and made the authority/executor dependency rules explicit in the contract.

## Preserved semantic chain

`canonical invocation judgment -> source correlation -> evidence production -> source binding -> DTO judgments/projections -> response semantic authority -> authority-bound runtime executor -> method response products -> AST projection`

The response judgment continues to carry the exact `invocationJudgment`; method return products remain sourced from the canonical `ControllerReturnSemantic` ADT and method-scoped observations. The scanner's public shape did not change, so its contract version was not incremented.

## Scope exclusions

No `relation`, `foundation`, or subscanner layer was added. No response reasoning was moved into a new runtime module. The default singleton remains only in the existing composition root; custom compositions can supply an authority with their own source identity semantics, and the executor is constructed from that same authority.

## Validation status

- TypeScript syntax transpilation for the two changed upstream files: passed for all three changed upstream TypeScript files; see the root audit JSON.
- Full project typecheck, Vitest, and package build were not run.
