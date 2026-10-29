# Phase 2781 — Route Security Authority Runtime Operation Trace

## Change

`packages/core/src/types/upstream/routeSecurityAuthority.ts` no longer exports `createRouteSecurityAuthority` as a standalone function. Its public construction surface is now `RouteSecurityAuthorityFactoryInterface` and the frozen `routeSecurityAuthorityFactory` object. The production `routeSecurityAuthority` is bound through `routeSecurityAuthorityFactory.create(routeSecurityAuthorityAlgebra)`.

## Runtime trace

```text
Laravel source discovery
  -> laravelSourceAstPipeline.execute()
  -> LaravelSourceAstProjectionJudgment (complete | blocked)
  -> upstreamManifestBuilder
  -> route declaration / boundary input resolution
  -> routeSecurityAuthority.resolve(RouteSecurityAuthorityInput)
  -> RouteSecurityJudgment (closed upstream security/auth/policy/rate-limit result)
  -> route capability and route semantic projection
  -> manifest lowering
  -> CLI SDK generator
```

`RouteSecurityResolver` remains a compatibility/runtime adapter over `routeSecurityAuthority.resolve`; it does not duplicate the authority's middleware classification. The factory only binds the injected algebra. Semantic classification remains in the canonical algebra and is not added as a new reasoning primitive.

## ADT and limitations

- `RouteSecurityAuthorityInput` is a named input contract; `RouteSecurityJudgment` is the closed result contract.
- Scanner projection still distinguishes `complete` from `blocked` rather than silently mapping blocked scans to empty output.
- `SourceScanJudgment` exists but is not wired into the source-AST pipeline yet; this audit intentionally does not claim that integration.
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes by explicit project direction. Existing `Sequence` dependencies in other files remain a repository-level blocker. No build/typecheck success is claimed.

## Audit

Run `npm run audit:phase2781-route-security-runtime-operation`. This is a structural source audit, not a substitute for TypeScript compilation or end-to-end tests.
