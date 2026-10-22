# RouteSync Phase 2460 — Laravel Model Operation Boundary

## Goal

Continue Phase2459 by narrowing the model scanner's runtime surface to the existing upstream `LaravelModelScannerInterface`. This phase does not create another interface and does not pretend the remaining model helpers have been migrated.

## Changes

- Kept `laravelModelScanner` as the canonical exported operation typed as `LaravelModelScannerInterface`.
- Made `scanModelBundle` private to the implementation. Its bundle type is private and contains only the artifact collection actually consumed by the scanner judgment.
- Removed the unused exported `scanModelAsts` helper, which bypassed the closed judgment boundary.
- Removed the unused `resolveModelColumns` re-export and its direct subscanner dependency from the canonical scanner module.
- Rewrote `modelPropertyAstParser.ts` to use syntax-local token/array operations rather than `semantic/relations`; its output remains syntax evidence, not semantic judgment.
- Kept the pipeline wired directly to `laravelModelScanner` through the existing `LaravelSourceAstPipelineDependenciesInterface`.
- Added `audit:phase2460-laravel-model-operation-boundary` to verify the operation boundary and record unresolved helper debt.

## Audit

The Phase2460 audit checks 8 assertions. One assertion explicitly verifies the known debt inventory: 12 model helper files still import `semantic/relations`, while zero files in that scanned model-helper directory directly import `semantic/foundation`.

## Still Open

This phase does **not** complete the requested full migration away from `subscanners/model`. The following remain unresolved:

1. The 12 model helper files that directly import `semantic/relations`.
2. The implementation ownership of model parsing, cast/accessor/relation extraction, and model production beneath the scanner operation.
3. A transitive dependency audit for `semantic/foundation` across the full Laravel CLI path.
4. Full TypeScript typecheck, Vitest, package build, and end-to-end CLI validation; this extracted workspace has no local `node_modules`.

The next fix must trace each helper's semantics and establish/reuse the correct upstream contract before removing the relation helpers. Blind textual replacement or moving the files without changing ownership is not accepted as completion.

## Contract Gap Found During Trace

`parseModelPropertyAsts` is still exported as a free function and is consumed by multiple scanner/compiler paths. It has no dedicated upstream operation contract. I did **not** invent an upstream interface that imports compiler-owned lexer types, because that would reverse the dependency direction. The correct next step is to establish the lexical token/property syntax vocabulary at the appropriate upstream owner (or reuse an existing syntax contract) and then type the parser operation against it before moving ownership.

The parser rewrite was syntax-transpiled, but no behavioral test suite currently directly targets `parseModelPropertyAsts`; full semantic equivalence has therefore not been established.


## Superseded follow-up — Phase2476

The specific `parseModelPropertyAsts` contract gap described above was closed by Phase2476 using the already-existing `SourceAstSyntaxParserInterface.parseProperties` operation. The free parser was removed from `subscanners/model` rather than moved into `lexer`, and the model, resource-evidence, and FormRequest consumers now call `sourceAstSyntaxParser.parseProperties(tokens)`. This does not retire the entire `subscanners` or `lexer` directories; their remaining imports require a broader consumer-by-consumer migration.
