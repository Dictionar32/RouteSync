# Phase 530 — Semantic Execution Plan Relational Cutover

Date: 2026-10-02

## Scope

The inactive-path audit was rerun before changing the live scanner/lexer authority.
Phase 525 reports no remaining non-test inactive production candidates. Phase 528 also
reports no non-empty inactive scanner candidates. Therefore this phase targets an
active semantic execution authority rather than deleting reachable code.

Target:

`packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalExecutionPlan.ts`

## Architectural cutover

Previous authority mixed plan construction with host-language optional values and
host equality/branching:

`rewrite -> imperative plan construction`

New authority:

`semantic relation pattern evidence -> anchor witness relation -> ordered relation
plan -> solver/rewrite engine`

The plan anchor is now an explicit `RelationOption<SemanticRelationPattern>` rather
than a host-language absence value. Pattern polarity, anchor selection, schema/index
projection, premise classification, and emission traversal are resolved through the
relation kernel.

The plan compiler uses recursive relation projection/closure and relation witnesses.
It does not expose the requested forbidden parser/scanner constructs as semantic
control authority.

## Validation

Phase 530 target audit:

- `if`: 0
- `for`: 0
- `while`: 0
- `switch`: 0
- `map`: 0
- `filter`: 0
- `reduce`: 0
- `flatMap`: 0
- `undefined`: 0
- `??`: 0
- `null`: 0
- `===`: 0
- `as unknown`: 0
- `||`: 0
- `&&`: 0
- `trim`: 0
- `slice`: 0
- `never`: 0
- `index+123`: 0
- ternary: 0
- `transpileModule` diagnostics: 0

Repository `tsc` remains environment-limited by missing `node` and `vitest/globals`
type definitions; the compiler produced no target-specific diagnostics before the
environment baseline failure.

## Active frontier after Phase 530

The production scanner/lexer audit, excluding tests/archive paths, reports:

- 170 files with remaining forbidden-surface matches
- 863 total matches

The next highest live authorities are now model/route/controller scanners and
semantic relation programs, led by:

1. `descriptors/route/params/routeParameterDescriptorClass.ts` — 26
2. `subscanners/model/columnInferrer.ts` — 24
3. `subscanners/controller/actionValidationExtractor.ts` — 24
4. `subscanners/model/modelParser.ts` — 21
5. `subscanners/model/modelCanonical.ts` — 21
6. `descriptors/model/entity/modelDescriptorClass.ts` — 21
7. `subscanners/model/memberCastsParser.ts` — 19
8. `subscanners/ChannelScanner.ts` — 19
9. `lexer/controllerReturnParser.ts` — 19
10. `lexer/controllerDataflowAnalyzer.ts` — 19

This is a live-authority frontier, not an inactive-file list.
