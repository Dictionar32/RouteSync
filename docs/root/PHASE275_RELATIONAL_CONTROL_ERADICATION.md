# Phase 275 — Relational Control Eradication

## Objective

Eliminate `if`, `for`, `while`, `switch`, `foreach`, and construct-shaped
selection/repetition from the canonical semantic authority. Syntax remains parser
evidence only. The semantic authority is the typed relation theory and its
solver/rewrite closure.

## Boundary

```text
PHP syntax
  |
  v
parser evidence
  |
  v
syntax evidence projector
  |
  v
neutral semantic facts
  |
  +--> predicate
  +--> region
  +--> candidate
  +--> outcome
  +--> guarded dependency
  |
  v
canonical relations
  |
  +--> condition
  +--> requires
  +--> permits
  +--> excludes
  +--> reaches
  +--> recurs
  +--> converges
  |
  v
constraint solver + relational closure
  |
  v
rewrite / semantic compilation artifact
```

## Changes

### 1. Statement constructs are evidence-only

`phpAstSemanticKnowledgeDataFlowAdapter.ts` has no dispatch or output for:

- `if_statement`
- `for_statement`
- `while_statement`
- `foreach_statement`
- `switch_statement`
- `controlRelations`
- `semanticControl*`

Concrete statement recognition remains isolated inside the syntax/evidence
projector. The semantic adapter consumes only the neutral projection.

### 2. Expression selection is relational

The following expressions no longer produce `SemanticChoice` facts:

- ternary
- short ternary
- null coalescing
- match expression

They produce `region`, `predicate`, `candidate`, `outcome`, and guarded
dependencies instead.

A satisfied guard becomes `requires(outcome, predicate)` and an unsatisfied
guard becomes `excludes(outcome, predicate)`. Candidate membership remains a
relation, allowing the solver to derive `permits` without a selection node.

### 3. Canonical fact model no longer contains construct-shaped variants

`SemanticFact` no longer has:

```text
choice
repetition
```

The historical definitions are isolated in
`semanticLegacyControlKnowledge.ts` for migration and old control-program tests.
They are not part of the canonical fact union and cannot be emitted by the
semantic adapter through its typed API.

### 4. Guarded relations become canonical theory facts

The canonical relation projection now interprets a semantic guard as:

```text
satisfied   -> requires(source, predicate)
unsatisfied -> excludes(source, predicate)
```

This keeps polarity declarative and lets the relational solver reason over it.

## Verification

Strict targeted TypeScript compilation passes for the changed semantic model,
legacy compatibility boundary, parser adapter, evidence projector, canonical
relation projection, and legacy relation bridge.

Phase 273 and Phase 274 runtime smoke tests pass after the changes. Phase 273's
construct-free test now also covers ternary, null-coalescing, and match expression
paths and asserts that no `choice` or `repetition` fact can appear anywhere in
the produced canonical model.

## Architectural invariant

```text
syntax name != semantic ontology

if/for/while/switch/match/ternary/??
          |
          v
       evidence
          |
          v
 predicate + candidate + guard + dependency
          |
          v
       relations
          |
          v
       solver
          |
          v
 semantic consequences
```

The remaining legacy control modules are compatibility infrastructure only. New
canonical consumers must enter through `semanticRelations` / `semanticClosure`.
