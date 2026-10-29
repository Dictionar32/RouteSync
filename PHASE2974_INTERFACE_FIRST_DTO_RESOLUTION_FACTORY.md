# Phase2974 — Interface-First DTO Declaration Resolution Factory

## Implemented

The Laravel controller response DTO declaration authority was exposed through a free factory function (`createLaravelControllerResponseDtoDeclarationResolutionAuthority(dependencies)`). That construction boundary is now an explicit object capability:

```ts
export interface LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface {
  readonly create: (
    dependencies: LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface,
  ) => LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface;
}

export const laravelControllerResponseDtoDeclarationResolutionAuthorityFactory:
  LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface = Object.freeze({
    create: (dependencies) => Object.freeze({
      // The authority's resolve operation retains the typed domain judgment.
    }),
  });
```

The runtime singleton and `LaravelControllerResponseSemanticPipeline` now call `.create(...)`; the factory and its interface are exported from the core public entry. This removes the named free factory from this runtime-reachable upstream authority without pretending that every helper across the entire transitive repository has already been migrated.

The authority's `resolve` operation continues to produce explicit domain judgments for project mismatch, incomplete inventory, unresolved class identity, no match, one match, and ambiguous matches. It preserves source/project provenance and does not promote declaration resolution into a response contract by itself.

## Upstream → CLI → manifest trace

The traced public entrypoints remain:

1. CLI upstream composition (`packages/cli/src/upstreamCompositionFactory.ts`)
2. CLI manifest scan operation (`packages/cli/src/manifestScanOperationInterface.ts`)
3. Manifest scanner operation and facade (`packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts`)
4. Manifest builder preparation (`packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`)
5. Laravel source AST pipeline (`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`)
6. Laravel route scanner (`packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`)
7. Transitive upstream authorities, including DTO declaration resolution.

The audit now traverses relative TypeScript imports from those runtime entrypoints and reports transitive exports still using `export function` or inferred exported arrows. Those counts are migration debt, not a pass claim. This phase deliberately migrates one coherent upstream authority factory and does not mechanically rewrite unrelated parsers, ADT matchers, or low-level utilities.

## Laravel behavior grounding

Laravel documents that route files live under `routes/` and are loaded according to `bootstrap/app.php`; route loading can be customized. Therefore RouteSync must preserve the difference between conventional route-source discovery and explicitly selected sources. Official references: [Laravel Routing](https://laravel.com/framework/docs/routing) and [Laravel Directory Structure](https://laravel.com/framework/docs/structure).

## Verification boundary

Run `npm run audit:phase2974-interface-first-dto-resolution-factory`. It verifies the new factory interface/export, call-site migration, runtime-entrypoint shape, deleted relation-foundation boundary, and empty `packages/core/src/types/upstream/collections.ts`. TypeScript syntax checks are separate from full typechecking. The workspace still has unresolved imports into the intentionally deleted relation-foundation modules, so this phase does not claim a successful full build or CLI end-to-end run.

No deleted relation foundation was restored or recreated under a different generic name.
