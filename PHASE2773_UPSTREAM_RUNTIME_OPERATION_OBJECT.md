# Phase 2773 — Upstream Runtime Operation Object

## Implemented in this phase

The source-discovery ADT eliminator on the scanner → source-model path no longer uses an exported function declaration. It is now a named, typed runtime operation object:

- `SourceDiscoveryMatcherInterface` describes the operation contract.
- `sourceDiscoveryMatcher` is exported as `export const ...: Interface = Object.freeze({...})`.
- `highLevelSourceModel.ts` invokes `sourceDiscoveryMatcher.match(...)`.
- `not_scanned` and `scanned` remain explicit ADT branches; an unscanned category still reaches the existing invariant failure in the complete-source-model builder.

## Runtime trace

`laravelSourceAstPipeline.ts` produces `SourceDiscovery<T>` → `collections.ts` defines the explicit `not_scanned | scanned` ADT and matcher operation → `highLevelSourceModel.ts` calls the matcher in `completeItems` → the existing `Sequence<T>` conversion feeds `SourceModelCatalog` → semantic/reference projection → manifest lowering → CLI.

## Remaining root-cause debt

This is a targeted runtime-operation migration, not a claim that the collection abstraction has been removed. `Sequence<T>`, `AstSequence<T>`, and `sequenceAlgebra` still exist and still form a mixed-representation boundary between discovery and source model. This phase deliberately does not replace them with `readonly T[]`, because that would merely substitute a representation and would not satisfy a collection-abstraction removal. A full removal requires a defined replacement for every multi-value AST/catalog field and migration of every producer/consumer together; otherwise the compiler/runtime contract will break.

## Verification

Run `npm run audit:phase2773-upstream-runtime-operation-object`. This audit checks the targeted source contract and the preserved explicit ADT branches. It is a static contract audit, not a full TypeScript typecheck, test suite, build, or CLI end-to-end run.
