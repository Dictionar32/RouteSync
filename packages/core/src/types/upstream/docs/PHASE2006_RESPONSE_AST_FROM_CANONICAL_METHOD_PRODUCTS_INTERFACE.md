# Phase 2006 — Response AST from Canonical Method Products, Interface First

## Trace finding

The production source-AST pipeline ran `laravelControllerScanner.scan(...)` and then called `scanResponseBundle(sourceProject)`. The response scanner independently reopened controller PHP files and called the legacy `responseProducer` controller branch, which reclassified return syntax through `controllerReturnSemanticFromMethod`. That bypassed the Phase 2005 canonical `ControllerReturnSemantic` → `ResponseResult` judgment and could disagree with the already-closed controller response judgment.

## Contract-first correction

- Added `LaravelControllerMethodResponseAstProjectionInterface` and its versioned contract to the existing upstream response pipeline interface.
- The implementation consumes only `LaravelControllerMethodResponseProduct`, preserves its exact `ResponseResult` as `ResponseDefinition.outcome.success.result`, retains the exact method source span, and derives a stable response type name from the canonical action name.
- The source-AST pipeline now passes its already-produced `controllerScan` to `scanResponseBundle`.
- `responseScanner` now projects controller response ASTs only from `controller_response_method_products_complete`; unresolved, blocked, rejected, and return-semantic-only outcomes produce no fabricated controller `ResponseAst`. DTO scanning remains intact.
- The production controller response path no longer reopens controller files or invokes the legacy controller-return classifier. No `relation` or `foundation` subscanner was added.

## Explicit limitation

`ResponseDefinition.output` remains `mixed` until a separate closed output-type judgment can prove a more precise `TypeExpression`. This phase does not pretend the `ResponseResult` alone proves a complete TypeScript output type. The legacy `responseProducer` controller branch remains in place for compatibility, but the production `scanResponseBundle` path no longer calls it for controller methods.

## Verification boundary

The phase audit checks interface ownership, canonical result preservation, method-source provenance, source-AST pipeline wiring, removal of production controller re-scanning, and non-fabrication for unresolved outcomes. Syntax transpilation is not a full project typecheck; full build/typecheck is not claimed as passing.
