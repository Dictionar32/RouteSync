# Phase2950 — Canonicalization Failure ADT

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI manifest scan operation → composition authority → `controllerSourceProjectIdentityCanonicalization.canonicalize(input)` → `fs.realpath(requestedRoot)` → canonicalized or blocked judgment → `continueWith(...)` → manifest terminal judgment.

## Root-cause correction

Previously, a rejected `fs.realpath` retained the original rejection as `failure: unknown`, but its judgment did not expose the already-existing filesystem failure classification and location ADTs. The blocked judgment now retains three distinct pieces of evidence:

- `failureCode: FilesystemFailureCode`, classified at the Node adapter boundary through the existing `nodeFilesystemFailureObservation` and existing upstream filesystem-failure ADT.
- `location: FilesystemFailureLocation`, identifying the requested source-project root through `filesystemFailureLocationFactory.root(...)`.
- `failure: unknown`, the original rejection object, without stringifying or reconstructing it.

The canonicalization contract version advances from 1 to 2 because its blocked variant's public shape changed. Both success and blocked judgments continue to own `continueWith`, and composition routes through that operation rather than branching on `kind`.

No new generic relation, collection, sequence, or duplicate filesystem-failure abstraction was introduced. `packages/core/src/types/upstream/collections.ts` remains empty. Platform error inspection remains isolated to the Node adapter boundary; it is not promoted into downstream domain reasoning.

## Verification limits

Run `npm run audit:phase2950-canonicalization-failure-adt`. This is a structural contract audit, not a full typecheck or runtime test. Full typecheck, unit tests, build, and CLI end-to-end checks remain unverified in this phase.
