# Phase2921 — SourceFileInventory Domain Visitor

## Purpose

Phase2920 identified `SourceFileInventory.continueWith<Result>` as a generic continuation that did not satisfy the project's requirement for domain-specific operations. This phase replaces that operation with `visitSources(visitor)`, whose contract is explicitly about visiting `SourceFile` values and has no generic result type.

## Runtime trace

`CLI scan/sync` → `ControllerInvocationManifestCompositionAuthority` → source discovery → `SourceFileInventory` → `visitSources` → concurrent source reads scheduled in inventory order → source-read settlements → identity binding → semantic judgment preparation → inventory closure → manifest builder judgment → manifest terminal.

## Domain contract

- `SourceFileInventoryVisitorInterface.visit(sourceFile)` receives one source-file domain value.
- The empty inventory's `visitSources` operation performs no visits.
- An entry inventory visits its current source and then delegates to its remaining inventory, preserving order.
- CLI source reads schedule one promise per visited source. `Promise.all` preserves the scheduled order in the resulting settlement sequence.
- `format` also uses the inventory visitor rather than generic continuation handlers.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Scope and limitations

This phase removes the generic continuation specifically from `SourceFileInventory`. It does not claim that every generic `continueWith<Result>` in the wider upstream tree has been removed; other ADTs have separate domain contracts and require their own trace before changes. The other `SourceFile[]` contracts recorded in Phase2920 remain an independent audit task. Full project typecheck, build, unit tests, and CLI E2E are not claimed unless separately executed successfully.
