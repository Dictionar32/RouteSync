# Phase 2860 — Fully Typed Runtime Scanner Operations Audit

## Scope

This phase replaces relation-option interpretation in the AST semantic stage-transition authority with a closed domain judgment ADT. The authority is exported interface-first, its implementation is private, and both successful transitions and rejected transitions expose `continueWith` operations. The pipeline consumes the authority's continuation instead of unwrapping a generic option.

## AST semantic transition contract

`astSemanticStageTransition.ts` no longer imports `semantic/relations`. It models:

- `ast_semantic_stage_transition_constructed`, carrying the typed transition and a `continueWith` operation;
- `ast_semantic_stage_transition_rejected`, carrying `stage_pair_not_allowed` or `proof_kind_mismatch`, the source/target stages, and a `continueWith` operation.

The stage-pair and proof-kind decisions are expressed as discriminated `switch` branches. Each supported transition is paired with its exact proof variant. Unsupported pairs and mismatched proof variants produce explicit domain rejection cases instead of a generic `none` value.

Runtime export follows the required form:

```ts
export const astSemanticStageTransitionAuthority:
  AstSemanticStageTransitionAuthorityInterface = Object.freeze({
    kind: 'ast_semantic_stage_transition_authority',
    transition: astSemanticStageTransitionImplementation,
    continueWith: <Result>(...) => ...,
  });
```

The pipeline uses `astSemanticStageTransitionAuthority.continueWith(...)`; it handles the rejection reason at the domain boundary and returns the transition on success.

## CLI manifest construction trace

The CLI manifest path remains distinct from the AST-semantic stage pipeline:

```text
CLI scan/sync
  → routeSyncCliManifestScanOperationFactory
  → composition.manifestScanOperation.scan(...)
  → controllerInvocationManifestCompositionAuthority
  → source discovery and identity binding
  → invocation judgment inventory authority
  → inventoryResult.continueWith(...)
      ├─ validated → manifestBuilderOperationPreparation
      │               → ManifestBuilderJudgment
      │               → contract validation / generation / persistence
      └─ rejected  → inventory-rejected manifest terminal
```

The AST-semantic path audited by this phase is a separate upstream path:

```text
AST stage interfaces
  → astSemanticStageProofOperations
  → astSemanticStageTransitionAuthority.continueWith(...)
      ├─ constructed → typed stage transition
      └─ rejected    → stage-pair/proof rejection ADT
  → astSemanticAuthorityPipeline transition list
```

This distinction prevents claiming that the AST-semantic pipeline itself builds the CLI manifest. The CLI path continues to use the inventory and manifest-builder authorities described above.

## Verification

The structural audit is executable with:

```bash
npm run audit:phase2860-fully-typed-runtime-scanner-operations
```

Recorded checks: 11/11 pass. `collections.ts` remains 0 bytes. No production `export function` declarations were found in the audited scanner/upstream/CLI paths. The AST transition module has no `semantic/relations` import. The total relation import count in the wider scanner/upstream/CLI scope decreases from 182 to 180 statements across 90 files; remaining relation migration is not complete.

TypeScript `transpileModule` syntax checks pass for the two production files and the new test file. A focused `tsc` invocation reports no type errors in `astSemanticStageTransition.ts`; however, the wider invocation remains unsuccessful because the snapshot lacks `semantic/relations` modules, `vitest` type declarations, and has other pre-existing type errors (including the intentionally empty `collections.ts`). Vitest, full typecheck, build, and CLI E2E are not claimed as passing.

## Official TypeScript references

- Interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- Discriminated unions and exhaustive narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
