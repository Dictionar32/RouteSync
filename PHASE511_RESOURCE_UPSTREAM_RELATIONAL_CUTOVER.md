# Phase 511 — Resource Upstream Expression Relational Cutover

Date: 2026-10-01

## Target

`packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts`

## Architecture

The resource upstream expression boundary now treats PHP AST input as syntax evidence and routes semantic construction through relation primitives and the requirement/rewrite solver:

`syntax evidence -> relation facts -> candidate/witness requirements -> recursive relation closure -> canonical upstream value`

## Cutover

- builtin-function discovery uses a relation lookup instead of absence-sentinel branching
- collection projections use `relationProject`
- expansion uses `relationExpand`
- sequence construction uses recursive relation closure
- statement dispatch uses `solveRewriteCandidate`
- branch dispatch uses rewrite candidates
- recurrence clauses use rewrite candidates
- unset target/destructuring resolution uses relation candidates
- parameter-type resolution uses nested requirement/rewrite candidates
- unsupported-reason resolution uses relation candidates
- Attribute factory accumulation uses `relationFold`
- equality/compound predicates use semantic relation predicates

## Closed surface audit

The target contains zero occurrences of the requested forbidden constructs:

- `if`, `for`, `while`, `switch`
- `map`, `filter`, `reduce`, `flatMap`
- `undefined`, `??`, `null`
- `===`, `as unknown`, `||`, `&&`
- `.trim()`, `.slice()`
- `never`
- ternary operator

Audit command:

`npm run audit:scanner-lexer:phase511`

Result: `closedSurfaceClean: true`.

## Validation

The TypeScript compiler reports no syntax-parser diagnostics (`TS1005`, `TS1109`, `TS1128`, `TS1136`, `TS1160`) for the target. Full target type-check remains blocked by existing repository typing/path issues and additional typing diagnostics exposed by the direct standalone invocation; therefore no full type-check pass is claimed.

## Frontier after Phase 511

1. `subscanners/form-request/ruleCollector.ts` — 51
2. `subscanners/resource/resourceAstExpressionMapper.ts` — 51
3. `subscanners/requestAstCanonical.ts` — 50
4. `descriptors/request/controllerActionContract.ts` — 48
5. `descriptors/validation/validationRuleSet.ts` — 46
6. `subscanners/RouteScanner.ts` — 43
7. `subscanners/model/propertyProducer.ts` — 43
8. `subscanners/resourceProducer.ts` — 43
9. `subscanners/FormRequestScanner.ts` — 42
10. `subscanners/model/memberPropertiesParser.ts` — 42
