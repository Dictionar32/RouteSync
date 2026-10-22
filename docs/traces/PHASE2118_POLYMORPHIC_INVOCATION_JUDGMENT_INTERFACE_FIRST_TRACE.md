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

## Dependency ownership trace

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes source discovery and the closed invocation inventory. The core controller scanner consumes the closure receipt and invokes `actionJudgment.judge`, then passes one completed action judgment to `actionExecution.execute`. It later sends the same invocation judgment and response judgment into the AST projection authority. The interface generic correlation was strengthened at the action judgment and executor seam.

The production adapter still imports `scanControllerAction` from `packages/core/src/compiler/scanner/subscanners/controller`. This phase does not claim that relation/foundation or subscanner dependencies have been removed transitively. That remains the next semantic-ownership migration, and should be done by replacing the legacy semantic owner with an upstream authority, not by moving the function.

## Official references

- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR interface ownership: https://mlir.llvm.org/docs/Interfaces/
- MLIR dataflow analysis and lattice-style propagation: https://mlir.llvm.org/docs/Tutorials/DataFlowAnalysis/
