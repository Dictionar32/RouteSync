# Phase 1912 — Laravel Controller Expression Authority, Interface First

## Trace basis

Input baseline: `RouteSync-phase1911-laravel-controller-origin-judgment-interface-first-20261014.zip`.

The trace followed the production path:

`controllerMethodParser.ts` → `controllerBodyParser.ts` → `controllerVariableSemanticRuntimeBinding.ts` → `controllerDataflowAnalyzer.ts`.

The analyzer previously imported `mapResourcePhpAstToUpstream` and invoked the concrete mapper directly. The upstream contract `PhpAstExpressionSemanticAuthorityInterface<Evidence>` already existed, and the resource source adapter already implemented it as `resourcePhpAstExpressionSemanticAuthority`. A second expression-mapping interface would have duplicated an existing authority, so this phase reuses the existing one.

## Changes

- Injected the existing `PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>` into the analyzer through the production composition root.
- Matched payload expressions are now projected by `expressionAuthority.derive(...)`; the analyzer no longer imports or directly invokes `mapResourcePhpAstToUpstream`.
- The expression input receives `judgment.sourceFile`, keeping source identity anchored to the canonical invocation judgment rather than a separately supplied file path.
- Removed the unused raw parameter-identifier list from the controller dataflow analyzer/wiring path. The body parser receives typed `parameterSemantics`, which is the actual evidence used by semantic resolution.
- Added the missing explicit import for `ControllerVariableSemanticJudgment` in the analyzer.
- Bumped `LaravelControllerInvocationSemanticBoundaryContract` from version 77 to 78 and documented the expression authority boundary and removal of redundant raw parameter input.
- Preserved `invocationJudgment` and `invocationSemanticIntegratedResponse` as separate values; the response composition still receives the exact `judgment.response`.

## Remaining runtime work

This is not a claim that the scanner is wiring-only. `controllerDataflowAnalyzer.ts` still traverses PHP statements to collect source payloads, invokes the variable semantic executor, reconstructs identifiers from knowledge facts, and groups variable definitions. Those responsibilities need consumer traces and compatible existing upstream owners before they can be retired from the analyzer. This phase deliberately does not move parser traversal or variable grouping into `types/upstream`, and does not create a duplicate mapping authority.

## Verification

- Static audit: `scripts/audits/audit-phase1912-laravel-expression-authority-interface-first.cjs`.
- TypeScript build/typecheck: not run.
- Runtime/unit tests: not run.
