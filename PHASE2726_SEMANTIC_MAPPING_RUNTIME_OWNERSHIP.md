# Phase 2726 — Semantic Mapping Runtime Ownership

## Objective

Move mapper semantic derivation out of `compiler/scanner/subscanners`, make the exported runtime contract interface-first, and trace the CLI manifest path without changing its upstream authority or collapsing ADT judgments.

## Source changes applied

1. Moved `packages/core/src/compiler/scanner/subscanners/request-deriver/semanticMappingDeriver.ts` to `packages/core/src/compiler/semantic/request-type-derivation/semanticMappingContractDerivation.ts`.
2. Replaced the exported free function `deriveSemanticMappingContract(...)` with an internal implementation and the runtime operation object:

   ```ts
   export interface SemanticMappingContractDerivationInterface {
     readonly derive: (requestTypes: readonly RequestType[]) => SemanticMappingContract;
   }

   export const semanticMappingContractDerivation: SemanticMappingContractDerivationInterface = Object.freeze({
     derive: deriveSemanticMappingContractImplementation,
   });
   ```

3. Updated the actual consumer in `compiler/passes/lowerers/requestTypesLowerers.ts` to call `semanticMappingContractDerivation.derive(artifact.requestTypes)`.
4. Updated the old request-deriver barrel to re-export the semantic-owned object and its interface.
5. Removed a stale `./groupAggregator` barrel export because that file does not exist in this source tree and the exported symbols have no definitions in the compiler source. No replacement module or wrapper was created.
6. Added `audit:phase2726-semantic-mapping-runtime-ownership` and a static audit report.

## CLI → manifest trace audited

```text
CLI scan / sync
  → composition.manifestScanOperation.scan(input)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → canonical source-project identity
  → route source selection / controller source discovery
  → source-document reads and identity binding
  → invocation semantic judgments
  → inventory authority closes and validates receipt
  → manifestBuilderOperationPreparation.prepare(input).build()
  → Laravel source AST pipeline
  → complete Laravel source model builder
  → semantic dataflow and resource-group capability composition
  → manifest_builder_complete | manifest_builder_blocked
  → CLI request-resolution preflight and RequestType semantic projection
  → RequestTypesArtifact lowering
  → semanticMappingContractDerivation.derive(requestTypes)
  → mapper artifact lowering
```

The mapper derivation is downstream of manifest construction and RequestType projection; it does not replace or bypass the upstream manifest authority. The CLI's inventory rejection and manifest builder's `complete`/`blocked` judgments remain distinct.

## Audit results

- Phase 2726 semantic mapping ownership: **11/11 static checks passed**.
- Phase 2725 resource binding ownership re-run: **13/13 passed**.
- Phase 2686 upstream CLI manifest runtime trace re-run: **12/12 passed**.
- Relative imports in the moved implementation, lowerer, and updated barrel resolve after removal of the stale export.
- No `relationFoundation` replacement was created.
- Remaining legacy references are reported, not hidden: **37 occurrences across 28 TypeScript files**.

## Verification limits / remaining source issues

These are static audit results, not a successful project build. Full typecheck, unit tests, build, and CLI end-to-end execution have not been verified in this environment. The 37 `relationFoundation` references across 28 files still need migration to their real semantic owners. Scanner-wide wiring-only status is also not yet achieved.

## Files changed

- `packages/core/src/compiler/semantic/request-type-derivation/semanticMappingContractDerivation.ts` (new semantic owner)
- `packages/core/src/compiler/scanner/subscanners/request-deriver/semanticMappingDeriver.ts` (removed)
- `packages/core/src/compiler/scanner/subscanners/request-deriver/index.ts`
- `packages/core/src/compiler/passes/lowerers/requestTypesLowerers.ts`
- `scripts/audits/audit-phase2726-semantic-mapping-runtime-ownership.cjs`
- `package.json`
- `reports/PHASE2726_SEMANTIC_MAPPING_RUNTIME_OWNERSHIP_AUDIT.json`
