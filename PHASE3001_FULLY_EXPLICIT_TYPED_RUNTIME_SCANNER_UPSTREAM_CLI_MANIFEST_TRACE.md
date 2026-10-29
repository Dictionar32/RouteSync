# Phase 3001 — Fully Explicit Typed Runtime Scanner Operations

## Goal

Raise a reachable upstream runtime construction operation to an explicit interface-owned domain operation. Do not mechanically remove parser control flow, do not duplicate semantic authority, and do not claim repository-wide migration from a focused trace.

## Implemented change

`packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`

- Added `InvocationSemanticRuntimeExecutorFactoryInterface`.
- Its `create(authority, batchAuthority)` operation explicitly accepts the two authorities that own single-invocation and whole-knowledge judgments.

`packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts`

- Replaced the exported parameterized factory `createInvocationSemanticRuntimeExecutor(...)` with `invocationSemanticRuntimeExecutorFactory: InvocationSemanticRuntimeExecutorFactoryInterface = Object.freeze({...})`.
- The production singleton is now assembled through `invocationSemanticRuntimeExecutorFactory.create(...)`.
- The executor remains wiring-only: `execute` delegates to `authority.analyze`; `executeAll` delegates to `batchAuthority.analyze`. No invocation semantics were copied into the executor.
- Updated the two tests that consumed the old factory API and added a Phase 3001 focused test for authority identity and factory construction.

The same phase also raised channel-kind knowledge into an actionable upstream ADT:

- `packages/core/src/types/upstream/channel.ts` now gives each `ChannelKind` variant a `continueWith(...)` visitor operation and a `requiresAuthentication()` domain operation.
- `channelKindFactory` is an interface-typed frozen factory; `fromSourceKind(...)` normalizes the source channel label once.
- `packages/core/src/compiler/scanner/operations/channelProducer.ts` derives `requiresAuthentication` from the exact same canonical `ChannelKind` instance instead of separately reclassifying the source label.
- `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts` uses `channelKind.continueWith(...)` to project public/private/presence descriptors. The lowerer no longer re-derives `isPrivate` or `isPresence` through primitive `===` checks.
- This also removes the channel producer's imports of the deleted `src/semantic/relations/relationalSequence` and `src/semantic/relations/semanticRelations` modules without restoring them.

These are focused changes on the traced path, not a claim that every function-shaped export in the 623-file upstream directory has been migrated or that every primitive condition has been removed repository-wide. Source-label normalization is still localized in the canonical upstream factory; parser/control flow is not removed mechanically.

## Runtime trace

### Route/schema → route manifest → CLI persistence

```text
Laravel route/controller source
  → Laravel source-AST pipeline and controller scanner
  → controller-action schema semantic judgment
  → ControllerActionSchemaRouteRequestEvidence
  → ControllerActionRouteCorrelationAuthority
  → routeDeclarationComposition
  → RouteBoundaryOptions / RouteBindingContract.schemaEvidence
  → RouteSyncManifest (upstream manifest)
  → routeManifestProjectionComposition
  → routeSyncManifestLoweringOperations.lower(...)
  → RouteManifest / RouteSemanticFlow.binding
  → manifestGeneratorOperations.save(...)
  → manifestContractValidationOperations.validate(...)
  → manifestSerializationOperations.serialize(...)
  → ManifestPersistenceJudgment continuation
  → CLI scan command output
```

The serializer preserves `route.binding` as a whole canonical value; it does not reconstruct schema provenance from the schema payload. Schema evidence ownership remains upstream.

### CLI invocation manifest path

```text
CLI scan/sync
  → controllerInvocationManifestComposition
  → manifestBuilderOperationPreparation.prepare(input)
  → LaravelSourceAstPipelineInterface.execute()
  → source-AST projection continuation
  → complete source-model builder continuation
  → semantic dataflow manifest surface
  → ManifestBuilderCompleteJudgment
```

The invocation/source-AST builder path and the route-manifest projection/serialization path are related runtime paths, but this audit does not establish a complete field-by-field bridge from every schema-evidence field into a distinct CLI invocation manifest. That remains an explicit open item, not an inferred success.

## ADT/domain operation policy

- Existing schema-evidence ADTs continue through `continueWith`, `continueToSchema`, and `continueToRouteSchemaEvidence`.
- Manifest generation and persistence judgments continue through their domain `continueWith` operations.
- Invocation executor factory takes exact authority instances as input and preserves their identity.
- No second schema authority or relation foundation was introduced.
- `packages/core/src/types/upstream/collections.ts` remains intentionally empty.
- The removed modules `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` were not restored. The channel producer's dependencies on the deleted `src/semantic/relations/relationalSequence` and `semanticRelations` modules were removed in favor of the upstream channel-kind domain operation.

## PHP/Laravel semantic grounding

Laravel route definitions may target closures or controller actions; route parameters and dependency injection also have explicit framework semantics. Schema/validation evidence therefore needs to remain source-owned and typed through the scanner path rather than be guessed by a downstream serializer. References:

- [Laravel Routing](https://laravel.com/framework/docs/routing)
- [Laravel Controllers](https://laravel.com/framework/docs/13.x/controllers)
- [Laravel Validation](https://laravel.com/framework/docs/validation/latest)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)

## Verification and limitations

- The repeatable structural audit is `scripts/audits/audit-phase3001-interface-first-runtime-executor.cjs`.
- A focused Vitest file was added: `packages/core/src/types/upstream/__tests__/invocation-runtime-executor-factory-interface-phase3001.test.ts`.
- TypeScript syntax diagnostics were run on 9 changed TypeScript files: 0 syntax diagnostics.
- A targeted `tsc --noEmit` attempt was made, but semantic typechecking is blocked by existing workspace errors: missing deleted `src/semantic/relations/*` modules across many other files, `collections.ts` being intentionally empty while legacy imports still expect exports, and unrelated existing type errors. The removed relation modules were not restored.
- `node_modules` is absent, so Vitest and full CLI/Laravel end-to-end tests were not run.
- The scoped runtime files contain no `export function` declaration. This does not imply that all function-shaped exports throughout the repository are gone.
- `try/catch`, `instanceof`, and source-language parser control flow are not removed mechanically; each needs a typed domain owner where semantic interpretation actually belongs.

## Next recommendations

1. Prove schema evidence conservation field-by-field through the route manifest and any downstream IR projection with a Laravel fixture.
2. Trace the CLI invocation manifest separately and identify its actual consumer contract before adding any bridge.
3. Continue function-shaped export migration only on reachable runtime paths, replacing each with a named interface-typed frozen operation and updating every call site/tests.
4. Audit data-only ADTs in `core/src/types/upstream` for missing domain continuations; add operations at the current semantic owner rather than creating parallel generic abstractions.
5. Run focused tests and full typecheck once workspace dependencies are restored.
