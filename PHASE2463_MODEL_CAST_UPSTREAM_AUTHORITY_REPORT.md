# Phase2463 — Model Cast Upstream Authority

## Objective

Close the missing upstream ownership boundary for Laravel model casts. The cast semantic decision must consume typed source evidence and produce the existing canonical `ModelCast` ADT. The scanner must not use `EloquentCastMapper`, whose implementation imports `semantic/relations`.

## Changes

- Added `types/upstream/modelCastFactsAuthorityInterface.ts` with upstream-owned `ModelCastSourceEvidence`, closed `ModelCastTargetSourceEvidence` variants for literal vs class targets, `ModelCastFactsAuthorityInput`, and `ModelCastFactsAuthorityInterface`. Its input contains no compiler AST types.
- Added `types/upstream/modelCastFactsAuthority.ts` and `export const modelCastFactsAuthority: ModelCastFactsAuthorityInterface`. It owns mapping Laravel cast labels to the existing `CastType` ADT, preserves literal-vs-class target evidence, property identity, and source provenance, and has no direct `semantic/relations`, `semantic/foundation`, or `EloquentCastMapper` dependency.
- Added `compiler/scanner/modelCastEvidenceProducer.ts` with `export const modelCastEvidenceProducer: ModelCastEvidenceProducerInterface`. It extracts cast entries from the existing PHP AST and emits upstream-owned source evidence; it does not classify target types.
- Wired `laravelModelScanner.ts` as `AST → source evidence producer → upstream cast authority → ModelCast[]`.
- Removed `compiler/scanner/modelCastFactsDerivation.ts`, which mixed compiler-owned AST input and cast semantic decisions in a scanner-local contract.
- Updated the Phase2462 audit to validate the evolved upstream authority boundary.

## Cast compatibility smoke test

Six cases passed against the transpiled authority implementation:

- `integer` → `integer`
- `decimal:2` → `float`
- `boolean` → `boolean`
- `array` → `json`
- `immutable_datetime` → `date_time`
- a custom class cast → existing fallback `string`

The last case preserves the previous scanner's output representation; `ModelCast` currently has no dedicated custom-cast target variant. A future closed-ADT evolution may be needed if generator semantics must distinguish custom casts.

## Audits

- Phase2463 upstream cast authority: 11/11
- Updated Phase2462 accessor/cast boundary: 9/9
- Phase2461 accessor upstream closure: 8/8
- Phase2460 model operation boundary: 8/8
- Phase2459 model scanner interface-first: 11/11
- Phase2458 pipeline composition boundary: 7/7
- Phase2457 resource evidence boundary: 6/6
- Phase2456 existing contract reuse: 7/7
- Phase2454 route dependency closure: 11/11
- Phase2453 prepared executor: 9/9
- Phase2452 closure return authority: 7/7 scoped checks, with architecture debts still open
- TypeScript transpile syntax checks for four changed files: 4/4
- Cast authority runtime smoke: 6/6
- `package.json` JSON parsing and ZIP integrity: passed

## Validation limitations

A full project typecheck is not clean. It is blocked by missing Node.js type declarations and reports numerous existing type errors across unrelated scanner and upstream files, including missing `ResponseDtoPropertyTypeEvidence` and lexer/AST classification errors. Full Vitest, package build, and end-to-end CLI regression were not run. This phase does not claim those validations passed.

## Remaining architecture debt

- Accessor evidence and its derivation contract still use compiler-owned AST types; only cast semantics have moved behind upstream-owned evidence.
- Nine files in `compiler/scanner/subscanners/model` still directly import `semantic/relations`; the full model subscanner migration is not complete.
- `semantic/foundation` transitive dependencies across the complete CLI path have not been exhaustively verified.
- `modelVocabulary.ts` itself still imports `semantic/relations`; this separate upstream relation vocabulary debt remains open.
- `projectPhpAstExpressionToUpstream` / `phpAstExpressionSemanticAuthority` remains a transitive relation dependency for accessor expression conversion.
- `ModelCast` does not distinguish custom cast classes from string casts in its current target ADT.

## Technical references

- TypeScript Handbook, Interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- TypeScript Modules Reference: https://www.typescriptlang.org/docs/handbook/modules/reference
- Laravel Eloquent Mutators & Casting: https://laravel.com/framework/docs/eloquent-mutators

The official references establish interface/module contracts and Laravel cast behavior. Implementation findings and audit outcomes above come from the RouteSync source snapshot.
