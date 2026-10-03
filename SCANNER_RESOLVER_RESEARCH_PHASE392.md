# Scanner/Resolver Research — Phase 392

## External design signals

1. MLIR PDLL: declarative match and rewrite sections provide a useful separation between evidence matching and semantic transformation.
2. MLIR DRR: source patterns + result patterns + additional constraints are a direct model for RouteSync candidate relations.
3. MLIR Pattern Rewriter: rewrite application can be driven iteratively until saturation/fixed point.
4. JastAdd: circular attributes provide declarative fixed-point evaluation for dataflow/reachability-like analyses.
5. Souffle/Datalog: EDB facts and IDB rules define a relation model whose bottom-up evaluation reaches a least fixed point; semi-naive evaluation tracks deltas.
6. egg: equality saturation represents multiple equivalent rewrites simultaneously and extracts a representative after saturation.

## RouteSync synthesis

The intended scanner architecture is not a parser with increasingly elaborate control flow. It is a fact-producing front end whose outputs are relations:

- syntax evidence
- typed evidence facts
- candidate semantic interpretations
- requirements/exclusions/dependencies
- recursive closure
- rewrite/equivalence classes
- canonical semantic projection

`RelationOption` is used as a typed presence witness at authority boundaries. This is preferable to using a host-language absence sentinel as semantic state.

## Remaining leakage

The largest lexical hotspots remain scanner/resolver files. They must be migrated in semantic batches, not blind textual substitution, because scanner code still needs to recognize source-language constructs such as `if`, `for`, `while`, and `switch`; the requirement is that those tokens cease to be the semantic decision mechanism after evidence extraction.
