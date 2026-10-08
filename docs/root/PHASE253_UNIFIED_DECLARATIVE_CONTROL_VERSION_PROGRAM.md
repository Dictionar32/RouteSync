# Phase 253 — Unified Declarative Control Version Program

Phase 253 removes the remaining split semantic rewrite authority between the
canonical control relation catalog and control-state versioning.

## Architecture

```text
syntax / language evidence
        ↓
control evidence relations
        ↓
unified declarative control program
        ↓
relation solver / rewrite engine
        ↓
normalized control
        ↓
construction relations
        ↓
canonical control relations
        ↓
control_def / control_phi / loop_header
        ↓
semantic control-state consumers
```

`semanticControlVersioning.ts` no longer owns a second rewrite program. It is
a typed projection over the solved unified control program.

The semantic source of truth remains relations. `Map`/`Set` are implementation
indexes/projections only.

## Rationale

This follows the architectural distinction used by MLIR PDL/PDLL: pattern
matching and rewriting are represented declaratively, while the rewrite engine
performs application. It also follows the MemorySSA principle of placing
versioned semantic state in a virtual representation layered over source IR,
without making source syntax the semantic authority.

## Invariant

`if`, `switch`, `while`, `for`, and `foreach` may be recognized by an evidence
adapter, but no semantic control-version rule branches on those source names.
The solver receives relation facts and derives semantic control state by fixed
point.
