# Phase 1366 — React Endpoint Contract Boundary

## Change

`packages/react/src/hooks/createHooks.ts` previously asserted every `Object.entries(group)` value to `EndpointCallable` before reading `$def.hookKind`. The value was not runtime-validated, so malformed objects or functions could cross the boundary and fail later when React Query accessed `$queryKey` or invoked the endpoint.

The hook builder now validates the SDK endpoint contract at the runtime boundary: the entry must be callable, carry an object `$def`, expose an array `$key`, provide a `$queryKey` function, and carry one of the closed hook-kind values (`query`, `infinite_query`, `mutation`). Only after this check does the consumer read `$def.hookKind` and select the query or mutation path. Calls no longer need to assert the endpoint entry to `EndpointCallable`.

The runtime guard is boundary validation, not a new semantic classifier: it validates the closed `hookKind` already emitted from upstream capability. It does not infer intent from HTTP method, path, action name, or CRUD convention.

## Semantic flow trace

- Operation identity: upstream route reasoning/capability -> runtime identity algebra -> representation projection -> CLI manifest emission -> SDK identity reference -> query key.
- Hook capability: upstream route capability -> CLI emission -> SDK route definition -> validated React endpoint contract -> TanStack Query selection.
- AST/dataflow: validated `CompleteSourceAst` -> `CompleteLaravelSourceModel` -> semantic dataflow seeds -> dataflow/AST authority -> IR projection.
- Structural relation: schema/model relation evidence -> structural semantic relation -> graph edge projection. This is not conflated with dataflow.

## Candidate contract disposition

`SchemaRelationTarget`, `ControllerExpressionFact`, `ExpressionDefinition`, and `ValidationRuleDefinition` remain preserved but unwired. The current source does not demonstrate a distinct consumer that justifies adding them without creating a second semantic authority or duplicating existing provenance. The active schema relation index/reconciliation, controller variable flow, source-bearing AST, and `ValidationRuleNode` ADT remain the current canonical paths.

## Validation

The Phase 1366 audit checks the endpoint boundary, operation identity flow, manifest/dataflow interfaces, and package invariants. A passing static audit is not a typecheck or full build. The repository build command remains `tsdown`; build/runtime validation must be reported separately when dependencies are installed.
