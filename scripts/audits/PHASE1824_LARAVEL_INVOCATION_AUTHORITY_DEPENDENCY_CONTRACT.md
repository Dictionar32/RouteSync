# Phase 1824 — Laravel Invocation Authority Dependency Contract

## Trace finding

The Phase 1823 judgment separated the semantic result from its callable authority, but the authority implementation still selected and called concrete source-binding and integration authorities directly. That left the dependency boundary implicit and made the composition contract weaker than the judgment contract.

## Interface-first correction

- Added `LaravelControllerInvocationSemanticJudgmentAuthorityDependencies`.
- The dependencies are typed by the upstream `PhpSourceInvocationSemanticSourceBindingAuthorityInterface` and `PhpSourceInvocationSemanticPipelineIntegrationInterface` contracts.
- Judgment execution delegates binding and integrated-response projection through those dependency interfaces.
- Concrete authorities are selected only in the composition root when creating the exported default authority.
- Exported the judgment interface and authority composition through `types/upstream/index.ts` as well as the package root.
- Kept the correlated `sourceFile` + integrated `response` judgment shape and preserved the distinct not-connected, source-binding-rejected, complete, and blocked outcomes.

## Production status

`laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle()`. Route/resource consumers still rely on legacy controller-index plumbing. This phase does not claim scanner migration or subscanner retirement; it strengthens the upstream interface and dependency contract first.

## Verification

Run `node scripts/audits/audit-phase1824-laravel-invocation-authority-dependency-contract.cjs` and the previous phase 1822/1823 audits. These are static source-contract audits only. No build, typecheck, or E2E is performed in this environment.
