# Phase 2120 source trace

1. `laravelControllerScanner.ts` receives a closed invocation judgment from the invocation inventory.
2. `LaravelControllerActionSemanticJudgmentInterface.judge` receives that exact invocation judgment.
3. `legacyLaravelControllerExecutionDependencies.actionJudgment` calls the current `scanControllerAction` implementation and creates a completed judgment containing the invocation outcome, action identity, response ADT, contract projection, and dependencies.
4. `actionExecution.execute` preserves the exact completed judgment as `semanticJudgment`.
5. The scanner reads `semanticJudgment.response`; it no longer derives response presence by invoking `responseTypeName()` on the descriptor.
6. Integrated response remains a separate existing authority that correlates the invocation judgment and declaration evidence. It does not yet consume the action judgments as a direct input, so the complete response-ownership migration is not finished.

## Remaining transitive debt

- `laravelControllerExecutionDependencies.ts` imports and calls `scanControllerAction`.
- Controller action contract resolution still depends on legacy body/response/schema/dataflow helpers.
- The response pipeline is composed after declaration evidence is assembled; a later phase must decide whether the canonical response judgment should be the only source of downstream response products.

## Transitive source graph (static relative-import trace)

Entry points:
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

Observed from this archive:
- 416 reachable modules
- 1,973 distinct relative import edges
- 36 reachable paths matching `relation` or `/relations/`
- 1 reachable path matching `foundation`
- 20 reachable modules under `subscanners/`

These counts come from a simple relative-import resolver over TypeScript/JavaScript source files; package imports, generated module resolution, dynamic imports, and type-level dependency semantics are not fully represented. The graph is useful for finding paths, not proof of complete dependency closure.
