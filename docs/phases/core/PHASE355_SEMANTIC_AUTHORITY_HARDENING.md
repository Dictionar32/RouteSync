# Phase 355 — Semantic Authority Hardening

The semantic expression boundary is tightened around the canonical relation/solver/rewrite model.

## Legacy files physically erased

The following files had no production consumers and contained imperative compatibility logic:

- `packages/core/src/semantic/plugins/expression/property-access/specialAccessHandler.ts`
- `packages/core/src/semantic/plugins/expression/property-access/targetModelResolver.ts`

They are intentionally zero-byte. No compatibility implementation is retained there.

## Canonical rule

Semantic absence is represented by `Presence` / `RelationOption` relations. Candidate selection is solved by the semantic decision/constraint machinery. Rewrites are represented as semantic transformations rather than parser-language control dispatch.

PHP `null` remains valid source data. It is represented by `SemanticNullAtom` with a tagged semantic kind; host-language `null` is not used as the absence mechanism.

## Research alignment

The architecture follows the same broad semantic separation demonstrated by WebAssembly's declarative validation rules and reduction semantics, MLIR PDLL's declarative match/rewrite model, egglog's combination of Datalog and equality saturation, and Flix's relation/lattice fixpoint computation.
