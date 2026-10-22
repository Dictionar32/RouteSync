# Phase 2196 — Upstream composition contract closure

## Root-level trace

Phase 2195 improved the production scanner call path but left the response pipeline factory accepting a `Partial<...>` dependency override. That meant the factory itself still selected missing semantic authorities, so the upstream interface did not fully own the composition contract. The scanner interface also exposed `astProjectionAuthority` beside `responseSemanticPipeline`, duplicating the AST authority at the public scanner boundary.

## Changes

- Evolved the existing `LaravelControllerResponseSemanticPipelineDependenciesInterface` into the complete required input of `createLaravelControllerResponseSemanticPipeline`. The factory no longer accepts a partial dependency bag and no longer chooses missing authorities internally.
- Added `laravelControllerResponseSemanticPipelineDependencies` as the explicit composition-root binding of existing authorities. The default pipeline is created from this complete bundle.
- Updated the custom projection-authority test to derive a complete bundle and replace only the DTO projection member.
- Removed `astProjectionAuthority` from `LaravelControllerScannerInterface`; the integrated response pipeline is now the single public owner of AST projection for the scanner.
- Kept the scanner production path passing the exact pipeline-owned AST projection and class-name resolution authorities to the parser.
- Removed concrete default authorities from the internal `resolveDtoDeclarationJudgments` helper; callers must supply the already-bound authorities.
- Advanced the scanner contract version from 36 to 37 because its public interface no longer exposes a duplicate authority property. The response pipeline contract remains version 26.

## Invocation / response / runtime boundary

The canonical invocation judgment remains upstream-owned. `judgeIntegratedResponse` receives that exact judgment; evidence production and binding use the dependency bundle; the response executor delegates to the response judgment authority; AST projection receives the exact invocation/response judgment pair. No second invocation classifier or new semantic layer was introduced.

## Deliberate limits

- Parser entry points still retain default authorities for older syntax-only/direct callers. The production scanner path supplies both authorities explicitly. Removing those compatibility defaults requires migrating all direct parser consumers and tests and is not claimed here.
- The composition root still binds existing singleton implementations; the change closes the factory contract, not every authority's transitive imports.
- DTO inventory ordering and canonical per-method response product completeness remain open upstream work.
- No new `relation`, `foundation`, or subscanner layer was added. Existing syntax-level relation helpers were not reclassified as semantic authorities.
- Full typecheck, Vitest, and package build were not run.
