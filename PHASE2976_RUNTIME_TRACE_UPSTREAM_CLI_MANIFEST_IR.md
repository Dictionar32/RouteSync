# Phase2976 — Runtime trace: upstream → CLI → manifest IR

## Build-log anchor

The supplied `build.log` reports 230 unresolved imports. The first shown chain is:

`packages/core/src/graph/ServiceGraphBuilder.ts` → `packages/core/src/index.ts` → `packages/sdk/src/endpoint.ts` → `packages/sdk/src/index.ts`.

The same log names `types/domain/fieldBinding.ts` and `types/domain/routeEntityDefinition.ts`, demonstrating that the failure is not limited to one pass-graph helper. The public core entrypoint makes these transitive consumers build blockers even when the CLI source itself does not directly import the deleted foundation.

## Runtime surface considered

`CLI entrypoint → CLI upstream composition → core public exports → scanner/source AST → manifest builder/graph → semantic/IR lowering → CLI manifest output`.

The CLI source has no direct import of `semantic/relations/relationMembership`, `relationalSequence`, or `semanticRelations` in this scan. It reaches blocked core consumers through the public composition and package entrypoints.

## Migrated in this phase

- `compiler/ir/semanticIRLoweringRelations.ts`: relation-based lowering rules became domain-owned `IRLoweringRule` data and an explicit `found` / `missing` judgment ADT. The exported runtime API is `irLoweringOperations: IRLoweringOperationsInterface`.
- `compiler/generators/contract-generation/response-field/typeNormalizer.ts` and `compiler/domain/common/response-lowering/mapper/wrapperResolver.ts`: switched lowering-rule lookup to the domain operation.
- `ir/buildIRNode.ts`: field-name projection now delegates to `SemanticFieldSet.names()`; exported constructors use explicit callable interfaces rather than `export function` declarations.
- `types/ir/resolvedSemanticFactory.ts`: removed direct relation-foundation imports and delegates cardinality continuation to the response domain operation; factory object has an explicit interface.
- Added regression tests for found/missing IR lowering judgments and preserved the missing-rule blocker.

## Remaining scope — not claimed complete

The current inventory still finds **499 imports in 268 files** for the three explicitly deleted modules (`relationMembership`, `relationalSequence`, `semanticRelations`) across core/CLI source. Counting all missing modules under `semantic/relations`, including `semanticRewriteEngine` and related files, yields **543 import lines across 291 files**. `core/types/upstream` alone still has 74 imports from the three explicitly deleted modules across 42 files; these are the next migration priority. The manifest graph also retains direct consumers.

This phase is a bounded IR-domain migration, not completion of the entire requested upstream → CLI → manifest IR migration. No deleted relation foundation was restored or recreated under another generic name. The full build remains blocked until the remaining consumers are migrated by their actual domain ownership.
