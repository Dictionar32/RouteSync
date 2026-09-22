# Phase 43 — Controller Dataflow Re-classification Boundary

## Scope
- Entire `packages/core/src` active scope.
- `packages/core/src/compiler.ts` is legacy and excluded.

## Root found
`controllerDataflowContract.ts` still re-derived controller model origin from raw `PhpAstValue` by searching parameters and reverse-searching definitions.

Old semantic path:

```text
PhpAstValue
  -> parameters.find()
  -> definitions.reverse().find()
  -> resolveModelOrigin()
  -> ControllerModelOrigin
```

This duplicated semantic inference already produced by the controller scanner.

## Repair
- `ControllerSemanticVariableDefinition` now carries canonical `ControllerVariableSemantic` from `types/upstream/controller.ts`.
- `ControllerSemanticVariableIndex.lookupVariable()` now exposes `Lookup<T>` instead of `T | undefined` / `has()+get()`.
- Resource binding collection now receives one semantic variable index and resolves variable model origins from the producer semantic fact.
- Removed parameter `find()` and reverse definition `find()` from `resolveModelOrigin()`.
- Removed the `length === 0 ? undefined : ...` argument sentinel from the semantic binding path.

## Important boundary
The raw AST remains available as `ControllerDataflowContract.ast`; it is not deleted. It is no longer used to reconstruct semantic model origin when the producer has already emitted the semantic fact.

## Verification
The package does not currently expose `packages/core/tsconfig.json`, so a package-project `tsc -p packages/core/tsconfig.json` check is not available. Root-level `tsc --noEmit` also cannot run because the repository root has no tsconfig. Targeted source inspection confirms the repaired controller dataflow no longer contains the previous `parameters.find()` / `definitions.reverse().find()` semantic re-classification.

## Next root
Trace the remaining duplicate semantic vocabulary in `controllerDataflowContract.ts` itself and migrate `ControllerSemanticDataflow` toward the canonical upstream controller contract, while preserving AST/source facts.
