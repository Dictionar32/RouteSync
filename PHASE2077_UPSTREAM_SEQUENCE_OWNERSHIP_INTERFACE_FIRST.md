# Phase 2077 — Upstream Sequence Ownership (Interface First)

## Change

- Added `packages/core/src/types/upstream/sequence.ts` as the canonical owner of the closed `Sequence<T>` ADT (`empty | cons`).
- `semantic/relations/relationalSequence.ts` now re-exports that type instead of defining a second owner.
- `types/upstream/collections.ts` now imports and re-exports `Sequence` from the upstream contract directly.
- `compiler/scanner/wiring/laravelControllerScanner.ts` now obtains the `Sequence` type from upstream while retaining its existing relation operators as a clearly unfinished migration.

## Architectural result

This is a real ownership improvement, not a claim that the Laravel scanner is now relation-free. The sequence data model is upstream-owned and does not depend on relation/foundation. Runtime traversal still uses relation operations, and the scanner still calls controller subscanners and has runtime functions/class logic.

## Trace and remaining gaps

Canonical chain remains:

`Laravel source evidence -> invocation semantic judgment ADT -> declaration/action judgment -> integrated response judgment -> AST projection judgment -> correlated LaravelControllerScanArtifact -> downstream projection`.

Still outstanding:

- Replace scanner-side relation operators with upstream-owned semantic collection contracts and migrate all consumers without introducing a parallel collection vocabulary.
- Promote action derivation to a closed action semantic judgment owned by an existing upstream authority.
- Move declaration/inheritance selection into a complete typed judgment contract; current authority still contains helper functions and recursive traversal.
- Remove runtime semantic derivation from controller subscanners only after upstream contracts fully cover their decisions.
- Keep integrated response and AST projection forwarding the exact correlated invocation judgment; do not reclassify or reconstruct outcomes downstream.

## Verification

- Static source inspection only.
- Full TypeScript typecheck, build, and Vitest were not run in this environment.
- This phase does not claim full compliance with the request to remove relation/foundation, subscanner, function, const, or class runtime logic.
