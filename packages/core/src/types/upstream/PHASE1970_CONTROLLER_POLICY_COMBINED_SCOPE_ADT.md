# Phase 1970 — Controller Policy Combined Scope ADT

## Trace finding

The Phase 1969 authority selected the first named `only`/`except` argument. When both were present, the other constraint was silently discarded. The domain ADT could represent `all`, `only`, or `except`, but not the valid intersection of an allow-list and a deny-list. Downstream route middleware projection consequently had no lossless representation for both constraints.

Laravel's controller middleware API documents `only` and `except` as method applicability options. The semantic model must retain both if both are present, rather than selecting whichever appears first.

## Interface-first change

- Evolved the existing `ControllerPolicyActionScope` ADT with `only_except`, carrying independent typed sequences for both constraints.
- Evolved the existing `RouteMiddlewareScope` ADT with the corresponding `only_except` variant.
- Updated the existing `controllerPolicyActionScopeJudgmentAuthority` to return the combined variant when both named arguments occur. Direct string literals and arrays are represented as action-name evidence; no parallel authority was introduced.
- Updated existing route middleware projections and resolvers to apply the combined semantics: an action must be present in `only` and absent from `except`.
- Updated controller authorization applicability to use the same combined-scope semantics.
- Added a regression test proving both lists survive the upstream judgment independently.

## Preserved architecture

- No `relation` or `foundation` subscanner was added.
- Existing `ControllerPolicyActionScope` and `RouteMiddlewareScope` models were evolved rather than replaced by duplicate models.
- Invocation judgment and integrated response wiring were not changed by this scope-model correction.

## Verification boundary

The Phase 1970 audit checks the structural ADT and all known consumers. The TypeScript build and test runner were not executed in this environment; audit success is not a claim of compilation or test success.
