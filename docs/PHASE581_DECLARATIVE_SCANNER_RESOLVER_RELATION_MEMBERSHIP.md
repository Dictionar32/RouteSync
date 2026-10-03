# Phase 581 — Declarative Scanner/Resolver Relation Membership Cutover

## Objective

Push the construct-free frontier through the remaining scanner/lexer/resolver surfaces and the compiler compatibility/constraint boundary. Host-language semantic machinery is not allowed in the audited production frontier:

- `if`, `for`, `while`, `switch`, ternary
- `.map`, `.filter`, `.reduce`, `.flatMap`
- `new Set`, `Set` types
- `undefined`, `??`, `===`, `as unknown`, TypeScript `any`

Target-language evidence such as PHP `null` and the Laravel route method spelling `any` remains lexical/domain evidence and is not treated as host semantic machinery.

## Architectural cutover

### 1. Relation membership algebra

Added `semantic/kernel/relationMembership.ts` with relation-native membership operations:

- `relationContains`
- `relationInsert`
- `relationUnique`
- `relationRemove`

This replaces host `Set` state in semantic closure, scanner indexes, recursive guards, relation solvers, and type constraints.

### 2. Scanner/lexer closure

The scanner production frontier was audited and migrated away from host `Set`/`any` machinery, including:

- semantic relation solver/store
- relational algebra anti-join and uniqueness
- semantic rewrite/closure engines
- syntax vocabulary groups
- route syntax relations
- data-flow closure
- semantic evidence compiler
- semantic knowledge validation
- resource structural matching
- controller/route scanner model-name contexts
- provider operation vocabulary
- variable-root resource field binding
- resource upstream expression mappings
- `CycleDetector`

### 3. Compiler compatibility + generic solver

`ContractInputBoundary` now uses an ADT visitor instead of `switch`, and legacy union resolution is relation-fold based.

Constraint state no longer uses `Set<SemanticType>`; bounds are relation membership sequences. Constraint propagation, property rules, equality merging, subtype propagation, and variable resolution use relation membership operations.

### 4. Semantic type/Zod model indexes

`SemanticFieldSet`, `ModelCastCollection`, and `ZodObjectShape` no longer maintain host `Map` indexes solely for semantic lookup. Lookup is expressed through relation selection over canonical entries.

### 5. PHP syntax-evidence boundary

The expression/statement evidence context no longer exposes TypeScript `any`. Concrete PHP AST and semantic vocabulary types are used instead. The scanner's source-language `null` remains explicit evidence rather than being used as absence.

## External research basis

The design direction was checked against declarative systems including MLIR PDLL/PDL, Statix scope graphs, FLIX fixed-point lattices, Rascal syntax/pattern matching, differential dataflow, Ascent, egglog, and CiaoPP.

The relevant convergence is:

1. syntax is represented as typed/algebraic data;
2. semantic facts are relations;
3. name/constraint resolution is a constraint problem;
4. rewrite rules are declarative transformations;
5. closure/fixpoint is an execution primitive;
6. indexes are derived relational structures rather than semantic truth;
7. provenance/evidence stays attached to derivations.

RouteSync's distinction is that the host TypeScript semantic frontier itself is being reduced to these relational primitives, while the PHP scanner remains an evidence boundary.
