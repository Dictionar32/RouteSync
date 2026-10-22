# Phase 1649 — Relation Engine Ownership Migration

## Goal

Remove executable TypeScript dependencies on `core/src/semantic/foundation` while preserving relation-engine behavior and the scanner's thin caller boundary.

## Changes

- Relocated the nine relation-engine implementation modules into `packages/core/src/semantic/relations/`.
- Rewired TypeScript imports and type-only imports across the core source tree to the new owner.
- Emptied the former nine implementation files in `packages/core/src/semantic/foundation/` in place; paths remain available for migration history and do not contain executable implementation.
- Kept the declarative semantic judgment contract and generic derivation compiler independent of the relation engine implementation path.
- Kept the invocation authority and runtime executor delegation boundary intact.
- Added `audit-phase1649-relational-engine-ownership.cjs` to guard against reintroducing imports from the retired path.

## Verification boundary

This phase includes source rewiring and static architecture audits. A full package build must still be run with the repository's pinned TypeScript 7 and `tsdown` toolchain; a global TypeScript 5.8 check is not a substitute for that build.
