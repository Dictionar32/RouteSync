# Phase 2805 — Manifest Projection ADT Dispatch

## Objective

Remove semantic projection `switch` statements from the CLI consumers while preserving the closed, discriminated domain ADT and exact failure payloads. This is not a conversion of domain outcomes to booleans, exceptions-as-success, generic `Result`, or a generic reasoning/fold primitive.

## ADT remains explicit

`RouteManifestProjectionCompositionResult` continues to distinguish:

- `manifest_projected`: contains the materialized manifest, request types, semantic types, evidence, ledger, and the authority-produced projected derivation.
- `manifest_projection_blocked`: contains evidence, ledger, and the exact non-projectable derivation.

No terminal state or payload was erased.

## Domain-owned dispatch

`routeManifestProjectionCompositionOutcomeOperations` is an interface-first frozen operation owned beside the ADT. Its handlers are specific to `RouteManifestProjectionCompositionResult` and keyed by the exact discriminants. The CLI supplies one handler for each ADT arm. `scan.ts` and `sync.ts` no longer use `switch (routeManifestProjection.kind)` to consume semantic projection results.

```ts
const resolvedManifest = routeManifestProjectionCompositionOutcomeOperations.consume(routeManifestProjection, {
  manifest_projected: (outcome) => outcome.manifest,
  manifest_projection_blocked: (outcome) => {
    spinner.fail(chalk.red(`Blocked by upstream RequestType semantic judgment: ${JSON.stringify(outcome.derivation)}`));
    process.exit(1);
  },
});
```

The blocked branch preserves and reports the upstream derivation. It cannot fall through to an empty or successful manifest. Dispatch uses the ADT discriminant to select a domain-specific handler; no semantic rule is re-derived in the CLI.

## Ownership decision

No new contract was added under `packages/core/src/types/upstream`: the projection ADT is already owned by `routeManifestProjectionComposition.ts`, so its domain-specific outcome operation belongs beside that contract. This avoids duplicating upstream interfaces. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Audit

Run:

```bash
npm run audit:phase2805-manifest-projection-adt-dispatch
```

The audit verifies the closed ADT, both handlers, interface-first frozen dispatch, scan/sync consumption without semantic switches, blocked-derivation preservation, core exports, absence of a generic reasoning primitive, and the empty collections module. This structural audit is not a substitute for full TypeScript typecheck, build, complete tests, or CLI end-to-end execution.
