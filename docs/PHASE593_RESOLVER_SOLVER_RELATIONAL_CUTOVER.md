# Phase 593 — Resolver / Generic Solver Relational Cutover

## Objective

Move another semantic-authority frontier from host containers/classes into immutable semantic relations and recursive closure.

## Changed surfaces

- `constraints/UnionFind.ts`
  - replaced mutable `Map` parent/rank state with immutable `RelationIndex` witnesses;
  - equality is represented by relation closure and `createUnionFind` / `unionFindFind` / `unionFindUnion` functions.
- `constraints/TypeEnvironment.ts`
  - replaced class + `Map` bindings with immutable `RelationIndex` bindings;
  - absence is represented by `RelationOption`.
- `constraints/solver/constraintStep.ts`
  - constraint rules now return `{ changed, states, unionFind }` witnesses;
  - rule dispatch is a declarative tuple catalog rather than a host `Map`.
- `constraints/ConstraintSolver.ts`
  - constraint index, neighbor graph and variable state are relation indexes;
  - propagation is recursive fixed-point traversal.
- `constraints/solver/variableResolver.ts`
  - removed `ImmutableSet` and constructor use from the generic solver path;
  - union construction goes through the semantic construction boundary.
- `scanner/resolvers/RouteDomainResolver.ts`
  - removed resolver class construction authority;
  - domain resolution is now `resolveRouteDomain` over ranked candidate relations;
  - compatibility is a frozen projection object.

## Semantic model

```text
constraint facts
      ↓
constraint relation catalog
      ↓
relation-indexed variable bounds
      ↓
equivalence relation
      ↓
recursive propagation
      ↓
fixed-point witness
      ↓
TypeEnvironment relation
```

Route-domain resolution follows:

```text
route evidence
      ↓
ranged candidate facts
      ↓
rank relation
      ↓
first valid witness
      ↓
canonical domain value
```

## Audit

The Phase 593 AST audit covers the changed semantic surface and reports zero occurrences of the banned host constructs: `if`, `for`, `while`, `switch`, ternary, `map`, `filter`, `reduce`, `flatMap`, host `undefined`, host `null`, `??`, `===`, `!==`, `as unknown`, `Set`, `Map`, `any`, and `new`.

This is a **surface audit**, not a repository-wide cleanliness claim. Legacy semantic-type constructors remain in the compatibility projection inside `SemanticType.ts`; they are the next semantic-lowering frontier rather than being hidden behind a false zero-leak claim.

## Validation

The changed files transpile successfully with TypeScript's `transpileModule` diagnostics set to zero.

Repository-wide `tsc` remains blocked by the existing environment requirement for `node` and `vitest/globals` type definitions.
