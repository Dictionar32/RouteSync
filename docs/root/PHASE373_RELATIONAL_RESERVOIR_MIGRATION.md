# Phase 373 — Relational Reservoir Migration

This phase continues semantic migration beyond the canonical authority gate.

Migrated variable resolution paths:
- `semantic/plugins/variable/modelNameResolver.ts`: lookup is consumed through `matchLookup` and relational lookup, with no host absence sentinel.
- `semantic/plugins/variable/thisResolver.ts`: context dispatch is expressed through `relationEqual` + `relationGate`.

The migration intentionally does not perform lexical substitutions such as `=== -> Object.is`, `undefined -> void 0`, or `as -> cast`. Those preserve the old semantic mechanism instead of replacing it.

External architecture references: WebAssembly declarative validation/reduction, MLIR PDLL/DRR declarative match/rewrite, Souffle typed relations/constraints, and egglog equality-saturation + Datalog.
