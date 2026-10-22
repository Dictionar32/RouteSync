# Phase2375 Changelog

- Removed `RouteParameterSemanticFactory` from the upstream route-path authority's dependency graph.
- Reused the existing `RouteParameter`, `RouteParameterBinding`, `RouteParameterType`, `Option`, and name value-object contracts to project path parameters directly in the upstream authority.
- Preserved the existing `LaravelRoutePathResolutionAuthority` contract and active scanner injection; no duplicate authority or contract version was introduced.
- Added `scripts/audits/audit-phase2375-invocation-operation-response-cli.cjs` to trace and validate the existing invocation judgment → operation contract/runtime executor → integrated response → controller scanner → source-AST pipeline → CLI chain.
- Added the detailed Phase2375 trace and verification report under `packages/core/src/types/upstream/docs/`.
- Validation: Phase2374 audit 8/8; Phase2375 trace audit 15/15; Phase2371 declaration-evidence audit 10/10; syntax transpilation for the changed authority passed.
- No `npm run build` or full typecheck was run. Historical audits with stale assertions remain documented as failures rather than rewritten to force green results.
- Overall route flow is not yet complete: active scanner still owns declaration-flow/controller-action projection and imports relation runtime and subscanner emitters; producer boundary is still projected after emission.
