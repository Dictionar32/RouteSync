# Phase 2730 — Controller Dataflow Contract Ownership

## Tujuan

Memindahkan implementasi controller dataflow contract dari `compiler/scanner/subscanners/controller` ke `compiler/semantic`, mengubah API runtime publik menjadi satu objek operasi interface-first, dan memastikan pemanggil produksi menggunakan API baru. Prinsip implementasi: tipe eksplisit, tanpa generic tambahan pada API publik, tanpa wrapper/factory berlapis, dan tidak membuat ulang `relationFoundation`.

## Perubahan sumber

### Ownership

- Dipindahkan dari `packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts` ke `packages/core/src/compiler/semantic/controllerDataflowContract.ts`.
- Scanner lama tidak lagi memiliki implementasi contract tersebut.
- Facade scanner hanya mengekspor tipe yang diperlukan.
- `controllerAstCanonical.ts`, `resourceDataflowAggregator.ts`, dan regression test diperbarui agar mengarah ke semantic owner.

### Runtime API

API publik sekarang:

```ts
export interface ControllerDataflowContractOperationsInterface {
  readonly createReturnSet: (returns: readonly PhpAstValue[]) => ControllerReturnSet;
  readonly createSemanticVariableIndex: (
    bindings: readonly ControllerVariableBinding[],
  ) => ControllerSemanticVariableIndex;
  readonly lookupSemanticVariable: (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
  ) => Lookup<ControllerVariableBinding>;
  readonly lookupSemanticJudgment: (
    index: ControllerSemanticVariableIndex,
    variable: VariableName,
  ) => Lookup<ControllerVariableSemanticJudgment>;
  readonly semanticVariableIndexSize: (index: ControllerSemanticVariableIndex) => number;
  readonly empty: () => ControllerDataflowContract;
  readonly create: (input: ControllerDataflowContractInput) => ControllerDataflowContract;
}

export const controllerDataflowContractOperations:
  ControllerDataflowContractOperationsInterface = Object.freeze({
    createReturnSet: createControllerReturnSetImplementation,
    createSemanticVariableIndex: createControllerSemanticVariableIndexImplementation,
    lookupSemanticVariable: lookupControllerSemanticVariableImplementation,
    lookupSemanticJudgment: lookupControllerSemanticJudgmentImplementation,
    semanticVariableIndexSize: controllerSemanticVariableIndexSizeImplementation,
    empty: emptyControllerDataflowContractImplementation,
    create: createControllerDataflowContractImplementation,
  });
```

Implementations remain private. Public methods have concrete input/output types; no generic method was added to the operations interface. Generic `sequenceToArray<T>` helpers in this module were replaced with explicit `sequenceToControllerBindings` and `sequenceToControllerDefinitions` helpers.

The production caller now uses:

```ts
controllerDataflowContractOperations.create(...)
controllerDataflowContractOperations.createReturnSet(...)
```

The regression test uses the same object for index creation and semantic-judgment lookup.

## Trace upstream CLI → manifest

```text
packages/cli/src/index.ts
  → standalone composition loader / upstream composition factory
  → controller invocation manifest composition authority
  → canonical project identity
  → route source discovery
  → source-document reads and identity binding
  → inventory authority validates/closes the receipt
  → manifest builder
  → manifest_builder_complete | manifest_builder_blocked
  → scan/sync request-resolution preflight
  → manifest projection
  → manifest_projected | manifest_projection_blocked
```

Phase 2730 is a downstream ownership migration. It does not bypass the manifest composition authority. Both CLI `scan` and `sync` still call `manifestScanOperation.scan(...)`. Rejected inventory does not reach the manifest builder; complete and blocked outcomes remain distinct.

## Audit results

- Phase 2730 controller dataflow contract ownership: **12/12 static checks passed**.
- Phase 2729 semantic query ownership: **10/10 static checks passed**.
- Phase 2728 controller runtime binding: **9/9 static checks passed**.
- Phase 2727 resolver graph operations: **8/8 static checks passed**.
- Phase 2686 upstream CLI manifest runtime trace: **12/12 static checks passed**.
- Relative import resolution in the five changed TypeScript files: **0 missing paths**.
- `package.json` JSON parsing: passed.
- `relationFoundation` source files remain absent; current references remain **37 occurrences across 28 TypeScript files**.

These are static audits. The workspace has no `node_modules`, so full TypeScript typecheck, Vitest, package build, and real Laravel CLI scan/sync E2E are **not verified** in this phase.

## Official TypeScript references

- [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html): named object contracts and `readonly` properties.
- [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html): structural interface contracts.
- [Unions and Intersections](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html): discriminated union modeling for distinct outcomes.
