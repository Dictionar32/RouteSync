# Phase 930 — Resource Middleware Upstream Wiring

Phase 930 closes a concrete Laravel policy evidence loss at the route producer boundary.

## Before

`RouteSpecialKind.route_resource_registration.middleware` was constructed as an empty
sequence even though the scanner already had `middleware`, `middlewareFor`, and
`withoutMiddlewareFor` syntax knowledge and a canonical upstream
`RouteResourceMiddlewareRule` ADT.

That meant resource middleware could be parsed as evidence but disappear before the
canonical RouteDefinition was produced.

## After

```text
Laravel resource fluent chain
  -> RouteResourceMiddlewareAst evidence
  -> RouteDeclarationAst resource middleware evidence
  -> RouteDeclarationEvidence
  -> RouteProducer
  -> RouteResourceMiddlewareRule
  -> RouteDefinition.special.resource.middleware
  -> effective route-action policy closure
  -> RouteActionPolicyRelation
```

The parser only emits layer-local evidence. `types/upstream` remains free of scanner
AST dependencies. Applicability and exclusions remain semantic policy, not generic
dataflow.

## Dataflow boundary

No `dataflow_middleware`, `dataflow_authorization`, or `dataflow_policy` facts are
introduced. CodeQL-style dataflow remains a value-flow representation, while Laravel
middleware/resource policy is normalized as upstream semantic policy before any generic
dataflow analysis.

## Remaining frontier

The current route parser/projection path primarily recognizes the existing `apiResource`
route declaration surface. Full parity for every Laravel resource/singleton registration
variant should reuse the same upstream rule contract rather than creating another policy
ADT.
