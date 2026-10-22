# Phase 2117 — Action Judgment Owns Invocation Correlation

## Change

The controller action semantic judgment now receives the exact upstream `invocationJudgment` as part of its input and retains that same discriminated-union value in its completed judgment. Its source identity is owned by `invocationJudgment.sourceFile`; neither the input nor the completed judgment carries a duplicate `sourceFile` field that could disagree.

The runtime executor now accepts a single completed `semanticJudgment`. It no longer accepts `invocationJudgment` as a parallel argument. The executor's result forwards `semanticJudgment.invocationJudgment`, so the source/action outcome pairing has one owner and one path through the contract.

The CLI remains a composition root: it discovers controller files, asks Core to produce source-correlated invocation judgments, closes the complete inventory through the upstream inventory authority, and builds the manifest only from the validated authority receipt.

## Trace

```text
CLI source discovery
  -> whole-file invocation pipeline
  -> LaravelControllerInvocationSemanticJudgmentAuthority
  -> LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close
  -> validated inventory receipt
  -> LaravelControllerScannerInterface.scan
  -> declaration judgment + selection inventory closure
  -> action judgment input { invocationJudgment, method, ... }
  -> completed action judgment { invocationJudgment, contract, dependencies }
  -> action execution input { semanticJudgment }
  -> execution result forwards semanticJudgment.invocationJudgment
  -> integrated response judgment / AST projection
  -> controller artifact and downstream manifest projection
```

## Transitive dependency finding

Static import-graph trace from the CLI composition, controller scanner, and controller execution wiring traversed 416 source modules and 2,175 relative-import edges in this snapshot. The graph reaches `packages/core/src/semantic/relations/` files (`relationFoundation.ts`, `relationMembership.ts`, `relationalSequence.ts`, `semanticRelationalAlgebra.ts`, and related modules), plus controller/resource/expression subscanners including `resourceSemanticMappingRelations.ts`, `controllerBodyResolver.ts`, `controllerDataflowContract.ts`, and `actionScanner.ts`. No separate `semantic/foundation/` directory was reached, but `relationFoundation.ts` is still part of the transitive graph. Therefore, this phase does **not** claim the scanner is free of subscanner or relation-oriented implementation dependencies.

AST: the parenthesized-expression rule already returns a typed `AstRuleResolution` judgment; the Phase 1962/2116 audits remain green. Invocation/response: the invocation ADT retains four outcomes and the response projection is correlated to the exact invocation judgment. Lattice/fixed-point: the ancestry lattice has a named upstream contract, and the generic data-flow solver exposes complete converged/round-limit judgments rather than silently projecting a partial value. These boundaries exist, but transitive relation/subscanner implementations remain. The next migration must replace the legacy `scanControllerAction` implementation with an upstream semantic authority without moving reasoning into the CLI or merely relocating helper functions.

## Verification

Run:

```sh
node scripts/audits/audit-phase2117-action-judgment-invocation-correlation-interface-first.cjs
```

This is a static contract audit only. Build, typecheck, and Vitest were not run in the assistant environment.

## External design references

- TypeScript discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR interface design: https://mlir.llvm.org/docs/Interfaces/
- MLIR data-flow lattices and fixpoint-oriented analysis: https://mlir.llvm.org/docs/Tutorials/DataFlowAnalysis/
