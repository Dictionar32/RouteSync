# Phase 2732 — Graph Runtime Operations and Relation Ownership

## Scope

This phase continues the RouteSync source migration with a deliberately narrow change: remove `relationFoundation` dependencies from the graph assembly/compiler and basic-block tuple builder, and replace public graph free-function entrypoints with explicit interface-typed frozen operation objects. It does not claim that all `relationFoundation` references or all scanner subscanners are migrated.

## Source changes

1. `packages/core/src/graph/service/graphAssembler.ts`
   - `assembleServiceGraph` is now a private implementation.
   - Public entrypoint is `serviceGraphAssemblyOperations: ServiceGraphAssemblyOperationsInterface = Object.freeze({...})`.
   - Literal discriminant checks use direct `===` instead of `relationEqual`.

2. `packages/core/src/graph/service/manifestGraphCompiler.ts`
   - `compileGraphFromSurface` is now a private implementation.
   - Public entrypoint is `manifestGraphCompilationOperations: ManifestGraphCompilationOperationsInterface = Object.freeze({...})`.
   - `registerServicesFromGraphSurface` is private because it is an implementation detail of compilation.
   - The controller action accumulation branch uses a direct conditional instead of `relationResolve`.

3. `packages/core/src/graph/ServiceGraphBuilder.ts` and `packages/core/src/graph/service/index.ts`
   - Production call sites and the barrel now use/export the typed operation objects, not the old free-function entrypoints.

4. `packages/core/src/compiler/utils/cfg/basicBlock.ts`
   - Removed its `relationFoundation` import.
   - Two recursive tuple builders use explicit conditionals rather than `relationResolve`.

No replacement foundation, renamed relation kernel, generic wrapper, or parallel authority was introduced.

## Upstream CLI → manifest trace

Source-confirmed path:

```text
CLI scan command / CLI sync command
  → composition.manifestScanOperation.scan(input)
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → controller invocation manifest composition authority
  → source-project identity and explicit route selection
  → source discovery / source-document identity and inventory judgments
  → upstream manifest scanner operation
  → manifestBuilderOperationPreparation.prepare(input).build()
  → Laravel source AST pipeline
  → complete source model build
  → semantic dataflow and resource-group capability composition
  → manifest_builder_complete | manifest_builder_blocked
```

The graph builder consumes the graph projection downstream; the change does not bypass the upstream manifest scan operation. `scan` and `sync` still call the same composed `manifestScanOperation.scan(...)` contract. The builder still returns distinct `manifest_builder_complete` and `manifest_builder_blocked` variants.

## Static verification

- `npm run audit:phase2732-graph-runtime-relation-ownership`: **13/13 passed**.
- Regression audits rerun:
  - Phase 2730 controller dataflow ownership: **12/12 passed**.
  - Phase 2729 semantic query ownership: **10/10 passed**.
  - Phase 2728 controller runtime binding: **9/9 passed**.
- Relative imports in the changed source files resolve.
- `relationFoundation` references in `packages/core/src` decreased from 37 references across 28 TypeScript files to **33 references across 25 TypeScript files**.
- The original `relationFoundation.ts` modules remain absent.

## Explicitly unresolved

- 33 `relationFoundation` references remain across 25 TypeScript files. This phase removes references only from the three targeted source areas; it does not hide the remaining failures.
- The `scanner/subscanners` directory still contains 83 files. Full migration to wiring-only remains incomplete; this phase does not claim otherwise.
- Full TypeScript typecheck could not run successfully in this environment: `node_modules` is absent, global `tsc` cannot find standard global types, `@types/node`, or `vitest/globals`, and its version does not support the project's configured target/lib. This is an environment/toolchain failure, not a passing typecheck.
- Full unit tests, build, and CLI end-to-end were not verified.

## TypeScript references

- [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html): named object contracts, property types, and `readonly`.
- [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html): explicit object/function contracts.
- [Union Types and Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html): preserving distinct semantic judgment variants.
