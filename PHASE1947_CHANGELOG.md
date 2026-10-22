# Phase 1947 — Controller Semantic Reasoning Interface First

## Trace finding

The existing `ControllerVariableSemanticAuthorityInterface` exposed a callable `resolve` method, while its implementation hid the actual semantic policy inside the deprecated callback-based `SemanticDecisionContract` (`applies` / `derive` callbacks). Parameter resolution also selected the first matching binding, so duplicate parameter names could be silently classified as resolved.

## Changes

- Extended the existing controller-variable semantic authority interface with a closed, data-only `ControllerVariableSemanticReasoningContract` ADT.
- Replaced the callback-based rule registry in `controllerVariableSemanticAuthority.ts` with an implementation of the existing declarative rule order: parameter binding, database table call, external fallback.
- Made parameter binding cardinality explicit: zero matches continues, one match resolves, multiple matches produce a closed `ambiguous` judgment.
- Preserved the exact `sourceExpression` and integrated `expressionValue` on all resolved/unresolved/ambiguous outcomes.
- Kept the existing runtime executor and PHP definition projection adapter; no parallel authority was introduced.
- Updated the invocation semantic model contract to version 18 and Laravel scanner boundary to version 109.
- Added an audit under `scripts/audits/` and registered it in `package.json`.

## Verification boundary

The Phase 1947 static audit is the targeted verification. A targeted TypeScript no-emit check was also attempted; it reported existing errors in unrelated resource-model and semantic-reasoning modules, and initially identified issues in this change that were corrected. A clean full-project typecheck/build is not claimed.
