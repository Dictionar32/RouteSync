# Phase 2782 — Route Capability Semantic Runtime Operation Trace

## Change

`routeCapabilitySemanticAuthority.ts` no longer exports `createRouteCapabilitySemanticAuthority` as an `export function`. Its public composition boundary is now `RouteCapabilitySemanticAuthorityFactoryInterface` and the frozen `routeCapabilitySemanticAuthorityFactory` object. The canonical `routeCapabilitySemanticAuthority` production instance is constructed through `routeCapabilitySemanticAuthorityFactory.create(routeCapabilitySemanticAuthorityAlgebra)`.

The factory is a composition boundary only: it adds the upstream/closed contract and delegates `resolve(input, overrides)` exactly once to the supplied canonical algebra. It does not reclassify routes or create a second semantic judgment.

## Runtime trace

```text
Laravel source discovery
  -> laravelSourceAstPipeline.execute()
  -> LaravelSourceAstProjectionJudgment (complete | blocked)
  -> upstreamManifestBuilder
  -> route boundary adapter / capabilityResolution
  -> routeCapabilitySemanticAuthority.resolve(semanticInput, semanticOverrides)
  -> RouteCapabilitySemanticResolution
  -> route manifest lowering operations
  -> CLI SDK generation
```

The scanner projection and manifest builder remain separate from semantic capability resolution and manifest lowering. This phase does not claim `SourceScanJudgment` is fully integrated into the pipeline.

## Domain and reasoning constraints

- The input continues to use `RouteActionKind` as the canonical ADT for mutation classification.
- `RouteCapabilitySemanticResolution.reasoning` continues to use the pre-existing `SemanticReasoningContract<'evidence_resolution'>`, required by the domain output. This phase adds no reasoning primitive and does not remove the domain's existing reasoning contract.
- `RouteSchemaPayload.fields` remains the canonical schema-shape source.
- `collections.ts` remains intentionally empty. Collection dependency removal is a separate root-contract migration and is not masked by a wrapper or array substitution.

## Validation limits

The Phase 2782 audit is a static source-contract audit. It does not establish typecheck/build or end-to-end test success. The repository still has imports from the intentionally empty `collections.ts`, and the source-scan judgment is not yet wired end-to-end.
