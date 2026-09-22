# Phase 174 — Relation Load Selection ADT

## Trace
Relation-load parsing still encoded semantic selection through raw string parsing:
`raw -> split(':') -> selected === undefined ? all : properties(split(','))`.
Array literal extraction also collapsed invalid and empty input into `[]`.

## Elevation
`ResourceRelationLoadSelection` is now the canonical semantic vocabulary:
- `all`
- `properties(PropertyName[])`

`ResourceRelationLoadTargetParts` preserves whether a raw target has a selection before target construction.
`ResourceRelationLoadLexemes` distinguishes:
- `targets`
- `empty`
- `invalid`

Thus relation-load consumers receive semantic targets and never infer `all` vs `properties` from raw strings or array length.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reports only the pre-existing environment blocker:
`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto'`.
No Phase 174 TypeScript errors remain.
