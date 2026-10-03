# Phase 608 — Descriptor Elimination + Relational Analysis Cutover

## Scope

This phase follows the existing canonical semantic/relation infrastructure instead of creating a second descriptor hierarchy.

### Descriptor consumer cutover

Removed scanner-only descriptor implementation files after proving there were no remaining production consumers:

- `compiler/scanner/descriptors/route/error-response/ScannedHttpErrorResponseDescriptor.ts`
- `compiler/scanner/descriptors/route/error-response/errorFactories.ts`
- `compiler/scanner/descriptors/route/error-response/types.ts`
- `compiler/scanner/descriptors/route/routeSecurity.ts`
- `compiler/scanner/descriptors/validation/fieldNodes.ts`
- `compiler/scanner/descriptors/validation/schemaPayload.ts`
- `compiler/scanner/descriptors/channel/channelDescriptorClass.ts`
- `compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts`
- `compiler/scanner/descriptors/manifest/routeManifestDescriptor.ts`
- `compiler/scanner/descriptors/manifestDescriptors.ts`
- `compiler/scanner/descriptors/manifest/index.ts` (directory surface removed)
- `compiler/scanner/descriptors/manifest/index.ts` (directory surface removed)

The consumers now use canonical domain/upstream factories and relations directly:

`HttpErrorResponse`, `RoutePolicyDescriptor`, `RouteRateLimit`, `ValidationFieldNode`, `RouteSchemaPayload`, `BroadcastChannelDescriptor`, `RouteManifest`, and `ResourceRouteGroup`.

## Scanner hardening

- Validation field assembly no longer constructs a host `Map`; root facts are an immutable relation index.
- Route parameter construction no longer uses host `null`/`undefined` detection or constructor syntax.
- Canonical validation entries are structural witnesses/factory output, not class instances.
- Request action derivation consumes the canonical form-action factory.
- Scanner descriptor production has zero remaining `class`/`constructor` declarations.

## Analysis / graph hardening

The old procedural graph utility surface (`DependencyGraphBuilder`, `IncrementalInvalidator`, `TarjanSCC`, mutable `UnionFind`, `FrozenSet`) was replaced by immutable relation-backed graph facts and recursive fixed-point closure:

`dependency edge relation -> closure -> SCC relation -> canonical projection`

No host `Map`, `Set`, `while`, `for`, `new`, or mutation is used in the replacement graph surface.

## Constraint / type hardening

- `ConstraintSolver` class became `solveConstraints()` returning an immutable `{ environment, diagnostics }` result.
- `TypeSystem` class became pure type-lattice functions plus `createTypeSystem()`.
- `SemanticType` compound construction no longer uses host `.flat()`.
- `TypeIR` construction no longer uses ternary/`undefined` branching in factories.
- IR semantic rewrite relations (`fieldTransformSemanticRelations`, `responseReferenceSemanticRelations`) now use explicit relation catalogs and relation lookup rather than host `.map()`/`.find()`/`if` branching.

## Validation

- Modified-file TypeScript transpilation diagnostics: **0**.
- Full project typecheck remains blocked before project checking by missing ambient definitions for `node` and `vitest/globals`.
- Production TypeScript zero-byte files: **0**.
- Scanner descriptor production classes/constructors remaining: **0**.

## Architecture target

The implementation frontier is now explicitly:

`Laravel source evidence -> syntax relations -> upstream AST relations -> candidate/witness relations -> constraints -> monotone fixed point -> rewrite/equality normalization -> canonical semantic IR -> analysis relations -> target lowering -> Next.js projection`

This follows the declarative pattern used by MLIR PDL/DRR, where matching and rewrites are represented declaratively, and the WebAssembly specification, where validity is defined by declarative typing constraints and the algorithm is an implementation of those constraints. citeturn0search3turn0search5turn0search0

Equality-saturation remains the next normalization target: e-graphs retain equivalent forms and apply rewrites until saturation before extraction, which is the appropriate model for semantic alternatives rather than destructive first-match normalization. citeturn1search0turn1search4
