# Phase2949 — Explicit Manifest Runtime Contract Trace

## Trace

`controllerInvocationManifestBuilder.build(input)` → `routeSyncCliManifestScanOperationFactory.create(controllerInvocationManifestCompositionAuthority).scan(input)` → composition authority `compose(input)` → source-project canonicalization judgment → source discovery ADT → source document reader / identity binding / semantic pipeline → inventory authority → manifest-builder preparation → manifest terminal ADT → `continueForDriftAudit(handlers)`.

The public runtime entrypoints on this path use `export const name: ExistingInterface = Object.freeze({...})`; the scoped composition module has no exported function declarations. Manifest terminal judgments own `continueForDriftAudit`, while source-project canonicalization judgments own `continueWith`. Filesystem discovery judgments are defined in the existing upstream contract and explicitly exported through `packages/core/src/types/upstream/index.ts`.

## Contract reuse and documented gap

Inspected `packages/core/src/types/upstream/sourceProjectIdentity.ts` before proposing a new contract. Its existing responsibility is semantic comparison of source-project/source-file identity; it does not model Node `realpath` canonicalization or its rejected filesystem evidence. It is therefore not a suitable contract for canonicalization outcomes. The canonicalization judgment remains in the CLI composition contract for this phase rather than adding a duplicate or generic upstream abstraction. A future upstream move should only occur if canonicalization is established as a cross-package domain responsibility and the contract ownership boundary is explicitly approved.

## Scope limits

- This is a focused audit of the CLI PHP controller-invocation manifest composition path, not a repository-wide migration of all `export function` declarations.
- The Node filesystem adapter still has to classify untrusted platform rejection values at the boundary; downstream domain handling receives the typed failure-code ADT and retained original evidence.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification

Run `npm run audit:phase2949-manifest-runtime-contract-trace`. This structural audit does not substitute for a full TypeScript typecheck, unit suite, build, or CLI end-to-end run.
