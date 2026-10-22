# Phase 1700 — Laravel Scanner Semantic Judgment Contracts

## Goal

Close the semantic interface design for route-controller resolution and resource-model/controller binding before wiring the Laravel scanner facade. The change is contract-first only.

## Trace findings

- `laravelSourceAstPipeline` still calls concrete static scanner implementations directly.
- `RouteScanner.scanCanonicalBundle` currently consumes a legacy nested `RelationIndex` of `ControllerActionInfo`, while the public route interface uses `ControllerActionFlowContract[]`.
- `ResourceScanner.scanCanonicalBundle` currently consumes `ModelSymbolTable` and `ControllerResourceDataflow`, while the public resource interface accepts AST arrays and controller action flow contracts.
- `ControllerScanner` produces canonical controller action flow contracts alongside a legacy controller index.
- `controllerDataflowAnalyzer` already delegates whole-knowledge invocation analysis to `invocationSemanticPipeline`; do not introduce a second invocation resolver in Laravel scanning.

## Contract-first change

Added `laravelScannerSemanticJudgment.ts` with typed authority boundaries for:

- route-controller binding judgment;
- resource-model binding judgment;
- explicit resolved / unresolved / ambiguous outcomes;
- source-span evidence and subject identity;
- invariants prohibiting scanner-side reclassification and requiring reuse of the existing invocation semantic authority.

Exported the contracts from the upstream and core public barrels and added `audit:phase1700-laravel-semantic-judgment-contracts`.

## Deliberately not changed

- No scanner wiring was migrated.
- No legacy scanner implementation was deleted or emptied.
- No runtime authority implementation was fabricated without first reconciling the current legacy inputs with the new public contracts.
- No dependency on `core/src/semantic/foundation` was introduced.

## Verification

The Phase 1700 audit verifies contract shape, explicit outcomes, evidence retention, public exports, preservation of the existing invocation authority, and that this phase does not falsely claim the concrete pipeline is wired. This is a static contract audit, not a substitute for TypeScript typecheck, build, or end-to-end tests.
