# Phase 336 — Research Matrix

| System | Extracted primitive | RouteSync use |
|---|---|---|
| Souffle | relations + recursive Horn rules | semantic closure |
| CodeQL | relational query language + stratification | semantic query facts |
| JastAdd | circular attributes + monotone fixed point | attribute/dataflow closure |
| MLIR PDL/PDLL | match/rewrite IR | semantic normalization |
| egglog | Datalog + equality saturation | equality/rewrite convergence |
| K | configuration + rewrite rules | executable semantic state |
| Maude | reflective rewriting logic | meta-level rewrite representation |
| Flix | relation constraints + lattices | candidate obligations |
| Datafrog | embedded recursive Datalog | lightweight closure implementation |
| Differential Dataflow | incremental recursive dataflow | future incremental solver |
| DDlog | incremental Datalog | future materialized relation backend |
| Spoofax/Statix | declarative syntax/scope/type relations | parser evidence and typing |
| WebAssembly | declarative validation rules | syntax validity obligations |
| CompCert | semantic preservation theorem | translation witness target |
| Alive2 | IR refinement obligations | lowering equivalence target |
| SeaHorn | constrained Horn clauses | solver/proof backend |
| Rosette | solver-aided symbolic constraints | obligation solving |
| TLA+ | state predicates + next-state relation | transition specification |
| CIRCT/MLIR | multi-level IR + declarative rewrites | lowering architecture |
| CIAO | abstract interpretation | lattice-based analysis target |
| Crux | symbolic execution | path obligation backend |

## Architectural conclusion

No single system is the desired architecture. The strongest composition is:

```text
Evidence relations
    + typed semantic relations
    + declarative constraints
    + circular/lattice equations
    + rewrite/equality saturation
    + solver obligations
    + provenance/refinement witnesses
```

The key elevation is therefore from **control-flow implementation** to a
**semantic relation calculus whose execution strategy is replaceable**.
