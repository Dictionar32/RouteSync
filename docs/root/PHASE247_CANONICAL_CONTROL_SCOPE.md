# Phase 247 — Canonical Declarative Control Scope

## Goal

Lift control eligibility/dependence above syntax. The semantic layer must not branch on `if`, `switch`, `while`, or `for` as semantic ontology.

## Research basis

- CodeQL models a data-flow graph separately from AST; `if` statements do not need to be data-flow nodes.
- MLIR PDLL/PDL represents matching and rewriting declaratively and lets generic infrastructure apply patterns.
- MLIR DataFlowSolver orchestrates dependent analyses to a fixed point.
- LLVM MemorySSA represents versioned state and phi-like merges as analysis IR rather than source constructs.
- Souffle/Datalog supports stratified negation and relation-based fixed-point evaluation.

## Phase 247 semantic elevation

Intermediate control relations are normalized into source-neutral semantic facts:

```text
control_transition(choice, outcome, continuation, polarity)
                         |
                         +---- guard(outcome, predicate, polarity)
                                      |
                                      v
control_scope(outcome, choice, predicate, polarity)

control_join(choice, left, right)
        |
        v
control_join_point(choice, left, right)

control_cycle(iteration, body, kind)
        |
        v
control_repeat(body, iteration, kind)
```

`control_scope` is intentionally derived from both a semantic `guard` and a transition. This preserves the controller identity while canonicalizing `matched/default` evidence polarity into the semantic guard polarity (`satisfied`, `unsatisfied`, `default`).

Versioning now consumes only canonical scope/join/repeat facts:

```text
control_scope       -> control_def
control_join_point  -> control_phi
control_repeat      -> loop_header
```

The versioning layer therefore does not need to understand `branch`, `backedge`, `if`, `switch`, `while`, or `for`.

## Important distinction

Procedural `for`/`while` in the relation solver remain evaluation mechanics: worklists, joins, indexing, and fixed-point iteration. They are not semantic representations of source loops.

Parser/evidence decoding may still use source-language constructs because those constructs are evidence. Semantic consumers must consume the normalized relations instead.
