# RouteSync Phase2471 — Model Relation Dependency Closure

## Baseline and scope

Baseline: Phase2470 `Existing-Schema-Contract-Reuse`. No source files were moved. This phase continues to reuse existing model operation interfaces and the existing `SemanticType` visitor instead of introducing a parallel semantic authority.

## Trace findings

1. `modelColumnOrigin.ts` declared `correlateModelColumnFacts: CorrelateModelColumnFactsInterface`, but its implementation still referenced `relationProject`, `relationLookup`, and `relationOptionFold` without importing or defining them. This was a real unresolved-operation defect not covered by Phase2470's smoke test.
2. The native column semantic vocabulary is already `ColumnDefinition.semanticType: PrimitiveVocabulary`. Passing that evidence into `semanticType`, whose input is the domain `SemanticType` ADT, crossed two different type vocabularies. The native column projection now uses the existing `PrimitiveVocabulary` directly as a `TypeExpression` primitive.
3. `propertyProducer.ts` used `semantic/relations` for mechanical projection of parsed PHP property evidence into the existing `PropertyAst` contract. Those relation helpers have been removed from this producer; the producer's existing `PropertyProducer` interface remains authoritative.
4. `semanticTypeCanonical.ts` used relation sequence operations and an unsafe cast to dispatch semantic variants. The operation now consumes the existing domain `SemanticTypeVisitor` via `value.accept(...)`, and sequence/projection use deterministic native collection operations.
5. The operation contract `SemanticTypeCanonicalizerInterface` was missing. It is now declared in `types/upstream/semanticTypeCanonicalizerInterface.ts` and exported by the existing upstream barrel. No duplicate semantic authority was added.
6. `modelCanonical.ts` used relation helpers to project already-judged model facts into the existing `ModelAstFromSemanticInterface` output. Those imports were removed; its existing operation interface is retained.

## Changes

- `packages/core/src/compiler/scanner/subscanners/model/modelColumnOrigin.ts`
- `packages/core/src/compiler/scanner/subscanners/model/propertyProducer.ts`
- `packages/core/src/compiler/scanner/subscanners/model/semanticTypeCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts`
- `packages/core/src/types/upstream/semanticTypeCanonicalizerInterface.ts`
- `packages/core/src/types/upstream/index.ts`
- Phase2470 audit expectation updated to record the reduced relation-import frontier.
- Added Phase2471 audit and smoke scripts and package commands.

## Verification evidence

- Phase2471 audit: 13/13 assertions passed.
- Phase2471 smoke: 4/4 assertions passed, including native/casted column projection, snake_case-to-camelCase property naming, and domain visitor projection.
- Phase2470 audit: 10/10 assertions passed.
- Phase2470 smoke: 3/3 assertions passed.
- TypeScript syntax transpilation: 6/6 changed model source files passed.
- Full `tsc --noEmit` could not be used as package verification: the installed TypeScript 5.8.3 does not accept the repository's `ES2025` target/lib settings, and it reports pre-existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`. A targeted typecheck was also blocked because this extracted workspace has no `@types/node` installation. No package build, complete Vitest run, or end-to-end CLI run was performed.

## Remaining work

- `modelParser.ts` is the only file in the model scanner directory still importing `semantic/relations` directly.
- That remaining dependency must not be removed by replacing relation helpers with ad-hoc local branching. Trace its source semantics and introduce/reuse an upstream-owned typed evidence/judgment contract where the existing upstream model contracts are insufficient; wire the contract into the actual production path.
- The broader `subscanners` tree still has other `semantic/relations` dependencies; this phase does not claim to retire the entire tree.
