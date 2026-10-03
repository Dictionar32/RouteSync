# Phase 377 — Relational Authority Convergence

This phase continues the semantic authority migration after Phase 376.

## Changes

### SemanticResolutionKernel

`loadGraph` no longer constructs an imperative name set and performs host-language
membership branching. Duplicate model admission is now a relation lookup over the
existing model relation.

Plugin dispatch no longer extracts a selected option and accesses a nullable/value
sentinel. The plugin witness is consumed directly through `relationOptionFold`.

The kernel therefore follows:

`model relation -> lookup relation -> selection relation -> resolution`

rather than:

`mutable collection -> host membership -> branch -> nullable dispatch`.

### Parser adapter

Parser evidence remains a pure relation projection. EOF classification is consumed
through the canonical semantic equality relation and `RelationOption`/`Presence`
witnesses.

### Existing generic solver and syntax-error core

The generic relation solver and syntax-error relation core remain declarative. They
already express semantic computation through relation facts, constraints, rewrite
rules, and fixed-point solving; this phase does not introduce a second solver model.

## Boundary rule

PHP source `null` remains a tagged semantic value. It is not treated as an absence
sentinel. JavaScript absence is represented by `RelationOption`, `Presence`, or an
explicit semantic relation.

## Audit scope

Authority files audited by the Phase 377 gate must contain no semantic-authority use
of `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`,
`undefined`, `??`, `null` sentinel, `===`, `!==`, TypeScript `as`, or `unknown`.
