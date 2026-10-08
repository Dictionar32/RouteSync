# Phase 252 — Declarative Control Construction Relations

Phase 252 removes the remaining procedural semantic-construction boundary between normalized control relations and `SemanticChoice` / `SemanticRepetition` materialization.

## Architecture

```text
parser / language evidence
        ↓
control evidence relations
        ↓
declarative control program
        ↓
solver / rewrite engine
        ↓
normalized_choice / normalized_repetition
        ↓
construct_choice / construct_repetition
        ↓
choice_predicate / choice_subject / choice_alternative
repetition_*_fact
        ↓
semantic control materializer
        ↓
SemanticChoice / SemanticRepetition
```

The construction layer is itself relation data. The materializer is therefore a typed projection of already-solved semantic facts rather than the place where control meaning is inferred.

## Relation rules

Normalization now derives construction facts:

- `normalized_choice(C,K) -> construct_choice(C,K)`
- `choice(C,K) + predicate(C,P) -> choice_predicate(C,P)`
- `choice(C,K) + control_subject(C,S) -> choice_subject(C,S)`
- `choice(C,K) + alternative(C,O,P,Ct) -> choice_alternative(C,O,P,Ct)`
- repetition properties are projected to `repetition_*_fact` relations.

This keeps the semantic authority inside the relation program and solver.

## Boundary invariant

`if`, `switch`, `while`, `for`, and `foreach` remain parser/evidence vocabulary only. No semantic control construction rule matches those source construct names.

The construction layer also keeps `Map`-style lookup confined to derived implementation indexes; semantic truth remains relation facts.

## Validation

- declarative construction relation test: PASS
- Phase 251 materialization regression: PASS
- focused TypeScript compilation: PASS
