# Phase 270 — Proof-Carrying Semantic Closure

RouteSync's canonical semantic API is now a single construct-free closure pipeline:

```text
syntax evidence
    -> typed semantic relations
    -> constraint calculus
    -> relational fixed point
    -> rewrite closure
    -> proof/provenance
    -> target lowering
```

The canonical API does not accept `if`, `for`, `while`, `switch`, `choice`, `decision`, `branch`, `loop`, or `repetition` as semantic relations.

Those constructs may still exist in parser/evidence and legacy compatibility code, but they cannot cross the canonical semantic boundary.

## Why this is higher-level

Tree-sitter supplies syntax evidence. CodeQL models semantic data flow. Souffle supplies typed relations and Datalog fixed points. cvc5 supplies first-class finite relations, joins and transitive closure. MLIR supplies declarative operation rewriting. K/Maude show rewriting logic as an executable semantic framework. RouteSync combines the useful ideas into a compiler-specific semantic closure layer where the ontology is relation/constraint based and source control constructs are not semantic authorities.

## Proof-carrying result

Every canonical closure result exposes evidence. A downstream lowering can inspect the relation and the rule/premises that caused it instead of rediscovering semantics from PHP syntax.
