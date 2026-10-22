# Phase 1944 — Controller AST ADT Semantic Judgment (Interface First)

## Trace finding

The upstream `ControllerDataflowPayloadSemanticJudgment` already publishes a closed ADT with `resolved`, `unresolved`, and `ambiguous` variants. The Laravel AST projection previously filtered for only `resolved` and converted every other result—including explicit ambiguity—into the generic `external` unresolved value. That erased a meaningful upstream distinction at the AST projection boundary. The scanner boundary also contained stale `controllerDataflowSemanticStageInventory` wording that incorrectly described binding correspondence and variable-flow composition as analyzer responsibilities.

## Changes

- Updated `SemanticValue` to include the explicit `unresolved/ambiguous` variant.
- Changed `resolvedExpression` to consume the existing payload-judgment ADT exhaustively. Resolved values reuse the canonical `sourceExpression`; unresolved remains `external`; ambiguous remains `ambiguous`. No candidate is selected from `bindingJudgments`.
- Evolved the existing `ControllerDataflowInvocationSemanticModelContract` to version 15 with an explicit AST ADT projection invariant.
- Evolved the existing Laravel controller semantic boundary contract to version 106, added the AST ADT projection invariant, and corrected stale stage-inventory wording to match the implementation.
- Updated Phase 1940–1943 regression audits to validate the current contract and preserve the distinction between unresolved and ambiguous payload judgments.
- Added `scripts/audits/audit-phase1944-controller-ast-adt-semantic-judgment.cjs` and registered `audit:phase1944-controller-ast-adt-semantic-judgment`.

## Architecture outcome

No new semantic authority, callable lookup, or relation wrapper was added. The existing upstream authority remains responsible for binding correspondence, identity closure, variable-flow composition, and integrated response composition. The analyzer collects source-correlated evidence and passes one packaged input to that authority.

## Verification limits

The Phase 1944 static audit and the prior Phase 1940–1943 static audits are run separately. No full TypeScript type-check, project build, or full test suite is claimed.
