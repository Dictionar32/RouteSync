# Phase 539 — Resource Upstream Relational Cutover

## Scope

Closed the active resource scanner/resolver mapping and closure surfaces:

- `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionClosure.ts`

## Architecture

`scanner evidence -> semantic relation catalog -> candidate/witness -> RelationOption -> recursive relation projection/lookup -> canonical upstream semantic form`

### Mapping surface

- structural mapping resolution now uses `relationFirstOption` + `relationOptionFold`;
- source sequence construction is recursive relation traversal;
- static receiver/action selection uses relation predicates and `relationGate`;
- argument, path, variable and destructuring collections use `relationProject`;
- parameter presence uses relation-gated semantic options;
- mapping helper names no longer encode imperative `map` semantics.

### Closure surface

- statement/body collections use recursive relation projection;
- alternative, foreach-target and for-clause dispatch use `relationLookup` + option folding;
- finally presence uses relation-gated option semantics;
- unsupported statement families remain explicit semantic failures rather than being silently reinterpreted;
- no host-language control-flow construct is used as semantic authority.

## Validation

`node scripts/audit-phase539-resource-relational-frontier.cjs`

Both targets:

- if: 0
- for: 0
- while: 0
- switch: 0
- map: 0
- filter: 0
- reduce: 0
- flatMap: 0
- undefined: 0
- null: 0
- strict equality: 0
- `as unknown`: 0
- OR: 0
- AND: 0
- trim: 0
- slice: 0
- never: 0
- index+123: 0
- ternary: 0
- transpile diagnostics: 0

Regression audits for Phase 525/528/538 also pass.

Repository-wide TypeScript checking remains environment-limited by the missing `node` and `vitest/globals` type-definition packages.
