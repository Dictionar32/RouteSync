# Phase 2743 — Fully Typed AST/ADT Controller Action Contract Runtime Operation

## Scope

Migrated the controller action contract API used by production controller execution wiring from exported free functions to an interface-typed, frozen operation object. This is a focused continuation of Phase 2742: it does not recreate `subscanners`, `semantic/relations`, or `semantic/foundation`.

## Source changes

- `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts`
  - `controllerRequestBindingEvidenceFromMethod`
  - `controllerRequestBindingJudgmentFromMethod`
  - `resolveControllerActionContract`
  - `schemaRequestEvidence`
  are now internal implementation functions.
  - Added `ControllerActionContractOperationsInterface` with explicit parameter and return types.
  - Added `controllerActionContractOperations: ControllerActionContractOperationsInterface = Object.freeze({...})` as the public API.
  - Added the explicit import for `ControllerActionSchemaRequestEvidence` from its upstream interface contract.
- `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`
  - Production request evidence, schema evidence, and action contract resolver bindings now call `controllerActionContractOperations`.
- `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.phase10.test.ts`
  - Tests use the operation object for the migrated APIs.
- Added `audit:phase2743-controller-action-contract-runtime-operation`.

## Runtime trace

```text
CLI scan / sync
  -> composition.manifestScanOperation.scan(...)
  -> upstream CLI manifest composition
  -> routeManifestProjectionCompositionFactory.create(requestTypeDerivationPipeline)
  -> Laravel source AST pipeline / controller execution dependencies
  -> controllerActionContractOperations.controllerRequestBindingEvidenceFromMethod(...)
  -> upstream laravelControllerRequestSemanticBindingAuthority.judge(...)
  -> controllerActionContractOperations.resolveControllerActionContract(...)
  -> action contract with closed request/body/schema/dataflow judgments
  -> manifest projection result: manifest_projected | manifest_projection_blocked
```

The operation object only projects the existing evidence and closed judgments; it does not replace upstream semantic authorities or collapse blocked outcomes into successful empty values.

## Audit and validation

- `npm run audit:phase2743-controller-action-contract-runtime-operation`: **15/15 checks passed**.
- Existing `npm run audit:phase2742-erase-subscanners-runtime-operations`: passed.
- TypeScript syntax-only transpilation of the 3 changed TypeScript files: passed.
- Audit script syntax check and `package.json` JSON parse: passed.
- Phase 2742 ZIP integrity check: passed.
- Full project typecheck, tests, build, and CLI end-to-end were not run; `node_modules` is not available in this workspace.

## Required erased directories

- `packages/core/src/compiler/scanner/subscanners/`: absent.
- `packages/core/src/semantic/relations/`: exists and contains 0 files.
- `packages/core/src/semantic/foundation/`: exists and contains 0 files.
- `relationFoundation` references under `packages/core/src`: 0.

Important unresolved condition: source files elsewhere still import modules from `semantic/relations/`, despite the directory remaining empty. This phase deliberately does not recreate those modules or introduce a compatibility/foundation replacement. The static audit is not a claim that full compilation succeeds.
