# Phase 510 — Source AST Scanner Relational Cutover

Date: 2026-10-01

## Objective

Move `packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts` away from imperative syntax dispatch and collection combinators into the canonical relational semantic boundary.

## Cutover

- statement expression extraction -> relation rule catalog + typed relation refinement
- statement assignment extraction -> relation rule catalog + recursive relation closure
- conditional/recurrence/try alternatives -> explicit relation witnesses
- resource return-array field extraction -> nested-array evidence relation
- method origin classification -> relation-gated semantic origin
- sequence construction -> recursive relation sequence
- property aggregation -> relation fold
- source method traversal -> recursive relation expansion/fold
- class-owner discovery -> relational range + first witness
- model accessor acceptance -> relational predicates
- request/model collection indexing -> relation projection

## Closed surface

`sourceAstScanner.ts` has zero matches for the Phase 510 forbidden surface:

- if / for / while / switch
- map / filter / reduce / flatMap
- undefined / ?? / null
- === / as unknown / || / &&
- trim / slice / ternary

The Phase 509 response-attribute surface remains closed as well.

## Validation

`node scripts/audit-phase510-source-ast-relational-frontier.cjs`

Result: `closedSurfaceClean: true`.

The TypeScript compiler reports no syntax diagnostics for `sourceAstScanner.ts`. Full project typecheck remains blocked by pre-existing repository-wide type errors and missing local Node type definitions; those are not attributed to this cutover.

## Next frontier

1. `subscanners/resource/resourceUpstreamExpressionCanonical.ts`
2. `subscanners/form-request/ruleCollector.ts`
3. `subscanners/resource/resourceAstExpressionMapper.ts`
4. `descriptors/request/controllerActionContract.ts`
5. `subscanners/requestAstCanonical.ts`

The next cutover should continue at the resource expression canonicalization boundary: evidence relation -> expression candidate relation -> recursive dependency closure -> requirement solver -> canonical rewrite.
