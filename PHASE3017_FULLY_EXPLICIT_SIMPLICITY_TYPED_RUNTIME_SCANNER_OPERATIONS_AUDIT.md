# Phase 3017 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

This increment removes the generic callback-shaped continuation from the Laravel route-parameter dataflow projection result and replaces it with the domain-owned operation `appendToControllerSeed`. The operation has a concrete input and output (`SemanticDataflowInput`) and appends the projection's canonical facts while preserving the original seed's identity, source, origin, and closed marker.

## Runtime trace: upstream → CLI → manifest

1. `packages/cli/src/index.ts` loads the configured host-owned semantic composition and creates the CLI program through `routeSyncCliProgramFactory`.
2. `packages/cli/src/commands/sync.ts` obtains the injected `composition.manifestScanOperation` and calls `scan(controllerInvocationManifestCompositionInputFactory.create(...))`.
3. The returned `ControllerInvocationManifest` owns `continueForDriftAudit`; the sync command handles the complete and each blocked/rejected terminal explicitly. A blocked judgment does not become an empty/success-shaped manifest.
4. The complete terminal flows through `routeSyncManifestFlowProjection.project(completeManifest)`, then request-resolution preflight and the authority-backed `routeManifestProjectionCompositionFactory`.
5. The resulting manifest is persisted through `manifestGeneratorOperations.save`, whose persistence ADT distinguishes complete, contract-rejected, serialization-rejected, and write-rejected outcomes.
6. The same sync runtime also emits semantic dataflow sidecars. Within that sidecar path, `semanticDataflowInputProducer.controllerSeed` now calls `semanticDataflowRouteProjectionAuthority.project(sourceModel, controller).appendToControllerSeed(controller.semantic.dataflow)`. Controller/query/request projection facts are appended after route enrichment, preserving the existing composition order.

**Trace boundary:** the route projection result belongs to the dataflow sidecar branch; it does not itself construct or replace the canonical `routesync.manifest.json`. The canonical manifest path remains the injected CLI scan operation → complete manifest terminal → manifest-flow projection → authority-backed manifest projection → manifest generator/persistence operation.

## ADT change

Before, the projection result exposed a generic `continueWith<Result>(handlers)` callback. This was too generic for the only real consumer and encouraged the caller to extract facts instead of expressing the domain action. Now the result exposes:

```ts
export interface SemanticDataflowRouteProjectionResult {
  readonly kind: 'semantic_dataflow_route_projection_result';
  readonly facts: readonly SemanticDataflowInputFact[];
  readonly appendToControllerSeed: (seed: SemanticDataflowInput) => SemanticDataflowInput;
}
```

The producer remains explicitly typed:

```ts
export const semanticDataflowRouteProjectionAuthority:
  SemanticDataflowRouteProjectionAuthorityInterface = Object.freeze({
    kind: 'semantic_dataflow_route_projection_authority',
    project: projectRouteParameterFacts,
  });
```

The implementation helper is private; no `export function` was introduced. The concrete operation preserves source-span identities, route lineage, route-parameter facts, and optional model-binding facts from the existing source model. It reuses the existing frozen canonical facts array rather than manufacturing a duplicate projection collection.

## PHP/Laravel model fit

Laravel's controller documentation describes route parameters as part of controller method invocation and notes that dependencies and route arguments have an ordered relationship. Laravel's routing API separately models route parameters and controller dispatch/dependency resolution. This supports keeping route-parameter-to-controller binding knowledge in a Laravel-specific upstream projection instead of generic scanner callback plumbing. See the official [Laravel Controllers documentation](https://laravel.com/framework/docs/controllers) and [Laravel Route API](https://api.laravel.com/docs/13.x/Illuminate/Routing/Route.html).

PHP type declarations constrain accepted/returned values, but a TypeScript annotation alone cannot prove source provenance or semantic correctness. Therefore the change retains the existing `SemanticDataflowInput` domain type and source-correlated facts instead of using a generic result type as a substitute for domain knowledge.

## Audit and verification

- Structural audit: **9/9 checks passed** (`PHASE3017_AUDIT.json`).
- TypeScript syntax transpilation: **2 changed files, 0 syntax diagnostics** (`PHASE3017_SYNTAX_CHECK.json`).
- Full typecheck is not claimed. The Phase 3017 root typecheck cannot initialize the standard TypeScript global library or Node typings in this workspace (see `PHASE3017_TYPECHECK.log`); the preceding Phase 3016 diagnostics also include baseline imports to removed relation foundations and the intentionally one-byte `collections.ts`. Those modules were not restored and `collections.ts` was not modified.
- Unit tests and a live Laravel CLI end-to-end run were not executed in this phase.
- The audit verifies the canonical CLI manifest route remains wired, but does not claim every field in the final manifest has complete end-to-end provenance coverage.

## Files changed

- `packages/core/src/types/upstream/semanticDataflowRouteProjection.ts`
- `packages/core/src/types/upstream/semanticDataflowInputFactory.ts`
- `scripts/audits/audit-phase3017-route-projection-domain-operation.cjs`
- Phase 3017 audit, syntax-check, report, and changelog artifacts.

## Non-regression constraints

- Removed relation foundations under `packages/core/src/semantic/relations/` remain absent.
- No kernel re-exports to the deleted relation foundations were restored.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
