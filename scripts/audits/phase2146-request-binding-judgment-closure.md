# Phase 2146 — Request Binding Type Judgment Closure

## Trace finding

The production composition in `laravelControllerExecutionDependencies.ts` converted a typed request AST through `resolveParameterType()`. That helper turns a failed `phpParameterTypeAlgebra` result into a successful-looking `TypeExpression` with `kind: 'error'`. This collapses `resolved`, `unsupported`, and `malformed` into the same outer request-binding variant (`typed`).

## Change

- Preserve the existing `phpParameterTypeAlgebra` as the type-resolution authority.
- Map `resolved` to canonical request binding `typed`.
- Map `unsupported` and `malformed` to a distinct `typed_unresolved` ADT carrying the original failed judgment.
- Export `UnresolvedPhpParameterTypeJudgment` through the existing upstream action semantic contract and public package barrel.
- Bump action semantic judgment contract version 14 → 15.
- Keep the legacy action derivation ownership gap explicit; this phase does not retire `scanControllerAction()` or `resolveControllerActionContract()`.
- No `relation/foundation` layer or new subscanner added.

## Verification

Run `node scripts/audits/test-phase2146-request-binding-judgment-closure.cjs` for the targeted contract audit. Full build, full typecheck, and Vitest are intentionally not run.
