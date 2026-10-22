# Phase 2155 — Legacy Request Derivation Retirement (Interface First)

## Scope

Retire the legacy request-kind/type classification from `resolveRequest(...)` without claiming that the entire legacy action contract resolver has been retired. Reuse the existing `laravelControllerRequestSemanticBindingAuthority`; do not add a second authority, `relation/foundation`, or a request subscanner.

## Trace before

`legacyLaravelControllerExecutionDependencies.actionJudgment.judge` called `scanControllerAction(...)`, which reached `resolveControllerActionContract(...)`. That resolver called `resolveRequest(...)` and independently classified request origin, FormRequest matches, framework request classes, and fallback-to-no-request. Separately, the action judgment adapter derived canonical request knowledge with `laravelControllerRequestSemanticBindingAuthority`. Two request-kind paths therefore existed, and the legacy resolver's fallback could discard typed/unresolved request meaning.

## Changes

1. `controllerRequestBindingJudgmentFromMethod(...)` adapts parsed parameter facts to the existing upstream evidence contract. Request-kind and PHP parameter type resolution remain owned by `laravelControllerRequestSemanticBindingAuthority`.
2. Production composition computes the judgment once and passes that exact value to `scanControllerAction(...)` and the published action judgment.
3. `ControllerActionContract.request` now reuses `LaravelControllerRequestSemanticBinding`; the legacy resolver accepts the closed judgment in its context and no longer defines `resolveRequest(...)`.
4. Schema compatibility consumes the canonical request ADT. Typed and unresolved variants do not imply FormRequest schema evidence.
5. The existing route projection handles `typed` and `typed_unresolved` explicitly, preserving both through `RouteRequestBinding` and `EndpointRequestBinding`.
6. The action semantic judgment contract version is 19, synchronized between interface and production composition.

## Ownership still open

This phase retires request derivation from the legacy resolver only. `scanControllerAction(...)` and `resolveControllerActionContract(...)` still derive other action products, including body and response compatibility, and resource-binding domain publication still traverses the adapter. Integrated response remains owned by the existing controller-wide response pipeline. These remaining gaps are not claimed closed.

## Validation

- `scripts/audits/audit-phase2155-request-derivation-retirement.cjs`: static ownership and projection checks.
- Syntax-only TypeScript transpilation on changed TypeScript files.
- Full build, TypeScript typecheck, and Vitest were not run.

## Related compiler design references

- TypeScript Handbook — Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/

These references support explicit variant modeling and interfaces that decouple transformations from concrete implementation details. They do not substitute for RouteSync's own code-level verification.
