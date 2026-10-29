# Phase2917 — Upstream Filesystem Failure ADT

## Root-cause finding

Phase2916 still modeled filesystem failure inputs at the CLI composition layer as raw `string` paths and `unknown` thrown values. It then reflected over the thrown value, stringified the observed code, and dispatched domain decisions from that primitive representation. The source of the design defect was not a missing CLI helper: the upstream contract had no shared typed filesystem-failure code or location judgment.

## Contract-level correction

`filesystemFailureInterface.ts` now owns the domain ADTs `FilesystemFailureCode` and `FilesystemFailureLocation`. Each variant owns `continueWith`; interface-first immutable factories construct the variants. The existing discovery blocker and source-read blocker contracts were evolved in place: their `failure_code_unrecognized` variants no longer carry a raw `StringValue` code. Unknown platform codes are represented by the named `filesystem_failure_code_unrecognized` variant, not by a fabricated string sentinel.

The CLI's `FilesystemFailureOperationInterface` now accepts `SourceFile`, `FilesystemFailureCode`, and `FilesystemFailureLocation`; it no longer accepts `string` paths or an `unknown` error parameter. Directory recursion carries the location role explicitly instead of inferring root-vs-directory from path string equality.

## Platform boundary limitation

Node.js filesystem APIs reject with runtime `Error` objects whose `code` is documented as a string. A boundary adapter must translate those platform values into the upstream ADT. The raw caught value is therefore accepted only at `NodeFilesystemFailureObservationInterface.observe`; it is not passed into the domain failure operation or blocker contracts. This phase removes `String(...)`, `Reflect.get(...)`, raw code payloads, and `unknown`/`string` from the domain operation contracts. It does not claim that interpreting an external Node.js error code can be done without any boundary mapping.

## Trace

`fs.lstat` / `fs.readdir` / `fs.readFile` rejection → `nodeFilesystemFailureObservation.observe` → upstream `FilesystemFailureCode.continueWith` → existing upstream discovery/source-read blocker factory → existing result ADT → CLI manifest composition.

## Validation boundary

The phase audit verifies contract shape and use-site wiring. Syntax transpilation and ZIP integrity are checked separately. Full project typecheck, package build, test runner, and end-to-end CLI execution must not be inferred from structural audit results.
