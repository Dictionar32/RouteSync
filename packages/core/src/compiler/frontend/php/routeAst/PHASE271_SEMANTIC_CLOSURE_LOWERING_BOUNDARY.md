# Phase 271 — Semantic Closure Lowering Boundary

## Purpose

RouteSync's canonical semantic compiler boundary is now the proof-carrying relational closure, not the Knowledge/Data-Flow graph and not the legacy control projection.

## Canonical pipeline

```text
source syntax
  -> evidence producer
  -> typed semantic relations
  -> constraint calculus
  -> relational fixed point
  -> rewrite/saturation
  -> proof-carrying semantic closure
  -> target lowering
```

The target-lowering boundary accepts `SemanticCompilationArtifact` only. It therefore cannot depend on PHP statement kinds, Tree-sitter nodes, `SemanticChoice`, `SemanticRepetition`, or `controlRelations`.

## Control constructs are evidence, not semantics

`if`, `for`, `while`, `foreach`, and `switch` remain parser evidence required to understand source syntax, but they are not canonical semantic relations.

The canonical theory instead derives facts such as:

- `condition`
- `candidate`
- `requires`
- `permits`
- `excludes`
- `depends`
- `produces`
- `consumes`
- `transfers`
- `effects`
- `precedes`
- `reaches`
- `converges`
- `recurs`
- `invariant`

For example, a cycle in `precedes` can imply `reaches(x,x)` and then `recurs(x,x)`. This does not encode `while`; it encodes a relational property that may arise from many source phenomena.

## Compatibility boundary

The existing `controlRelations` projection and construct-shaped Knowledge facts remain only for migration and historical tests. They are not consumed by the new lowering boundary.

The long-term removal path is therefore:

1. migrate target consumers to `SemanticCompilationArtifact`;
2. migrate tests from construct-shaped assertions to relational closure assertions;
3. remove legacy control materialization;
4. remove `SemanticChoice` / `SemanticRepetition` from the canonical knowledge model.

## Why this is higher-level

Souffle-style relations provide declarative fact/rule computation; SMT/CHC systems provide constrained logical reasoning; K/Rewriting Logic provides executable rewrite semantics; e-graphs provide representation-space saturation; Alive2 demonstrates proof/refinement at transformation boundaries. RouteSync combines these roles around one source-independent relational semantic closure instead of adopting any source control construct as its semantic ontology.
