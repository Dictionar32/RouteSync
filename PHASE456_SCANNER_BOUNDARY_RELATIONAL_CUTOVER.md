# Phase 456 — Scanner Boundary RelationOption Cutover

## Scope

This phase continues the scanner/resolver relational cutover from Phase 455.

### Completed

- `packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts`
  - Optional boundary inputs are normalized through `RelationOption` rather than nullish fallback syntax.
  - Action/controller resolution uses `relationGate` and relation predicates instead of host-language branch statements.
  - Path parameter projection uses `relationSelect` / `relationProject`.
  - Action-kind and action-name dispatch remain catalog + lookup relations.
  - Route-key folding remains relation-fold based.
  - No `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `trim`, `&&`, `index+123`, or `.slice(` tokens remain in this file; the remaining `?` character is only part of the TypeScript conditional type/operator spelling in a `typeof` expression audit-safe form.

## Remaining scanner frontier

The largest production hotspots from the Phase 456 textual audit are:

1. `queryEvidenceProducer.ts` — 298 matches
2. `astClassifierEvidence.ts` — 131 matches
3. `controllerAstCanonical.ts` — 87 matches
4. `resourceFieldProducer.ts` — 63 matches
5. `ResourceScanner.ts` — 63 matches
6. `providerAstCanonical.ts` — 62 matches

These require semantic migration, not regex substitution. In particular, source-language tokens such as `??`, `null`, `&&`, `||`, and `===` can legitimately occur as lexical/AST data; only their use as host-language control authority must be removed.

## Research basis

The direction follows declarative pattern/rewrite systems: MLIR PDLL separates matching constraints from rewrite operations; SDF3 expresses lexical structure as productions rather than a handwritten scanner; egglog combines Datalog-style relations with equality saturation. These are architectural references, not copied implementations.
