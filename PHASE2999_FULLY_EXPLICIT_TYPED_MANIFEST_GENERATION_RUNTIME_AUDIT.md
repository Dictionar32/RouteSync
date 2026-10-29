# Phase 2999 — Fully Explicit Typed Manifest Generation Runtime Audit

## Objective

Continue the runtime trace from Phase 2998 and raise manifest generation/persistence knowledge into interface-owned domain operations. Terminal generation judgments must provide a domain continuation rather than merely carrying a `kind` and payload. Keep route schema evidence owned upstream and preserve it through route serialization.

## Implemented

Primary source changed: `packages/cli/src/generators/ManifestGenerator.ts`.

Interface-typed frozen runtime operations now own these steps:

- `manifestContractsFromRoutesOperation: ManifestContractsFromRoutesOperationInterface`
- `manifestGenerationJudgmentFactory: ManifestGenerationJudgmentFactoryInterface`
- `manifestRuntimeGenerationOperation: ManifestRuntimeGenerationOperationInterface`
- `manifestGenerationFromOptionsOperation: ManifestGenerationFromOptionsOperationInterface`
- `manifestRuntimePersistenceOperation: ManifestRuntimePersistenceOperationInterface`
- `manifestGeneratorOperations: ManifestGeneratorOperationsInterface`

`ManifestGenerationCompleteJudgment` and `ManifestGenerationRejectedJudgment` now expose `continueWith(...)`. Runtime generation constructs both outcomes through `manifestGenerationJudgmentFactory`, so callers can continue from the ADT without reconstructing its result from a primitive `kind` test.

Manifest persistence now follows `manifestContractValidationOperations.validate(manifest).continueWith(...)`, then `manifestSerializationOperations.serialize(...).continueWith(...)`. The validation result is no longer reinterpreted by `if (validation.kind === ...)` in the persistence runtime.

The new operation values and contracts are re-exported from `packages/cli/src/generators/index.ts`.

## Example usage

```ts
const generation = manifestGeneratorOperations.fromOptions(options);

const manifest = generation.continueWith({
  onComplete: judgment => judgment.manifest,
  onRejected: judgment => {
    throw new Error(judgment.message);
  },
});

const persisted = await manifestGeneratorOperations.save(manifest, outputPath);
const result = persisted.continueWith({
  onComplete: judgment => judgment.outputPath,
  onContractRejected: judgment => {
    throw new Error(judgment.violations.map(violation => violation.message).join('; '));
  },
  onSerializationRejected: judgment => {
    throw new Error(judgment.message);
  },
  onWriteRejected: judgment => {
    throw new Error(judgment.message);
  },
});
```

## Runtime trace

### Route source → upstream → CLI route manifest

`Laravel route declaration + controller/action evidence`
→ upstream semantic judgment and route schema evidence
→ `RouteBoundaryOptions.schemaEvidence`
→ `RouteBindingContract.schemaEvidence`
→ `RouteSemanticFlow.binding`
→ `routeManifestAstProjectionOperations.routeFlows(...)`
→ `routeSyncManifestLoweringOperations.lower(...)`
→ `manifestGeneratorOperations.generate(...)` / `fromOptions(...)`
→ `manifestContractsFromRoutesOperation.derive(...)`
→ `manifestContractValidationOperations.validate(...)`
→ validation judgment continuation
→ `manifestSerializationOperations.serialize(...)`
→ serialization judgment continuation
→ `manifestRuntimePersistenceOperation.save(...)`
→ manifest JSON write.

`ManifestSerializer.ts` retains the complete `route.binding` object. The serializer does not reconstruct schema provenance from a second field or empty/non-empty payload.

### CLI invocation manifest

The CLI invocation manifest remains a distinct projection built through `controllerInvocationManifestBuilder` and `ControllerInvocationManifestCompositionAuthorityInterface`. This phase does not claim that the invocation manifest contains route schema evidence. A shared bridge should be introduced only if an existing upstream domain owner can preserve the same source identity/evidence without creating a duplicate authority.

## Export migration audit

The specifically traced runtime modules were scanned for `export function`:

- `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
- `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts`
- `packages/cli/src/generators/ManifestGenerator.ts`
- `packages/cli/src/generators/ManifestSerializer.ts`

No `export function` declarations were found in these files. Therefore this phase did not mechanically rename nonexistent declarations. Instead, helper-shaped generation and persistence functions were placed behind domain-specific interface-typed, frozen operation objects. This is a scoped result, not a repository-wide claim.

## Static audit and verification

Repeatable audit:

```sh
node scripts/audits/audit-phase2999-fully-explicit-manifest-generation-operations.cjs
```

Result: **14/14 structural checks passed**.

TypeScript `transpileModule` syntax checks:

- `ManifestGenerator.ts`: 0 syntax diagnostics
- `generators/index.ts`: 0 syntax diagnostics
- `ManifestSerializer.ts`: 0 syntax diagnostics

This validates syntax only. Full repository typecheck, tests, CLI end-to-end, and a real Laravel fixture were not run; the workspace does not have installed `node_modules` and has known references outside this phase to relation-foundation modules intentionally not restored.

The audit also confirms:

- `packages/core/src/types/upstream/collections.ts` remains empty.
- The deleted relation-foundation modules remain absent.
- Route serialization still preserves `route.binding` and its schema evidence.

## Laravel/PHP reference basis

Laravel routing distinguishes closure routes and controller-action routes, and its dependency injection and route model binding depend on declared types and source structure. Request validation can be defined inline or via Form Request. RouteSync should preserve that semantic evidence upstream rather than infer it again in CLI serialization.

- Laravel Routing: https://laravel.com/framework/docs/routing
- Laravel Controllers: https://laravel.com/framework/docs/13.x/controllers
- Laravel Validation: https://laravel.com/framework/docs/validation/latest
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Next steps

1. Continue the reachable runtime-export inventory from upstream scanner authority through CLI invocation-manifest consumers, not across unrelated exports blindly.
2. Give upstream ADTs domain continuations at the semantic owner where missing; avoid a second schema authority and avoid adding generic relation foundations.
3. Trace schema-evidence conservation into the serialized route manifest and IR with an executable fixture.
4. Run full typecheck and focused tests once the existing workspace dependency blockers are resolved.

**Architecture rule:** raise knowledge into typed domain models; do not lower semantic decisions into scattered control flow.
