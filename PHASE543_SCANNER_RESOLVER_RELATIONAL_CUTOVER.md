# Phase 543 — Scanner/Resolver Relational Cutover

## Direction

This phase continues the scanner frontier using a semantic-relation pipeline rather than imperative control constructs:

`source evidence -> candidate relation -> witness/option -> recursive relation traversal -> canonical semantic value`

The design is aligned with declarative pattern/constraint systems: MLIR PDLL separates matching from rewriting and represents rewrite patterns declaratively; MLIR PDL represents patterns as IR; Statix treats static semantics as constraint solving over terms; egglog combines equality saturation with Datalog; Rascal exposes transitive closure as a relation operation. These are architectural references, not copied implementations.

## Closed targets

- `packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts`
- `packages/core/src/compiler/scanner/subscanners/responseScanner.ts`

## Changes

### Resource collection/nested-array binder

- Relation lookup now returns a relation option instead of using `undefined` as a missing witness.
- Cardinality selection uses `relationGate`.
- Nested entry traversal uses recursive `relationFold`.
- Expression projection uses `relationProject`.
- Verified-field selection uses `relationSelect`.
- Removed loop, ternary, array `map`/`filter`, and absence-sentinel branches from the target.

### Response scanner

- Primitive type classification uses relation lookup/option folding rather than `switch`.
- Nullable wrapping is a relation gate.
- Class declaration discovery is recursive relation traversal with an explicit option witness.
- DTO/controller file traversal uses `relationAsyncFold`.
- Controller response-method selection uses relation predicates rather than imperative loops/conditionals.

## Audit

`node scripts/audit-phase543-scanner-resolver-relational-frontier.cjs`

Result: `closedSurfaceClean=true`, `transpileDiagnosticsClean=true`, `ok=true`.

Regression audits:

- Phase 542: pass
- Phase 541: pass
- Phase 540: pass

The repository-wide TypeScript check remains environment-blocked by missing `node` and `vitest/globals` type definitions; target-local transpilation is clean.
