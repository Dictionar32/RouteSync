# Phase 517 — Type Deriver Relational Cutover

Target: `packages/core/src/compiler/scanner/subscanners/typeDeriverUtils.ts`

## Cutover

- raw type presence is represented by a relation option rather than lexical absence branches
- primitive classification is a candidate relation with first-witness selection and option folding
- exact semantic categories use relation equality
- alternative lexical evidence uses relation disjunction rather than host-language boolean disjunction
- route-domain resolution uses relation candidate selection and option folding
- scanner utility remains evidence extraction; canonical classification is relation-driven

## Forbidden surface audit

All requested scanner/resolver authority tokens are zero in the target:
`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, ternary.

## Verification

- Phase 517 lexical audit: `closedSurfaceClean: true`
- TypeScript `transpileModule` diagnostics for target: `0`
- Full repository typecheck is not claimed.

## Architecture

`raw scanner evidence -> presence relation -> candidate classification -> first witness -> canonical primitive/domain value`
