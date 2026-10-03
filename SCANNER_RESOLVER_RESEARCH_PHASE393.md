# Scanner/Resolver Research — Phase 393

## External architecture signals

### MLIR PDLL / DRR

Declarative pattern systems separate matching from rewriting and make constraints explicit. RouteSync should treat scanner output as evidence and move semantic selection into rule catalogs and constraints.

### K Framework

K makes configuration transitions executable through rewrite rules. This supports a RouteSync model where semantic state transitions are relation/rewrite facts instead of nested host-language control flow.

### Soufflé / Ascent

Typed relations and rules provide a natural representation for candidate semantic facts. Ascent additionally supports lattice-valued relations and fixed-point execution, useful for resolver closure and conflict accumulation.

### JastAdd

Circular attributes demonstrate that reachability/data-flow style closure can be expressed declaratively and iterated to a fixed point rather than hand-written as worklists.

### egglog

egglog combines equality saturation with Datalog-style relations. This suggests using equivalence classes for competing scanner interpretations and extracting a canonical semantic witness only after saturation.

### Differential Dataflow / Salsa

Incremental relation maintenance and dependency-aware query recomputation are useful for RouteSync's long-running workspace: scanner facts should be reusable, and resolver closure should invalidate only affected semantic regions.

## Proposed RouteSync synthesis

```text
Evidence
  -> Candidate relation
  -> Constraint relation
  -> Provenance / dependency relation
  -> Fixed-point closure
  -> Equality/rewrite saturation
  -> Canonical witness
  -> Projection
```

This is intentionally stronger than merely replacing `if` with a ternary, `for` with recursion, or `map` with another collection operator. Those substitutions leave the semantic authority in the same place.
