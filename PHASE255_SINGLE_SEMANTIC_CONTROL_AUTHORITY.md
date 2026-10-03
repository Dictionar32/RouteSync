# Phase 255 — Single Semantic Control Authority

Phase 255 removes the last duplicate control rewrite engine from the evidence layer.

## Before

```text
control evidence
    -> evidence solver
    -> normalized evidence

control evidence
    -> unified control solver
    -> canonical semantic control
```

Two rewrite authorities could theoretically drift.

## After

```text
parser / language evidence
        |
        v
control evidence relations
        |
        v
Unified Declarative Control Program
        |
        v
semi-naive / fixed-point relation solver
        |
        +--> choice / repetition
        +--> guard / merge / fixed_point
        +--> canonical control
        +--> scope / dependence
        +--> control versioning
```

`semanticControlEvidence.ts` is now an inert ontology: typed evidence facts plus relation schemas. It deliberately has no solver and no rewrite rules.

The only semantic control rewrite authority is `semanticControlProgram.ts`, which composes the evidence-to-control rules, construction rules, canonical control rules, dependence rules, and version rules into one relation program.

## Control constructs

`if`, `switch`, `while`, `for`, and `foreach` are recognized only at the syntax/evidence boundary. Their semantic representation after that boundary is relation data such as `control`, `control_predicate`, `control_alternative`, `repetition_body`, and `repetition_predicate`.

The semantic engine never dispatches on those source construct names. The generic relation solver derives the semantic control graph by rewrite and fixed-point saturation.

## Result

There is one semantic control program and one semantic control solver. Evidence production is not a competing semantic interpreter.
