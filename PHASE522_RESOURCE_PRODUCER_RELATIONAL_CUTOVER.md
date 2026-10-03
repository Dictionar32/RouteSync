# Phase 522 — Resource Producer Relational Cutover

## Objective
Close the `resourceProducer.ts` scanner/resolver authority leak by replacing imperative collection/control constructs with declarative relation selection, projection, expansion, option witnesses, and relation gates.

## Cutover
- resource fields: relation expansion + discriminant gates
- assignments: relation refinement + expansion + projection
- method lookup: relation catalog + option fold
- JSON:API feature selection: relation-gated construction and relation-derived method catalog
- resource representation: relation gates
- resource properties: relation projection
- resource operations: relation expansion
- response customization: first-witness relation
- dynamic entries: relation-gated discriminant resolution
- sequence construction: recursive relation sequence
- optional resolver values: `RelationOption`, never language-level absence

## Forbidden surface audit
Target: `packages/core/src/compiler/scanner/subscanners/resourceProducer.ts`

All Phase 522 forbidden constructs are zero:
`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, ternary.

## Validation
- Phase 522 audit: `closedSurfaceClean=true`
- TypeScript `transpileModule`: 0 diagnostics
- Full repository `tsc`: blocked by environment-missing type definitions for `node` and `vitest/globals`; this is not claimed as a repository typecheck pass.

## Architectural direction
The scanner boundary now follows:

`PHP AST evidence -> relation facts -> candidate/option witnesses -> relation closure -> canonical resource semantic authority`

The next scanner frontier remains resolver-heavy, led by `controllerErrorDetector.ts`, followed by `routeContextTracker.ts`, `modelAccessorExpressionMapper.ts`, and `request-deriver/rawTypeConverter.ts`.
