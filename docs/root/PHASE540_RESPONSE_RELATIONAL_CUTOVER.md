# Phase 540 — Response Producer Relational Cutover

## Scope

Closed the active scanner/resolver surface:

- `packages/core/src/compiler/scanner/subscanners/responseProducer.ts`

The transformation moves response semantic authority from procedural dispatch into the existing relation vocabulary and canonical response relations.

## Architecture

```text
response evidence
  -> type/return candidate relations
  -> relation lookup / witness
  -> RelationOption / relation gate
  -> recursive branch closure
  -> canonical ResponseAst
```

### Main changes

- Primitive PHP response types use a relation catalog instead of `switch`.
- PHP property type resolution uses a kind-to-resolution relation catalog.
- Nullable type construction uses a semantic relation gate.
- DTO properties use relation projection rather than array `map`.
- Controller return resolution uses a return-kind relation catalog rather than `switch`.
- Resource/model class-vs-name selection uses relation equality + relation gate.
- Branch response extraction is recursive relation closure; missing branches are represented by `RelationOption` rather than procedural filtering.
- Sequence construction is recursive relation construction rather than `reduceRight`.
- Producer dispatch uses a typed candidate relation and relation lookup rather than `switch`.
- Unsupported producer input remains an explicit semantic failure; it is not silently converted into a fabricated response.

## Audit

`node scripts/audit-phase540-response-relational-frontier.cjs`

All forbidden AST constructs are zero for the target:

- `if`
- `for`
- `while`
- `switch`
- `.map()` / `.filter()` / `.reduce()` / `.flatMap()`
- `undefined`
- `null`
- `===`
- `as unknown`
- `||`
- `&&`
- `.trim()`
- `.slice()`
- `never`
- `index + 123`
- ternary

`transpileModule` diagnostics: zero.

## Validation boundary

Repository-wide TypeScript checking remains environment-limited by the existing missing `node` and `vitest/globals` type-definition baseline. This phase therefore claims target transpilation cleanliness, not a repository-wide typecheck pass.
