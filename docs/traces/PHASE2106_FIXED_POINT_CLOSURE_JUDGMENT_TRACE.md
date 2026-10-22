# Phase 2106 — Fixed-Point Closure Judgment Trace

## Problem observed

Both forward and backward solvers previously called `relationFixedPoint(...)` and immediately returned `fixedPoint.value`. That erased the distinction between `fixed_point_converged` and `fixed_point_round_limit_reached`, allowing a bounded, incomplete approximation to look like a closed data-flow result.

## Interface-first correction

The public solver contract now offers two explicit judgment-returning capabilities:

- `analyzeWithJudgment(...)`
- `analyzeBackwardWithJudgment(...)`

Both return `DataFlowSolveJudgment<T>`, an alias of the existing `RelationFixedPoint<RelationIndex<number, FlowState<T>>>`. The existing discriminated union remains the single source of truth; no parallel convergence ADT was invented.

## Execution path

```text
ControlFlowGraph + typed initial state + transfer + merge
  -> ControlFlowSolverInterface<T>
      -> analyzeWithJudgment / analyzeBackwardWithJudgment
          -> runForwardAnalysisWithJudgment / runBackwardAnalysisWithJudgment
              -> relationFixedPoint
                  -> fixed_point_converged(value, rounds)
                  -> fixed_point_round_limit_reached(value, rounds, limit)
```

Legacy relation-only calls continue to exist for compatibility, but now pass through `requireConvergedDataFlow(...)`. The converged branch returns the relation. The round-limit branch throws `DataFlowFixedPointIncompleteError`, retaining the exact incomplete judgment on the error. New callers should use the judgment APIs and branch on `kind` directly.

## Scope and limits

- This change fixes result-status erasure; it does **not** prove that transfer functions are monotone or that the equality relation is mathematically sound for every `T`.
- The current solver equality still compares JSON serialization of states. That remains a separate correctness concern for non-JSON values, key ordering, cycles, and values whose semantics are not captured by serialization.
- The generic `RelationFixedPoint` still uses a default round cap. A round-limit judgment is now visible instead of being mislabeled as closed.
- The legacy relation/foundation/subscanner dependency graph in Laravel controller action composition has not been removed by this data-flow phase. Phase 2105 only established that the main `laravelControllerScanner.ts` has no direct imports from those areas; its legacy adapter/resolver still reaches them.

## RouteSync CLI relationship

```text
CLI scan
  -> LaravelControllerScanner
  -> declaration correspondence + closed invocation judgment
  -> action execution result
  -> canonical ControllerActionContract + invocation judgment
  -> integrated response / AST projection
  -> source model / IR / manifest
```

The Phase 2106 change is orthogonal to that controller trace: it strengthens the generic data-flow solver's contract so downstream code can distinguish a proven fixed point from a capped approximation. It does not claim that the Laravel scanner has been fully detached from legacy relation/foundation/subscanner modules.

## Verification

Run the focused static audit with:

```sh
node scripts/audits/audit-phase2106-fixed-point-closure-judgment.cjs
```

This audit checks source-contract boundaries and status preservation. It is not a substitute for TypeScript compilation or behavioral tests.
