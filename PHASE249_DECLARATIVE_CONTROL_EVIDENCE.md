# Phase 249 — Declarative Control Evidence Normalization

## Tujuan

Phase ini memindahkan pembentukan makna kontrol satu lapisan lebih tinggi:

```text
PHP AST evidence
    ↓
control evidence relations
    ↓
relation rewrite / fixed-point solver
    ↓
normalized_choice / normalized_repetition
    ↓
SemanticChoice / SemanticRepetition knowledge
```

`if`, `switch`, `while`, `for`, dan `foreach` tetap dapat muncul pada boundary adapter karena parser harus mendekode bentuk sintaks sumber. Namun nama construct tersebut tidak lagi menjadi sumber keputusan semantik setelah boundary tersebut.

## Declarative evidence relations

Choice:

- `control(controlId, conditional|multiway)`
- `control_predicate(controlId, predicateId)`
- `control_subject(controlId, subjectId)`
- `control_alternative(controlId, outcomeId, role, continuation)`
- `control_alternative_predicate(outcomeId, predicateId)`
- `control_region(outcomeId, regionId)`

Repetition:

- `control(repetitionId, condition|iteration|counted)`
- `repetition_initialization`
- `repetition_predicate`
- `repetition_update`
- `repetition_iterable`
- `repetition_binding`
- `repetition_body`

## Rewrite program

The solver derives:

```text
control(C, conditional) → normalized_choice(C, conditional)
control(C, multiway)    → normalized_choice(C, multiway)
control(R, condition)   → normalized_repetition(R, condition)
control(R, iteration)   → normalized_repetition(R, iteration)
control(R, counted)     → normalized_repetition(R, counted)
```

No AST construct name is referenced by the rewrite rules.

## Why this is beyond Tree-sitter

Tree-sitter remains an evidence provider. The semantic layer now consumes a relation program that can be produced by other evidence providers as well. The solver can therefore operate over normalized semantic evidence without depending on a particular parser representation.

This follows the same architectural separation seen in MLIR's declarative pattern infrastructure: matching is represented independently from the rewrite action, rather than embedding semantic transformation in procedural traversal. MemorySSA provides the related precedent of overlaying versioned semantic state over source IR rather than making source syntax itself the state model.

## Boundary rule

The parser adapter is allowed to inspect syntax because it is an evidence decoder. It may recognize a PHP statement variant and emit syntax-neutral relations. It must not make downstream semantic decisions based on the PHP construct name.

The canonical semantic pipeline remains:

```text
source / parser evidence
        ↓
control evidence relations
        ↓
declarative solver / rewrite engine
        ↓
choice / repetition knowledge
        ↓
canonical control relations
        ↓
control scope / dependence
        ↓
control-state versioning
        ↓
semantic data-flow
```
