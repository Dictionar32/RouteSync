# Phase 246 — Stratified Declarative Control Negation

## Goal

Continue elevating `if`, `switch`, `while`, and `for` away from semantic control flow and into declarative semantic relations evaluated by the relation solver.

## Research basis

The design follows established static-analysis/rewrite ideas:

- MLIR PDLL separates pattern matching from rewrite and represents rewrites declaratively.
- MLIR PDL represents rewrite patterns as IR, allowing the pattern infrastructure itself to be inspected and transformed.
- LLVM MemorySSA represents semantic state with versioned definitions and phi-like merges rather than treating source syntax as semantic state.
- Souffle/Datalog models analysis as relations and rules and supports stratified negation. A negated literal is evaluated only after the referenced relation has been completely computed in an earlier stratum.

## Change

The generic relation pattern now supports:

```ts
polarity?: 'positive' | 'negative'
```

Negative literals are **stratified absence constraints**. They cannot introduce bindings; variables must already be bound by an earlier positive premise.

The relation program validator diagnoses unsafe negative variables.

The solver now evaluates relation programs by strata:

```text
stratum 0
  positive facts / recursive positive relations
        ↓
  fixed point
        ↓
stratum 1+
  negative/absence-dependent relations
        ↓
  fixed point
```

Negative dependency cycles are rejected.

## Control semantics

`switch` default is now modeled declaratively:

```text
choice(C, multiway)
alternative(C, Case, matched, ...)
        ↓
matched_choice(C)
```

and:

```text
choice(C, multiway)
alternative(C, Default, default, stop)
NOT matched_choice(C)
        ↓
guard(Default, C, default)
```

Therefore the default branch is not semantically active merely because a default alternative exists.

## Result

The semantic layer now has:

```text
choice
predicate
alternative
matched_choice
branch
control_edge
control_transition
merge
control_join
iteration
successor
fixed_point
backedge
loop_edge
control_cycle
control_def
control_phi
loop_header
```

The source constructs `if`, `switch`, `while`, and `for` remain evidence-boundary concepts. Semantic evaluation is relation-based and solver-driven.

## Validation

- Focused strict TypeScript compilation: PASS
- Phase 246 control relation regression: PASS
- Phase 242 control versioning regression: PASS
- Switch matched/default semantics: PASS
- Unsafe negative binding validation: implemented
- Non-stratified negative dependency: rejected
