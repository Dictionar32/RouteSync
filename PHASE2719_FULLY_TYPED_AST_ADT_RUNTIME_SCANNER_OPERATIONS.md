# Phase 2719 — Fully Typed AST ADT Runtime Scanner Operations

## Scope and source changes

This phase moves the FormRequest validation semantic slice out of `compiler/scanner` into `compiler/semantic`, and migrates its public runtime operations to interface-typed immutable objects.

### Ownership changes

- Moved `scanner/operations/requestProducer.ts` to `compiler/semantic/requestProducer.ts`.
- Moved the legacy FormRequest producer implementation from `scanner/subscanners/requestProducer.ts` to `compiler/semantic/legacyRequestProducer.ts` so the remaining scanner consumer can explicitly wire to the existing legacy path while its behavior is audited.
- Moved the six-file validation descriptor implementation subtree from `scanner/descriptors/validation/` to `compiler/semantic/validation/`.
- Moved the FormRequest rule collector subtree from `scanner/operations/form-request/` to `compiler/semantic/form-request/` and removed the duplicate `scanner/subscanners/form-request/` copy.
- Moved semantic type construction out of `scanner/semanticTypeConstructionRelations.ts` to `compiler/semantic/semanticTypeConstruction.ts`.
- Added `SemanticTypeConstructionInterface` under `types/upstream` and exported it through upstream/core type barrels.
- Added `FormRequestRuleCollectionInterface` and changed rule collection exports from free functions to `formRequestRuleCollection: FormRequestRuleCollectionInterface = Object.freeze({...})`.
- Updated the scanner consumers to call semantic-owned operations; no `relationFoundation` implementation or replacement layer was created.

### Runtime operation form

```ts
export const formRequestRuleCollection: FormRequestRuleCollectionInterface = Object.freeze({
  parseCanonicalValidationRuleEntries: parseCanonicalValidationRuleEntriesImplementation,
  partitionValidationRules: partitionValidationRulesImplementation,
  parseValidationRules: parseValidationRulesImplementation,
});
```

The moved runtime files no longer export free `export function` declarations. Internal implementation functions are private implementation details behind the typed object.

## CLI manifest runtime trace

```text
CLI commands/scan.ts or commands/sync.ts
  -> RouteSyncCliUpstreamCompositionFactory.compose(...)
  -> requestTypeDerivationProductionPipelineAssembler.assemble(...)
  -> routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  -> manifestScanOperation.scan(input)
  -> controllerInvocationManifestCompositionAuthority.compose(input)
  -> source-project identity / source discovery / source acquisition / source identity binding
  -> PHP syntax and invocation AST evidence
  -> invocation semantic judgments + inventory closure
  -> manifestBuilderOperationPreparation.prepare(input).build()
  -> manifest_builder_complete | manifest_builder_blocked
  -> CLI projection only for complete/accepted results
```

Runtime source anchors inspected:

- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/commands/sync.ts`
- `packages/cli/src/upstreamCompositionFactory.ts`
- `packages/cli/src/manifestScanOperationInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`

The CLI explicitly preserves rejected/blocked judgments for project identity, source-document identity, source acquisition, source discovery, inventory, and manifest building. AST parsing alone does not authorize manifest projection.

## Relation foundation status

- No implementation file named `relationFoundation` remains in `packages/core/src`.
- No new foundation or renamed replacement layer was introduced.
- **28 source files still import the deleted module.** These unresolved references are intentionally visible; typecheck/build is expected to fail until each consumer is migrated to its real owner or an already-existing API. This phase does not hide those errors.

## Static audit

Run:

```bash
npm run audit:phase2719-semantic-request-validation-ownership
```

Result: **10/10 structural checks pass**. The audit confirms the moved semantic owners, updated runtime consumers, interface-first operations, absent relation-foundation implementation files, and CLI manifest trace anchors.

The migrated semantic slice has 10 inspected TypeScript files and **0 unresolved relative imports within those files**. A broader static scan still finds pre-existing unresolved relative imports elsewhere in the repository, including the 28 consumers of the deleted relation foundation.

## Remaining architecture work

`compiler/scanner` still contains implementation folders (`binders`, `descriptors`, `operations`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, `upstream`). Therefore this phase does **not** claim that scanner is wiring-only. It removes one coherent FormRequest/validation semantic slice. Further moves must migrate implementation ownership and consumers together, then delete old scanner files after references are updated.

## Validation boundary

- Static audit: PASS (10/10).
- Typecheck: NOT RUN / NOT VERIFIED.
- Unit tests: NOT RUN.
- CLI scan/sync end-to-end: NOT RUN.

The static audit is not evidence of a successful build. Build/typecheck remains expected to fail because the removed relation-foundation module still has 28 legacy importers, among other baseline unresolved paths.
