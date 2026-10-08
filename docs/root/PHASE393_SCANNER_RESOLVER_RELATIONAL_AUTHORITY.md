# Phase 393 — Scanner/Resolver Relational Authority

## Objective

Continue the migration of RouteSync scanner/lexer/resolver authority from host-language control-flow and absence sentinels toward declarative semantic relations, relation options, recursive relation closure, and canonical projection.

## Research basis

- MLIR PDLL separates declarative matching constraints from rewrite actions.
- MLIR DRR represents rewrite rules as source patterns, result patterns, and additional constraints.
- K defines executable semantics through configuration matching and rewrite rules.
- Soufflé models analysis state as typed relations and Horn-style rules.
- JastAdd circular attributes provide declarative fixed-point computation when equations are monotone over a finite-height lattice.
- egglog combines equality saturation with Datalog-style relational reasoning.
- Differential Dataflow adds incremental maintenance and iteration over changing relations.
- Salsa treats derived computations as tracked queries with dependency-aware incremental reuse.
- Ascent exposes Datalog-like rules plus lattice-valued fixed-point relations.

## Phase changes

### controllerAstCanonical

1. Sequence construction no longer delegates semantic authority to `reduceRight`; it is recursive relation closure.
2. Controller semantic-value dispatch moved from `switch` to a declarative rule catalog consumed by `relationFirst` / `relationOptionFold`.
3. For-clause dispatch moved from `switch` to a relation rule catalog.
4. Conditional branch projection moved from imperative `if` dispatch to relation rule selection.
5. Statement dispatch moved from `switch` to a declarative rule catalog.
6. Catch-handler projection uses relational projection.

### controllerMethodParser

1. `findBodyStart` uses recursive relation traversal instead of `for`/`if`.
2. `findMatching` uses recursive relation depth closure instead of imperative loop control.
3. `findParameterClose` uses recursive relation depth closure.
4. `parseParameterDefault` uses recursive relation traversal for delimiter/depth discovery.

## Semantic boundary

The migration intentionally does not reinterpret PHP syntax tokens themselves. `if`, `for`, `while`, `switch`, etc. remain legitimate *source-language evidence*. The prohibited authority is their use as the semantic engine's decision procedure after evidence extraction.

The intended pipeline is:

```text
source syntax evidence
  -> typed evidence facts
  -> candidate relations
  -> constraints / rule catalog
  -> fixed-point closure
  -> rewrite / equality saturation
  -> canonical semantic projection
```

## Verification

The repository TypeScript compiler was invoked against the extracted workspace. Compilation could not enter normal project checking because the artifact environment lacks the `node` and `vitest/globals` type-definition packages. No changed-file diagnostics were emitted before that environment-level failure.

The scanner/resolver audit remains lexical and therefore is treated as a migration map, not a proof of semantic purity.

## Remaining frontier

The largest remaining scanner/lexer authorities are still:

- `astClassifierEvidence.ts`
- `controllerMethodParser.ts`
- `modelDeclarationParser.ts`
- `controllerDataflowAnalyzer.ts`
- `phpMethodParser.ts`
- `arrayParser.ts`
- `controllerBodyParser.ts`

The next migration should target their decision catalogs, sentinel boundaries, and structural traversal rather than performing syntax-only substitutions.
