# Phase 411 — Scanner Relational Candidate Dispatch

Phase 411 continues the migration of scanner/resolver authority from host-language control flow to semantic relations.

## Scope

The migration producer's database-type dispatch no longer uses a `switch`. It is represented as an ordered candidate relation and resolved with `relationFirstOption` + `relationOptionFold`.

The migration index-argument scanner is also expressed through relational gates and `relationAdvanceIndex`, establishing the direction for subsequent optionality migration.

## Architectural rule

```text
source token evidence
  -> semantic candidate relations
  -> requirements / relation gates
  -> RelationOption witness
  -> canonical migration AST
```

Source-language vocabulary such as `if`, `for`, `while`, or `switch` appearing as token values is not treated as host-language control authority.

## Research basis

MLIR PDLL/PDL separates pattern matching, constraints, and rewrites; DRR provides declarative rewrite rules. egglog combines equality saturation with Datalog. These systems support the RouteSync direction toward explicit semantic relations and rewrite witnesses rather than imperative dispatch.

## Verification

Repository-wide `tsc --noEmit` remains environment-blocked by missing `node` and `vitest/globals` type definitions. No repository-wide type-clean claim is made.
