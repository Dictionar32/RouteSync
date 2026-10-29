# Phase 3073 — Upstream → CLI → Manifest Runtime Trace Audit

## Purpose

Trace the real source-project identity path into the existing CLI manifest runtime before choosing a domain-model migration. This phase records verified ownership and the remaining generic-continuation frontier; it does not claim the full runtime is free of primitive reasoning.

## Runtime path observed

1. `packages/cli/src/commands/scan.ts` and `sync.ts` create `SourceProjectIdentity` from the requested root and explicit route-source selection.
2. Both commands call the injected `composition.manifestScanOperation.scan(...)`.
3. `packages/cli/src/manifestScanOperationInterface.ts` exposes `routeSyncCliManifestScanOperationFactory` as an interface-first frozen object; `scan` delegates to the composition authority.
4. `controllerInvocationManifestCompositionInputFactory` owns the `continueToCanonicalization` request operation.
5. `controllerSourceProjectIdentityCanonicalization.canonicalize` calls Node `fs.realpath` on the requested root.
6. Success rebuilds canonical project identity and carries default or explicit query-policy selection. Failure preserves requested identity, typed filesystem failure code/location, and the original failure payload.
7. The composition authority maps failure into the existing `controller_invocation_manifest_source_project_identity_blocked` terminal. Success proceeds into source discovery, source-document identity/read, invocation pipeline and inventory, then manifest construction.
8. CLI `scan` consumes the executable manifest terminal, projects manifest flow/dataflow/graph and request-type evidence, validates the generated manifest, and persists it.

## Open frontier — do not mislabel as fixed

`packages/core/src/types/upstream/sourceProjectIdentity.ts` still defines `ControllerSourceProjectIdentityCanonicalizationHandlers<Result>` and generic `continueWith<Result>`. The CLI composition input still calls `identity.continueWith(...)`. The blocked judgment also carries `failure: unknown`.

These are not safely removed by deleting syntax alone. The next migration should replace the generic handler bundle with a source-project-canonicalization domain operation whose success and blocked outcomes preserve:

- requested and canonical project identities;
- query-policy selection (default versus explicit intent);
- filesystem failure code and location;
- original failure evidence without falsely converting a blocked result into an empty/complete manifest;
- the existing manifest terminal distinction and CLI stop behavior.

The operation must be owned at the correct layer. Do not make core import CLI types and do not restore the deleted generic relation foundation. If an adapter is needed, keep it at the CLI composition boundary and preserve one canonical identity authority.

## Model and migration guidance

- Keep `SourceProjectIdentity` and `SourceFile` as typed domain identities, not duplicated raw-string comparisons in consumers.
- Keep `laravelSourceIdentitySemantics` as the existing identity authority; do not create a second membership/sequence/relations foundation.
- Continue interface-first exports such as `export const operation: OperationInterface = Object.freeze({...})`.
- Use closed ADTs for canonicalized/blocked and manifest complete/blocked outcomes. Domain operations should describe the actual next action rather than expose generic `continueWith<Result>`.
- Do not globally ban `if`, `switch`, equality checks, or traversal counters mechanically. The goal is to model semantic knowledge in upstream ADTs; syntax scanning still needs implementation mechanics, and those mechanics must not become a duplicate source of semantic truth.

## Verification

Run:

```sh
node scripts/audits/audit-phase3073-upstream-cli-manifest-runtime-trace.cjs
node scripts/audits/audit-phase3072-statement-boundary-domain-operations.cjs
```

The Phase 3073 audit is a structural trace, not an end-to-end PHP→CLI→manifest execution or whole-program TypeScript proof. The JSON result records the open continuation frontier explicitly.
