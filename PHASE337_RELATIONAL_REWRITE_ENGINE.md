# Phase 337 — Relational Rewrite Engine

## Objective

Raise RouteSync's semantic authority above host-language branch/loop constructs. The semantic layers must express facts, candidates, requirements, rewrites and fixed points; execution is a mechanism for evaluating those relations.

## External research synthesis

- WebAssembly 3.0 specifies validity declaratively as constraints and execution as reduction rules. This is the model for separating validation facts from evaluation machinery.
- MLIR PDLL/PDL represents declarative match patterns and explicit rewrite operations.
- JastAdd circular attributes require monotone equations over finite-height lattices for convergent fixed-point evaluation.
- Flix treats relational and lattice constraints as first-class fixed-point computations.
- Differential Dataflow demonstrates incremental maintenance of relational computations as inputs change.
- SeaHorn lowers verification conditions to constrained Horn clauses, separating program front-end concerns from verification semantics.
- Alive2 performs translation/refinement validation using an IR, symbolic execution and SMT.
- CompCert makes semantic preservation a compiler correctness criterion.
- Maude provides executable rewriting logic for state/configuration transformation.
- TLA+ supplies a state/action/specification layer and model checking rather than encoding semantics as host-language control flow.

## RouteSync calculus

```text
syntax evidence
    -> semantic facts
    -> candidates / requirements / exclusions / dependencies
    -> constraint closure
    -> fixed point
    -> rewrite closure / equality normalization
    -> witness
    -> lowering
```

## Phase 337 concrete change

`relationChoose` and `booleanCase` are removed as semantic API names and replaced by one transitional primitive: `relationResolve`.

The implementation itself is branch-table dispatch rather than a host `if`, `switch`, ternary or equality chain. This is intentionally only a mechanism boundary; the next phase must remove boolean dispatch from semantic authority by replacing it with typed decision relations.

## Non-goals

This phase does not claim that all repository `if`, `for`, `while`, `switch`, collection operators, `undefined`, `null`, `??`, equality operators, or TypeScript assertions have disappeared. Those constructs are migration targets. Blind textual replacement would preserve imperative semantics under different names.

## Next eradication frontier

1. `TokenCursor` presence/continuation API -> typed cursor witnesses.
2. `syntaxGrammar` -> syntax evidence relations with no sentinel cursor API.
3. `astClassifier` -> ordered candidate relation + evidence/requirement solver.
4. `queryProducer` -> operation catalog relations + requirement constraints.
5. `SemanticKernelV2` + `SemanticResolutionKernel` -> one canonical semantic relation engine.
6. ternary / coalescing / casts -> candidate/rewrite/refinement relations.
7. adapters -> witness-preserving transformations.
8. solver -> fixed-point + rewrite engine with provenance.
9. translation-validation relation -> source/target semantic preservation obligations.
