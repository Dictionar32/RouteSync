# Phase 340 — Semantic Rewrite Closure

Phase 340 elevates rewriting from an implementation detail into an explicit semantic relation.

## Model

```text
SyntaxEvidence
  -> SemanticFact
  -> Candidate / Requirement / Exclusion / Dependency
  -> DecisionWitness
  -> RewritePattern
  -> RewriteWitness
  -> FixedPoint Closure
  -> Lowering
```

`RewritePattern` is a semantic relation: a source value, a guarded predicate domain, and a target value. `rewriteOnce` produces a witness; `rewriteFixedPoint` repeatedly derives witnesses until no rule applies or the configured closure bound is reached.

This follows the same architectural direction found in declarative rewrite infrastructures: MLIR PDLL separates pattern matching from rewriting, while WebAssembly specifies validation as declarative constraints and execution as reduction rules. citeturn0search0turn0search1

## Boundary rule

`relationResolve` and `relationGate` remain low-level evaluation primitives. They are not semantic vocabulary for the new rewrite relation. Future migration should replace their use in authority files with typed relation closure.

## Next migration frontier

1. `TokenCursor` absence -> canonical `RelationOption` witness.
2. `queryProducer` optional values -> presence relations.
3. `astClassifier` -> syntax candidate catalog + rewrite closure.
4. `??` -> presence/fallback rewrite.
5. casts -> refinement witness.
6. ternary -> guarded candidate + rewrite relation.
