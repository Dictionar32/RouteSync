# Phase 321 — Circular Reference Attribute Relations

RouteSync now has an explicit attribute-relation substrate inspired by Circular
Reference Attribute Grammars (CRAGs).

## Semantic model

```text
syntax evidence
    -> reference / dependency relations
    -> attribute equations
    -> seed facts
    -> monotone closure
    -> fixed point
    -> rewrite / proof
```

Attributes are not implemented as visitor-local mutable state. Each equation
states which facts may be derived from a node and its attribute dependencies.
Circular dependencies are evaluated by successive approximation until the
fact relation stops growing or a declared evaluation bound is reached.

The model follows the CRAG observation that non-local reference dependencies
and circular fixed-point equations can be expressed directly rather than as
hand-written work-list control flow.

## Safety invariant

The attribute substrate does not use source-language branching constructs as
semantic vocabulary. Presence is represented by `RelationOption`; absence is a
first-class tagged witness. This prevents `undefined`/`null` from becoming
semantic states.

## Next migration

`astClassifier.ts` should become an attribute-equation producer:

- syntax shape -> candidate relation;
- candidate -> requirements/exclusions;
- parent/child/reference dependencies -> inherited attributes;
- classification -> synthesized attributes;
- recursive expression contexts -> circular attributes where necessary.

`queryProducer.ts` should use the same attribute relation boundary for fluent
query state instead of encoding method-family dispatch as imperative guards.
