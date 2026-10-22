# Phase 2146 — Request Binding Judgment Closure, Interface First

## Trace

`LaravelControllerScanner` calls the configured action semantic judgment authority and passes the published judgment to the action executor. The production composition still calls `scanControllerAction(...)`, which reaches `resolveControllerActionContract(...)`; that action-derivation ownership gap remains open.

Within that composition, `canonicalRequestBinding(...)` previously called `resolveParameterType(...)`. That helper adapted a failed `phpParameterTypeAlgebra` result into `{ kind: 'error', diagnostic }`, then wrapped it in the ordinary `typed` request-binding variant. This collapsed a failed type judgment into a value that looked like an ordinary typed request binding.

## Change

- Reuse the existing `phpParameterTypeAlgebra`; no duplicate type authority is introduced.
- Preserve the upstream type judgment as a closed outcome.
- Publish successful type resolution as `kind: 'typed'`.
- Publish `unsupported` and `malformed` type judgments as `kind: 'typed_unresolved'`, retaining the original judgment.
- Export `UnresolvedPhpParameterTypeJudgment` from the existing upstream contract and public package barrel.
- Advance `LaravelControllerActionSemanticJudgmentContract` from version 14 to version 15.
- Keep request-binding kind derivation and action derivation legacy ownership explicitly unresolved. No new `relation/foundation` layer or subscanner was introduced.

## Trace after change

```text
ControllerRequestBinding.typed (source AST evidence)
        -> requestTypeEvidence (typed evidence projection)
        -> existing phpParameterTypeAlgebra.resolve(...)
        -> resolved   -> LaravelControllerRequestSemanticBinding.typed
        -> unsupported/malformed -> LaravelControllerRequestSemanticBinding.typed_unresolved
```

The distinction between “resolved type” and “unresolved type” is now preserved at the published semantic boundary. This phase does not claim that the legacy action resolver has been retired.

## Verification

- Targeted Phase 2146 audit: 8/8 passed.
- TypeScript syntax-only transpilation: 4/4 changed files without syntax diagnostics.
- Full build, full typecheck, and Vitest were not run.

## Design references

- TypeScript Handbook, discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/

These references support explicit tagged outcomes and contract-based compiler boundaries; they do not imply that the whole RouteSync repository has been typechecked.
