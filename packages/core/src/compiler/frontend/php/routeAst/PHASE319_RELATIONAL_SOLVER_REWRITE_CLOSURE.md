# Phase 319 — Relational Solver / Rewrite / Closure Authority

## Purpose

Raise the semantic execution substrate above source-language control constructs.
The semantic solver, rewrite engine, closure engine and framework rule registry no
longer use `if`, `for`, `while`, `switch`, collection combinators, null/undefined
sentinels, strict equality operators, or TypeScript `as` assertions as semantic
control mechanisms.

## Model

```text
semantic facts
    ↓
relation patterns
    ↓
requirement / exclusion / dependency witnesses
    ↓
RelationOption
    ↓
indexed relational matching
    ↓
stratified fixed-point closure
    ↓
rewrite saturation
    ↓
provenance / derivation evidence
```

## Changes

- `semanticRelationSolver.ts`
  - matching returns `RelationOption` witnesses;
  - bindings are relation lookups;
  - instantiation is total over relation options;
  - stratification and fixed-point execution remain recursive;
  - semantic null is a tagged atom rather than an implementation null sentinel.
- `semanticRewriteEngine.ts`
  - rewrite matching and replacement use relation witnesses;
  - no undefined/null/cast-based filtering;
  - saturation remains monotone and fixed-point based.
- `semanticClosureEngine.ts`
  - canonical relation validation uses a type guard + relation choice;
  - derivation facts are consumed without casts;
  - closure remains the single high-level semantic execution boundary.
- `FrameworkRegistry.ts`
  - registry lookups now return `RelationOption`;
  - registry construction uses relational projection rather than `.map()`;
  - framework return descriptors are selected by typed relation refinement.
- `FrameworkRegistryResolver.ts`
  - return-kind dispatch uses typed relation refinement rather than `switch`;
  - optional framework-rule resolution uses relation folding.
- `frameworkRuleSelection.ts`
  - candidate selection consumes registry witnesses and the requirement solver.
- `relationalSequence.ts`
  - added `relationRefine` and `relationOptionFold` as typed witness eliminators.

## Audit

Phase 319 targeted audit is zero for the migrated semantic surfaces:

```text
if / for / while / switch
map / filter / reduce / flatMap
undefined / ?? / null
=== / !== / as
```

The parser classifier and query producer remain explicit migration frontiers and
are intentionally reported as such rather than hidden behind compatibility helpers.
