# Phase2946 — Fully Explicit Manifest Filesystem Continuations

## Objective

Continue the Phase2945 upstream-to-CLI manifest audit by removing `try/catch` control flow from the remaining filesystem operations in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`. Promise outcomes are converted at the I/O boundary into existing domain judgments/settlements; the CLI composition continues by invoking the settlement ADT's `continueWith` operation.

## Changes

- `controllerSourceProjectIdentityCanonicalization.canonicalize` now maps `fs.realpath(...).then(onCanonicalized, onBlocked)` instead of `try/catch`.
- `controllerPhpSourceDiscoveryOperation.discover` maps `fs.lstat` and `fs.readdir` fulfillment/rejection through Promise callbacks and the existing `ControllerDirectoryReadSettlement` ADT.
- Existing `filesystemFailureOperation` and `nodeFilesystemFailureObservation` remain the filesystem-boundary authority; no generic result/collection abstraction was added.
- Existing source-read ADTs and settlement operations remain in use.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`CLI manifest composition → source project canonicalization → controller source discovery → SourceFileInventory.toSourceFiles() → PhpSourceDocumentReaderInterface.read() → source-read ADT / settlement ADT → identity binding → semantic judgment preparation → manifest build judgment → CLI terminal continuation`.

The filesystem boundary maps known I/O failures to explicit domain judgments. The composition no longer catches those outcomes with `try/catch`; it consumes Promise outcome callbacks and continues through the existing ADTs.

## Structural verification

Run:

```bash
npm run audit:phase2946-manifest-filesystem-no-try-catch
```

The audit checks the absence of `try/catch` in the manifest composition, explicit Promise-outcome mapping for canonicalization and directory discovery, filesystem failure mapping, source-read ADT operations, and the empty upstream collections file.

## Limits

This is a structural audit, not a full semantic typecheck. Unit tests, package build, and CLI end-to-end execution must be run in an environment with the repository's supported Node.js, package manager, and installed dependencies. It does not claim a repository-wide migration of every `export function`; that migration remains a separately audited, contract-by-contract task.
