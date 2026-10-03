# Phase 586 — Scanner / Resolver Relational Cutover

## Objective

Push the remaining scanner/lexer and controller/resource resolver boundary away from host-language containers and constructor-based semantic state toward relation-indexed facts, explicit absence witnesses, and relation-driven lookup.

The design is informed by declarative relation systems and rewrite/constraint systems: Soufflé models analysis facts as typed ordered tuples; Statix models name binding as scope-graph constraints; MLIR PDLL models rewrites declaratively; and WebAssembly 3.0 specifies validation as declarative typing constraints from which an implementation algorithm is derived.

## Implemented

- `SourceStream` is now a factory-produced scanner value instead of a class instantiated with `new`.
- `ModelSymbolTable` is now a relation-backed factory/value interface.
- `OriginModelSymbol` is now a relation-backed factory/value interface.
- controller FormRequest lookup moved from `ReadonlyMap` to `RelationIndex`.
- controller action registry moved from nested `Map` state to nested `RelationIndex` facts.
- controller resource-dataflow aggregation consumes relation indexes directly.
- route controller/action lookup consumes relation indexes.
- route implicit model parameter inference uses relation-index lookup rather than a temporary host map.
- parameter primitive-type catalog uses a relation index instead of `Map`.
- source orchestration no longer constructs a FormRequest `Map` or a `ModelSymbolTable` instance.

## Semantic shape

```text
lexical evidence
  -> scanner cursor relation state
  -> token evidence
  -> declaration facts
  -> candidate controller/action facts
  -> relation-index lookup
  -> request/model/resource witnesses
  -> route binding candidates
  -> downstream fixed-point / rewrite closure
```

The relation index is an immutable tuple relation:

```text
(key, value)
```

Absence is represented by the existing `RelationOption` algebra rather than a host `Map.get()` sentinel.

## Validation

All 13 directly modified production files transpile with TypeScript's ES2022/ESNext transpiler without syntax diagnostics.

The repository-wide Phase 584 frontier audit remains useful as the global detector; it intentionally reports the remaining graph/AST/analysis/type-lowering frontier. Phase 586 is a focused cutover audit for the changed scanner/resolver files.

## Next frontier

The next implementation surfaces are:

1. remaining scanner/lexer constructor/error paths;
2. AST/upstream mapping and source-model normalization;
3. analysis/verification passes and their host collections;
4. semantic type resolution/lowering, including replacing class-constructor value objects with algebraic semantic values and relation-driven projections;
5. one cross-layer fixed-point/rewrite authority connecting scanner evidence, resolver candidates, type constraints, and target lowering.
