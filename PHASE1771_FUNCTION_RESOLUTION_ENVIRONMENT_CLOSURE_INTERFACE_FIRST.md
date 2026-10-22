# Phase 1771 — Function Resolution Environment Closure (Interface First)

## Trace finding

`PhpFunctionNameResolutionInput` previously accepted `PhpFunctionResolutionScope` directly. Its import and declaration collections could be empty either because the source file genuinely contained none or because the frontend had not inventoried them. Those states are semantically different, but the interface could not express the difference. That left `scope-evidence-incomplete` as an outcome without a corresponding input-level evidence model.

## Interface change

`packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts` now models:

- `PhpFunctionResolutionEnvironmentCompletenessWitness`: a source-bound witness that the namespace region, function imports, and function declarations were inventoried;
- `PhpFunctionResolutionEnvironment`: a closed union of complete and incomplete environments;
- `PhpFunctionResolutionEnvironmentJudgment`: an explicit complete/incomplete judgment consumed by `PhpFunctionNameResolutionInput`.

`PhpFunctionNameResolutionInput` now receives `environment` rather than a bare `scope` and `sourceFile`. An empty import/declaration list is no longer implicitly treated as proof that inventory was complete.

## Laravel scanner trace

The active mapper at `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts` still calls `phpFunctionCallSemanticAuthority.derive()` with a short `FunctionName`. The parser's `function_call` AST still stores one `AstIdentifier`, and `phpExpressionStructureEvidenceProvider.ts` currently selects only the first callee token. Thus the new environment contract is not yet wired into the source frontend. This phase intentionally does not change wiring before the source evidence contract is closed.

## Invocation and integrated response

The existing invocation authority still consumes `PhpFunctionNameResolutionJudgment`; this phase does not add a second invocation judgment or response projection. The integrated response/publication contract is unchanged.

## Audit

Run `node scripts/audits/phase1771-function-resolution-environment-closure.mjs`.

This is a structural static audit only. TypeScript typecheck, Vitest, and full build were not run.

## Next interface-first step

Evolve the parser/AST call-name contract so it preserves the entire callee syntax (unqualified, qualified, fully qualified, or malformed) and source spans. Then build the source-file namespace/import/declaration inventory and feed its explicit completeness judgment to the upstream resolver. Only after that should the Laravel scanner wiring be migrated and the resource subscanner retired once no consumers remain.
