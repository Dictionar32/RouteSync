# Phase 2104 — Preserve the Action Judgment Across the Executor Boundary

## Architectural change

The controller action executor previously returned only an action name, legacy descriptor, and dependencies. The canonical `ControllerActionContract` was constructed by `resolveControllerActionContract` and then discarded at the adapter boundary. That made downstream projection rely on a lossy descriptor even though the semantic contract already existed.

This phase preserves the canonical contract and the exact `LaravelControllerInvocationSemanticJudgmentInterface` in a named result:

- `kind: 'controller_action_execution_completed'`
- `invocationJudgment`: the exact invocation judgment supplied to the executor
- `contract`: the canonical `ControllerActionContract` returned by the existing resolver
- `descriptor`: the compatibility projection consumed by existing scanner code
- `dependencies`: the resolver's typed dependencies

The adapter passes `input.invocationJudgment.sourceFile` as the source identity used to build the action contract. It does not independently infer a path or re-correlate the action by controller basename.

## Static trace to CLI

```text
packages/cli/src/commands/scan.ts
  -> source invocation pipeline and invocation inventory
  -> LaravelSourceAstScanner / LaravelSourceAstPipeline
  -> LaravelControllerScannerInterface.scan
  -> source-bearing declaration correspondences
  -> declaration inventory closure gate
  -> LaravelControllerActionExecutionInterface.execute
  -> legacy adapter: scanControllerAction
  -> resolveControllerActionContract
  -> completed action execution judgment (contract + exact invocation judgment)
  -> compatibility descriptor + controller producer projection
  -> integrated response semantic judgment
  -> AST projection with the exact invocation/response pair
  -> CompleteLaravelSourceModel and downstream IR/manifest projection
  -> CLI output
```

## Lattice/fixed-point correction included in this phase

The shared `relationLatticeFixedPoint` and `relationFixedPoint` result is now a discriminated union:

- `fixed_point_converged` means the equality relation proved the current approximation stable.
- `fixed_point_round_limit_reached` means evaluation stopped at the configured limit and does not claim convergence.

The `rounds` witness now counts actual transfer/step applications. Previously the first evaluation could return `rounds: 0`, undercounting work by one; the corrected algorithm increments after each evaluated transfer. A zero or negative limit performs no transfer and returns the limit-reached outcome. Existing compatibility field `converged` remains available, while `kind` is the canonical discriminant.

This fixes the generic iteration result contract, but it does not prove that every caller's transfer is monotone or that every lattice has finite height. Those remain semantic obligations of each analysis.

## What this does and does not prove

- It prevents the executor adapter from discarding the canonical action contract at the interface boundary.
- It preserves the exact invocation judgment alongside the action contract for downstream correlation and future migration.
- The controller scanner itself still has no direct imports from `semantic/relations`, `semantic/foundation`, or `subscanners`.
- The implementation behind the executor still delegates to `scanControllerAction`, which still delegates to the large legacy `resolveControllerActionContract` and its subscanner/relation dependencies. This phase is **not** a claim that semantic reasoning has been retired from that implementation.
- Integrated response judgment remains computed by the existing response pipeline after controller evidence is assembled. This phase does not yet move response semantics into the action judgment.
- Controller ancestry closure still exposes numeric witnesses (`heightBound`, `rounds`, `knownAncestors`) without a branded arithmetic proof. This phase improves the shared fixed-point result but does not establish monotonicity or finite-height proofs for every transfer.

## Validation

Run only the static audit script for this phase and the previous controller boundary audit. Do not infer a clean TypeScript build from static source checks. Build, typecheck, and Vitest are intentionally not run in this environment.
