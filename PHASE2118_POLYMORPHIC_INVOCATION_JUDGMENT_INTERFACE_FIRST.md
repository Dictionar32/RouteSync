# Phase 2118 — Polymorphic Invocation Judgment Interface-First

## Defect traced

Phase 2117 tied action judgment and execution values to the invocation judgment generically, but the authority/executor interfaces fixed that generic at the interface level. The production dependency object was therefore typed through the default invocation union at its public seam instead of expressing a generic method that preserves each caller's exact invocation subtype.

## Change

- `LaravelControllerActionSemanticJudgmentInterface.judge` is now generic per invocation judgment input and returns an action judgment parameterized by that same subtype.
- `LaravelControllerActionExecutionInterface.execute` is now generic per action judgment input and returns the same invocation subtype.
- The existing production composition implements those generic methods. It still delegates action interpretation to `scanControllerAction`; no claim is made that the legacy semantic owner has been retired.
- Existing invocation four-outcome ADT and integrated response contracts remain canonical; no duplicate outcome union or new response authority was introduced.

## Trace

`LaravelControllerScannerExecutor` obtains one invocation judgment from the closed inventory, passes it into `actionJudgment.judge`, and passes the resulting single action judgment to `actionExecution.execute`. Generic method contracts now preserve the exact invocation subtype through that chain instead of widening it at the interface declaration.

## Validation

Run `node scripts/audits/audit-phase2118-polymorphic-invocation-judgment-interface-first.cjs`.

This is a static source audit. Typecheck, build, and Vitest were not run. The legacy `scanControllerAction` adapter and transitive relation/foundation/subscanner dependencies remain explicit migration debt.

## Related official design references

- TypeScript Handbook, narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Data-Flow Analysis: https://mlir.llvm.org/docs/Tutorials/DataFlowAnalysis/

These references support the design criteria only; they do not constitute evidence that this repository has passed a compiler build.
