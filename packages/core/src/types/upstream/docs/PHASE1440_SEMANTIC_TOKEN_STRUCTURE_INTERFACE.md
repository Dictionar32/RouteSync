# Phase 1440 — Semantic Token Structure Interface

## Scope

This phase addresses the interface boundary rather than relocating scanner helpers. The consumer-facing `ScannerTokenStructureInterface` exposes token occurrences as source partitions and delimiter matches as token evidence. The public results do not expose cursor numbers or sentinel indices.

## Contract

- `locateTopLevel` returns `found` with `{ before, token, after }`, `not_found`, or `malformed` with token evidence/end-of-source location.
- `locateTopLevelCandidates` returns a complete collection of source-partition occurrences or typed malformed evidence.
- `matchLeadingDelimiter` returns opening token, contents, closing token, prefix, and suffix.
- `matchTrailingDelimiter` returns the same delimiter partition shape for a trailing closer.

The existing cursor-based `ScannerTokenStructureAlgebra` remains as a compatibility/internal algorithm surface because other scanner consumers still depend on its index-based operations. It is not considered migrated merely because the new interface exists. New expression-provider wiring uses the evidence interface for short ternary, array-access delimiter matching, and call delimiter matching.

## Authority and wiring

`scannerTokenStructureAlgebra.ts` implements the evidence interface by applying the existing structural rules and converting their internal cursor result into source partitions. The PHP evidence provider consumes partitions; it no longer receives a delimiter index or `openIndex` argument. The AST runtime wires the provider through the interface adapter.

## Remaining migration frontier

The expression conditional and root-operator algebras still expose numeric cursor-based resolutions. Other runtime parser helpers also retain numeric indices and sentinel returns for their own parsing paths. These are explicitly not claimed as complete. Follow-up work should introduce partition-based results for conditional/root-operator algebra, migrate their consumers, and only then retire the compatibility cursor surface after a complete consumer audit.

## Validation

`audit-phase1440-semantic-token-structure-interface.cjs` checks the interface contract and migrated expression-provider wiring. The Vitest regression file covers occurrence partitions, leading/trailing delimiter partitions, and malformed delimiter evidence. This workspace did not have the local `node_modules` toolchain installed, so the Vitest suite and full package build were not run in this phase.
