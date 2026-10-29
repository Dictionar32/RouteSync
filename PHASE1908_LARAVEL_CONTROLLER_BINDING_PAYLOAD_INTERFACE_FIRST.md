# Phase 1908 — Laravel Controller Binding/Payload Interface First

## Scope

Continue from Phase 1907 by tracing the real controller dataflow analyzer and strengthening the existing upstream boundary contract before changing runtime behavior. This phase does not claim that `controllerDataflowAnalyzer.ts` has become wiring-only.

## Trace findings

`packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts` still performs these semantic operations:

- `collectStatementPayloads` traverses PHP statements and constructs a local payload inventory.
- `canonicalDefinition` matches a binding span to a payload by exact source offsets.
- Missing correspondence is converted to a synthetic unsupported PHP AST expression.
- `mapResourcePhpAstToUpstream` projects the matched/synthetic PHP expression.
- `canonicalVariableOrigin` maps origin codes to upstream origin variants.
- `resolveSemanticForValue` calls the semantic executor using evidence projected from the selected expression.

This means a binding-to-payload correspondence judgment is still implicit in source-span matching. A missing match is not distinguished from a genuine unsupported expression. That is a semantic information-loss risk and should not be hidden by moving the helper elsewhere.

## Interface-first correction

The existing `LaravelControllerInvocationSemanticBoundaryContract` was advanced from version 73 to 74. Two explicit ownership invariants were added:

1. `controllerDataflowBindingPayloadJudgmentBoundary`: a binding is resolvable only with typed source-correlated correspondence; missing or ambiguous correspondence must remain an explicit typed outcome, not silently become an unsupported-expression payload.
2. `controllerDataflowProjectionOwnership`: PHP AST traversal/projection belongs to the source adapter, while binding-to-payload correspondence and variable-origin judgment require upstream semantic ownership before analyzer reduction.

No parallel invocation authority was introduced. The existing canonical invocation judgment and integrated response remain distinct values. The composition result must retain its exact knowledge input and the exact PHP invocation response without reclassification.

## Not yet completed

The analyzer implementation still contains the fallback described above. Phase 1908 changes the ownership contract, not the runtime implementation. The next implementation phase should trace existing upstream source-statement/provenance contracts and consumers, then evolve the strongest compatible contract into a typed correspondence judgment. Only after that contract has a production implementation should the analyzer stop doing this matching and fallback itself.

## External references

- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript interfaces and structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- Laravel controller behavior: https://laravel.com/framework/docs/12.x/controllers
- Laravel request lifecycle: https://laravel.com/framework/docs/master/lifecycle

These references support typed outcome modeling and separation of framework request/response stages; they do not prove RouteSync implementation correctness.
