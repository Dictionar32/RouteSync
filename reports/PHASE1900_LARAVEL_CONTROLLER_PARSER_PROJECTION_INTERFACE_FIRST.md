# Phase 1900 — Laravel Controller Parser Projection, Interface First

## Trace result

- `LaravelControllerInvocationSemanticJudgmentInterface` remains the single canonical Laravel invocation judgment. No second judgment type was introduced.
- The judgment interface now owns `LaravelControllerAstProjectionContext`, a closed discriminated union: `syntax_only` or `invocation_semantic_judgment` carrying the canonical judgment.
- Parser entry points no longer accept independent `filePath` and integrated-response arguments. Semantic projection derives both from the same judgment.
- `ControllerBodyAst`, `ControllerMethodAst`, and `ControllerDeclarationAst` preserve the projection mode in their types. A syntax-only body has `dataflow: undefined`; it does not fabricate a `not_connected` integrated response.
- Attribute and provider scanners explicitly select syntax-only projection.
- Middleware and response scanners were traced as semantic consumers because their producers call controller semantic projection and read `body.dataflow`. They therefore use an explicit source-bound judgment, currently an authority-produced `not_connected` outcome, rather than being incorrectly classified as syntax-only. Actual whole-file invocation pipeline delivery to those scanners remains follow-up work.
- The production Laravel controller scanner still calls `parseControllerDeclarationFromInvocationJudgment` with the judgment from the closed inventory.
- Scanner contract versions were advanced to match the interface change: scanner contract 16, boundary contract 67.

## Constraints preserved

- No duplicate invocation judgment model.
- No new imports from `semantic/relations` or `semantic/foundation` were added by the projection contract.
- No new `legacy` label or legacy inventory was introduced.
- No build or TypeScript compilation was run.

## Validation

- `node --check scripts/audits/audit-phase1900-laravel-controller-parser-projection-interface-first.cjs`: passed.
- `node scripts/audits/audit-phase1900-laravel-controller-parser-projection-interface-first.cjs`: 10/10 checks passed.
- `python3 -m json.tool package.json`: passed.
- TypeScript compilation and test execution were not run.

## Official references consulted

- TypeScript Handbook, narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel 12 controller documentation: https://laravel.com/framework/docs/12.x/controllers

The TypeScript reference supports the closed projection-context union; Laravel's controller documentation supports distinguishing syntax facts about declarations/methods from behavior that requires semantic analysis.
