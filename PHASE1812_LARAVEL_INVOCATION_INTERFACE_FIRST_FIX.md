# Phase 1812 — Laravel Invocation Interface-First Inventory Closure

## Scope

Trace the Phase 1811 archive through the upstream PHP source contracts, the concrete CLI PHP AST adapter, and the Laravel controller scanner integration seam. This phase fixes a source-evidence completeness defect before attempting scanner wiring.

## Interface-first finding

`PhpSourceFrontendInterface` already had a concrete implementation in `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts`; the Phase 1811 trace incorrectly described it as absent. The real issue is narrower and more important: the adapter walks parser nodes of kind `call`, but silently skips a call whenever its `what` node is not a plain `name`. The same extraction could then publish a complete invocation inventory even though a parser call node had not been represented by the current function-name syntax algebra.

## Changes

1. Bumped `PhpSourceFrontendContract` to v5 and added `unsupportedInvocationHandling` as an explicit interface guarantee.
2. Updated the concrete AST adapter so every parser `call` node whose callee shape cannot be represented marks invocation mapping incomplete. Missing source spans, malformed callee syntax, and missing argument evidence continue to block completeness.
3. Added `scripts/audits/test-phase1812-php-invocation-inventory-closure.cjs` to audit the interface rule, adapter enforcement, validation boundary, and truthful scanner status.

## Laravel scanner / integrated response status

The scanner still defaults ordinary method-body analysis to `php_source_invocation_pipeline_not_connected`. That is correct until the whole source-file document is passed through `analyzePhpSourceInvocationSemanticPipeline` and its authority-produced result is supplied to `analyzeControllerDataflowFromPhpSourcePipeline`. A method-body AST alone must not be upgraded into whole-file evidence. This phase deliberately does not fabricate that wiring or claim end-to-end completion.

## Validation

- Static audit: `node scripts/audits/test-phase1812-php-invocation-inventory-closure.cjs`.
- Full TypeScript typecheck/build was not run in this environment.

## External design references

- TypeScript discriminated unions and exhaustive modeling: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- nikic/PHP-Parser AST, traversal, and source locations: https://github.com/nikic/php-Parser
- Laravel controller/action model: https://laravel.com/framework/docs/12.x/controllers

These references support the interface and source-evidence design; they do not establish that RouteSync's end-to-end scanner path has executed.
