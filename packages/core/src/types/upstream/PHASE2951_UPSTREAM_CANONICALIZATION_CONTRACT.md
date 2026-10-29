# Phase2951 — Upstream Canonicalization Contract Ownership

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI manifest scan operation → composition authority → `ControllerSourceProjectIdentityCanonicalizationInterface.canonicalize(input)` → Node `fs.realpath` adapter → canonicalized/blocked judgment → judgment-owned `continueWith(...)` → manifest terminal judgment.

## Root cause and correction

Phase2950 strengthened the blocked canonicalization judgment with the existing `FilesystemFailureCode`, `FilesystemFailureLocation`, and original rejection evidence. The remaining contract-placement gap was that the canonicalization domain types still lived in the CLI composition interface, even though they are consumed as an explicit authority contract and depend on upstream source-project identity and filesystem ADTs.

Phase2951 moves the canonicalization input, interface, judgments, result, handler, and continuation operation contracts into `packages/core/src/types/upstream/sourceProjectIdentity.ts`, the existing upstream source-project identity contract. The CLI composition interface imports those types from `@routesync/core`; it no longer owns duplicate declarations. `packages/core/src/index.ts` explicitly exports the upstream contract types.

The runtime implementation remains in the CLI Node adapter and retains interface-first form:

`export const controllerSourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface = Object.freeze({...})`.

The Node adapter owns `fs.realpath` and platform rejection classification. The upstream contract owns the typed domain judgments and their continuation operations. No new generic collection or duplicate filesystem abstraction is introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification boundary

`npm run audit:phase2951-upstream-canonicalization-contract` checks contract ownership, explicit barrel export, evidence retention, continuation operations, interface-first runtime shape, scoped exported-function absence, and the empty collections file. This structural audit does not replace full TypeScript typechecking, unit tests, build, or CLI end-to-end verification.
