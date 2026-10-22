# Phase 2155 Trace

## Request ownership before

`source method parameters -> resolveRequest(...) in controllerActionContract -> ControllerActionContract.request`

In parallel, action semantic judgment independently ran the existing `laravelControllerRequestSemanticBindingAuthority`. This duplicated request classification and allowed the legacy resolver's fallback branch to erase the difference between unresolved typed input and no request.

## Request ownership after

`ControllerMethodAst parameter evidence -> controllerRequestBindingJudgmentFromMethod -> laravelControllerRequestSemanticBindingAuthority -> one canonical LaravelControllerRequestSemanticBinding -> ControllerActionContract + published action judgment -> route boundary projection -> EndpointRequestBinding`

The resolver receives a closed judgment and projects it; it no longer classifies request meaning. The same judgment object is passed into the legacy projection and published semantic knowledge. Route projection handles all five canonical variants explicitly.

## Boundaries retained

- Invocation judgment correlation is unchanged.
- Integrated response remains controller-wide and is not flattened into action response semantics.
- Runtime executor remains a forwarding executor.
- Legacy action contract still owns other derivations; this phase closes request-kind derivation only.
- No `relation/foundation` layer or new subscanner was introduced.
