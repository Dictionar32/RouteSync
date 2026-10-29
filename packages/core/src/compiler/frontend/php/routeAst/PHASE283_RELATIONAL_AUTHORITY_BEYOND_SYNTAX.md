# Phase 283 — Relational Authority Beyond Syntax

The canonical RouteAst semantic layer has one authority boundary:

```text
source grammar
  -> syntax/evidence boundary
  -> neutral semantic facts
  -> typed relations
  -> declarative semantic program
  -> constraint/rewrite solver
  -> fixed-point closure
  -> proof-carrying compilation artifact
```

Concrete PHP grammar spellings are parser evidence. They are not semantic
ontology. In particular, statement spellings corresponding to conditional,
iteration, and multi-candidate selection constructs are not present in the
canonical semantic model or semantic adapter.

The syntax registry is therefore the only permitted source-language statement
boundary inside RouteAst. The semantic adapter consumes its generic evidence
contract and emits neutral facts/relations.

The semantic behavior kernel now executes `SEMANTIC_BEHAVIOR_PROGRAM.rules`
directly. The exported program object is consequently the single declarative
rule authority; the compatibility rule array is not a second execution path.

## Design principle

Do not replace one imperative control-flow ontology with another one under a
new name. A higher semantic model must answer in relations:

- what exists (`entity`)
- what constrains it (`condition`, `requires`, `excludes`)
- what alternatives are possible (`candidate`, `permits`)
- what depends on what (`depends`, `produces`, `consumes`)
- what is ordered (`precedes`)
- what is reachable (`reaches`)
- what is recurrent (`recurs`)
- where fixed-point closure is reached (`converges`)

A source construct may generate these facts, but it must never become the
meaning-bearing node type consumed by the solver.

## External design evidence

Souffle demonstrates the useful separation of relations/facts/rules from the
engine that evaluates them. WebAssembly's specification similarly formulates
validation as declarative constraints and separates those constraints from an
effective validation algorithm. CompCert demonstrates a different but
compatible principle: semantics and compiler transformations can be expressed
as explicit mathematical artifacts and verified rather than inferred from an
imperative traversal implementation.

These systems are not being copied wholesale. They support the architectural
choice to keep syntax, semantic relations, solver execution, and lowering as
separate authorities.
