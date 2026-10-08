# Phase 430 — Scanner/Resolver Relational Property Authority

Research basis: MLIR PDLL/PDL declarative match/rewrite, MLIR DRR source/result patterns and constraints, egglog equality saturation + Datalog, JastAdd circular fixed-point evaluation.

Cutover: `compiler/scanner/subscanners/resourceProducer.ts` property lookup, array-entry lookup, boolean property resolution, and return-expression selection now use relation catalogs, `relationLookup`, `relationSelect`, `relationFirstOption`, `relationOptionFold`, and `relationGate` instead of direct find/some/filter/map control flow in those helpers.

Scope note: the file still contains unrelated legacy scanner paths; this phase does not claim whole-file zero. Source-language vocabulary such as operator strings remains data, not implementation control authority.
