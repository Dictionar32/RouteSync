# Phase 512 — Rule Collector Relational Cutover

## Target

`packages/core/src/compiler/scanner/subscanners/form-request/ruleCollector.ts`

## Architecture

The validation-rule scanner now treats syntax as evidence and derives canonical rules through relation primitives:

```text
PHP AST evidence
  -> validation-rule relations
  -> candidate/witness relations
  -> recursive nested-rule closure
  -> option relations for presence
  -> semantic rule construction
  -> canonical validation rule set
```

## Cutover

- array traversal: `relationFold`
- candidate selection: `relationGate`
- positional argument selection: `relationSelect` + `relationFirst`
- optional rule/chain evidence: `RelationOption`
- literal-string evidence: semantic relation gate
- nested validation arrays: recursive relation closure
- Rule::unique / Rule::exists / Rule::in dispatch: relation candidates
- validation parameters: relational fold
- static-key acceptance: relation-gated evidence
- column resolution: typed relational option

## Forbidden surface audit

Target has zero occurrences after code/comment/string erasure for:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, ternary.

`closedSurfaceClean: true`.

## Syntax/type validation

Standalone TypeScript invocation for the target reports no diagnostics attributable to `ruleCollector.ts`:

```text
tsc --noEmit --pretty false --skipLibCheck --target ES2022 \
  --module commonjs --moduleResolution node \
  packages/core/src/compiler/scanner/subscanners/form-request/ruleCollector.ts
```

The broader repository still has pre-existing type-level diagnostics in other files; this phase does not claim a full-repository typecheck.

## Next frontier

The next dominant scanner/resolver surfaces are:

1. `subscanners/resource/resourceAstExpressionMapper.ts`
2. `subscanners/requestAstCanonical.ts`
3. `descriptors/request/controllerActionContract.ts`
4. `descriptors/validation/validationRuleSet.ts`
5. `subscanners/RouteScanner.ts`
