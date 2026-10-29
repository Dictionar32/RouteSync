# Phase 3018 — Fully Explicit CLI Manifest Runtime Trace Audit

## Purpose

Continue from the Phase 3017 workspace and make the interface-backed manifest scan operation explicit at both actual CLI consumers (`scan` and `sync`). Trace the real runtime path from the CLI composition contract through source discovery and canonical manifest projection to contract validation and persistence.

## Implementation

Changed:

- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/commands/sync.ts`
- `packages/cli/scripts/audits/audit-phase3018-explicit-cli-manifest-runtime-trace.cjs`

Both commands now bind `composition.manifestScanOperation` to the explicit `RouteSyncCliManifestScanOperationInterface` before calling `.scan(...)`. This makes the contract visible at the consuming runtime boundary instead of relying only on inferred type propagation.

The audit also exposed a path discrepancy: `scan` explicitly validated `resolvedManifest` before persistence, while `sync` relied on the save operation's own contract rejection path without the matching explicit preflight. `sync` now runs `manifestContractValidationOperations.validate(resolvedManifest)` before save, matching `scan`'s explicit contract gate. Serialization and filesystem write outcomes remain owned by the save operation's closed ADT.

## Runtime trace

1. CLI command obtains `RouteSyncCliUpstreamCompositionInterface`.
2. `manifestScanOperation: RouteSyncCliManifestScanOperationInterface` is bound to the composition's exact manifest operation.
3. `routeSyncCliManifestScanOperationFactory.create(manifestComposition)` delegates `.scan(input)` to the supplied `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)`.
4. The composition input continues through project-root canonicalization.
5. Canonical project composition invokes controller source discovery and consumes its result via the source-discovery ADT continuation.
6. The manifest composition returns a terminal `ControllerInvocationManifest` judgment, retaining executable terminal continuation and rejection evidence.
7. The CLI continues successful judgments into `routeSyncManifestFlowProjection.project(completeManifest)`.
8. Request-type projection uses the assembled `requestTypeDerivationPipeline`; it is not independently reconstructed in the command.
9. The resolved manifest is explicitly validated, then saved through `manifestGeneratorOperations.save(...)`.

The dataflow, graph, invocation, source-evidence, request-resolution, and IR files are side outputs. They are not treated as the canonical `routesync.manifest.json` itself.

## Results

- Structural runtime trace audit: **16/16 passed**.
- TypeScript syntax transpilation: **2 changed command files, 0 syntax diagnostics**.
- Full TypeScript typecheck: not yet verified in this phase.
- Unit tests and real Laravel CLI end-to-end execution: not run in this phase.
- Removed relation foundation files remain absent; no kernel re-export to those deleted modules was restored.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

## Important limitation

This phase makes the consumer interface explicit and aligns the explicit manifest-validation gate between `scan` and `sync`. It does **not** claim that every field in the final manifest has been proven end-to-end against a real Laravel project. That requires runtime fixtures and field-level provenance comparison across discovery, controller invocation judgments, manifest building, and serialized output.

## References

- Laravel routing: https://laravel.com/framework/docs/routing
- Laravel controllers: https://laravel.com/framework/docs/controllers
- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php
- PHP object interfaces: https://www.php.net/manual/en/language.oop5.interfaces.php
