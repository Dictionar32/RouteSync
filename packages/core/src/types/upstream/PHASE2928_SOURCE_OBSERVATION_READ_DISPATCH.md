# Phase 2928 — Source Observation Owns Read Dispatch

## Root-cause trace

The previous scanner produced a source-observation judgment, but ignored its ready observations when scheduling reads. It traversed `selectedFiles` a second time and performed another `existsSync` check inside each scheduled read. That second check could convert a source disappearing between observation and read into an empty declaration list, silently treating a read failure as successful empty source.

## Contract change

The source-observation ADT now reuses the existing upstream `SourceFileInventoryVisitorInterface` from `names.ts`, whose single domain operation is `visit(sourceFile)`. Each observation exposes `visitScannableSource(visitor)`: scanned sources invoke the visitor, while an optional absent default source does not invoke it. The ready judgment exposes `visitScannableSources(visitor)` and delegates to each observation. Consumers do not need a parallel visitor protocol or a no-op callback.

The scanner schedules file reads from `sourceObservation.visitScannableSources(...)` using the canonical upstream `visit(sourceFile)` callback:

- A scanned source invokes the callback and schedules the read/parse operation.
- An optional absent default source does not invoke the callback, so no read is scheduled.
- explicit missing files remain a blocked judgment before read scheduling.
- once a file has been classified as scanned, a subsequent `readFile` failure is no longer disguised as an empty declaration list; it propagates as a read failure.

This changes runtime behavior and the ownership path, rather than moving the same check into another helper or adapter.

## Runtime path

CLI scan/sync → manifest scan operation → controller invocation manifest composition → controller source scan → `LaravelRouteScannerInterface.prepare` → selected source inventory → source existence inventory → intent-owned source observation judgment → observation-owned read dispatch → lexer/parser → route declaration composition → route AST/semantic flow → manifest judgment → CLI projection.

## Scope and verification

Run `npm run audit:phase2928-source-observation-read-dispatch`. The audit is structural. The project dependency tree is not installed in this environment, so full TypeScript semantic checking, Vitest, build, and CLI E2E are not claimed.

This phase does not claim that every exported arrow in the entire repository has been migrated to an interface-first runtime object. Such migrations require per-contract and per-caller compatibility review; bulk rewriting every exported function would change public APIs without proof.
