# Phase 1386 — Runtime Contract Interface Evolution

## Goal

Trace the production path and evolve the public type boundary so Runtime is a contract executor, not a second semantic authority.

## Production trace

```text
Laravel source evidence
  -> upstream source model / controller semantic facts
  -> SemanticDataflowInput
  -> semanticDataflowReasoningAuthority.judge(input)       [upstream producer]
  -> SemanticDataflowJudgment (facts + closure + derivations + paths + reasoningContract + closed:true)
  -> RouteSyncManifestFlow.dataflowJudgments
  -> RouteSyncManifestDataflowProjectionInterface
  -> RouteSyncManifestDataflowSurface (judgments + canonical controller identities only)
  -> analyzeRouteSyncManifestDataflow (identity match; missing judgment throws)
  -> SemanticDataflowRuntimeBoundary.project(judgment)
  -> DataFlowAuthorityInterface<Judgment, Judgment, Identity>
  -> policy/query consumers and IR/analysis projections
```

## Interface/type evolution

- `RouteSyncManifestDataflowSurface` excludes `dataflowInputs`; raw inputs stay in the upstream manifest/evidence surface.
- `SemanticDataflowRuntimeBoundary` accepts `SemanticDataflowJudgment` and returns a read-only authority interface whose input and state are both that closed judgment.
- `semanticDataflowDataFlowAdapter` preserves the same judgment in `input` and `state`; `reaches` only checks the already-produced closure.
- `semanticDataflowFactAnalysisPolicy` previously declared its authority argument as `DataFlowAuthorityInterface<SemanticDataflowInput, SemanticDataflowJudgment, Identity>`, which did not match the runtime result's actual contract. Both policy entry points now require `DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, Identity>`. This removes a type-level escape hatch that described the consumer as if it still accepted unjudged input.
- `analyzeRouteSyncManifestDataflow` finds the judgment by canonical identity and throws when it is absent; it does not reconstruct a judgment from `dataflowInputs`.

## Remaining semantic responsibility

`createSemanticDataflowAnalysisPolicy` still applies caller-selected producer sets (`sourceProducers` and `sinkProducers`) to select facts. This is an explicit downstream query policy, not fixed-point closure or proof construction. If the stronger invariant is that even source/sink role selection must be pre-decided upstream, the next evolution should move that selection into a typed upstream policy judgment and make Runtime consume it without reclassifying producer domains.

The deprecated `semanticDataFlowAnalyzer.ts` compatibility facade still calls the upstream `judge` authority, but repository source tracing found no production importers; only test files import it. It is not in the production runtime call path and is not removed to avoid breaking historical tests/compatibility without a separate migration decision.

## External references

- MLIR Interfaces describes generic analyses operating through interfaces instead of hard-coding every operation's semantics: https://mlir.llvm.org/docs/Interfaces/
- TypeScript discriminated unions and exhaustiveness checks support closed, explicit contract variants: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- CodeQL documents that AST and data-flow nodes are distinct representations and that data-flow paths can be audited from sources to sinks: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- Laravel's route documentation describes route/controller/middleware configuration as source-level framework behavior to extract upstream: https://laravel.com/docs/13.x/routing

## Verification

The Phase 1386 audit is a static source-boundary audit. It does not substitute for a TypeScript build or end-to-end test. The workspace has no installed `node_modules`, so `tsdown` is unavailable here. Package version `1.0.49` and the `tsdown` build script are preserved.
