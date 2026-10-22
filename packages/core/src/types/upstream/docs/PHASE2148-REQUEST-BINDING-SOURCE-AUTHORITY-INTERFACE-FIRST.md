# Phase 2148 — Request Binding Source Authority, Interface First

## Trace finding

The Phase 2147 authority preserved PHP type resolution outcomes, but its evidence was adapted from `ControllerActionContract.request`. That meant request-kind selection (FormRequest, framework Request, or no request) still originated in `resolveRequest(...)` in the legacy action contract. The action judgment therefore consumed an authority for type resolution without fully moving request-kind derivation upstream.

## Change

- `LaravelControllerRequestBindingEvidence` now carries a complete typed inventory of controller method parameter evidence and correlated FormRequest source evidence.
- `LaravelControllerRequestSemanticBindingAuthorityInterface` owns selection of the request-origin parameter, FormRequest matching, framework Request matching, and PHP type resolution.
- `laravelControllerRequestSemanticBindingAuthority` reuses `phpParameterTypeAlgebra`; no duplicate PHP type resolver was introduced.
- Production composition adapts the method's already-classified parameter semantics to evidence and asks the upstream authority for the canonical action request judgment. It no longer derives canonical request knowledge from `result.contract.request`.
- `unsupported` and `malformed` PHP type outcomes remain `typed_unresolved`.
- The legacy action contract still owns request selection used by legacy schema and route projection. This compatibility debt remains explicitly represented as `legacy_schema_request_binding_compatibility`; it is not marked complete.
- Action semantic judgment contract version advanced from 16 to 17.

## Trace

```text
ControllerMethodAst parameter inventory
  -> typed request parameter evidence + FormRequest source evidence
  -> LaravelControllerRequestSemanticBindingAuthorityInterface
  -> canonical request semantic judgment
  -> action semantic judgment (coverage remains partial)
  -> action judgment executor (identity-preserving pass-through)
  -> integrated response pipeline / AST projection
```

The controller scanner's existing invocation correlation, integrated response ownership, and judgment-forwarding executor are unchanged.

## Deliberately not changed

- No `relation` or `foundation` layer was added.
- No new subscanner or duplicate PHP type authority was added.
- `scanControllerAction(...)` and `resolveControllerActionContract(...)` remain on the production path.
- Legacy schema/route projection request-binding compatibility remains open.
- No full build, full typecheck, or Vitest was run.
