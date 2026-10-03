# Phase 367 — Construct Relation Authority

RouteSync's semantic kernel now has an explicit vocabulary for constructs that must not become host-language control-flow authority.

The vocabulary represents conditionality, iteration, selection, projection, aggregation, expansion, absence, fallback, equality, inequality, and refinement as semantic atoms. Their meaning is resolved through relation predicates, candidate rules, rewrites, and fixed-point closure.

This follows the separation visible in MLIR's declarative pattern/rewrite model, WebAssembly's declarative validation plus reduction semantics, Datafrog's monotone relations/fixed-point iteration, Ascent's relation/lattice fixed points, Flix's relation/lattice constraints, and egglog's combination of Datalog with equality saturation.

Important distinction: PHP source words such as `if`, `for`, `while`, and `switch` remain data-level syntax evidence when they occur in the input language. They are not host control-flow authority. PHP `null` likewise remains a tagged semantic atom; host absence is represented by RelationOption/Presence rather than host `undefined`/`null`.

The next migration step is to consume this vocabulary inside evidence producers and progressively remove their remaining host-language absence/equality/assertion machinery without changing PHP source semantics.
