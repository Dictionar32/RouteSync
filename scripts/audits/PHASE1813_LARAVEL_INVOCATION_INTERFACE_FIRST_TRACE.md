# Phase 1813 — Laravel Invocation Interface-First Wiring Frontier

## Scope

Trace the existing Phase 1812 ZIP before adding another semantic authority or changing scanner wiring. This phase intentionally fixes the interface/wiring boundary diagnosis first; it does not claim end-to-end integration.

## Trace findings

1. `packages/cli/src/parsers/php/sourceInvocationPipeline.ts` composes the existing upstream `createPhpSourceInvocationSemanticPipelineAuthority` with the PHP AST adapter.
2. `packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts` reads each controller file, tokenizes it, and calls `parseControllerDeclaration`.
3. `controllerMethodParser.ts` slices the whole-file token stream to `bodyTokens` and calls `parseControllerBody` with only method-body tokens.
4. `controllerBodyParser.ts` calls `analyzeControllerDataflow` without a source-pipeline result.
5. `controllerVariableSemanticRuntimeBinding.ts` therefore supplies `php_source_invocation_pipeline_not_connected` to the normal production path.
6. `analyzeControllerDataflowFromPhpSourcePipeline` exists, but the active `ControllerScanner`/method parser/body parser path has no call site for it.
7. The integrated response composition already preserves connected, blocked, and not-connected outcomes; the defect is the missing source-bound composition boundary, not a missing second invocation authority.

## Interface-first recommendation

Do not add another invocation authority and do not wire a whole-file result into a method-body-only parser as an uncorrelated side value. First define/evolve the controller scan input contract at the core upstream boundary so one controller source document and its closed `PhpSourceInvocationSemanticPipelineResult` are correlated by the same `SourceFile` identity. The contract must represent:

- a whole-file pipeline result that is complete;
- a whole-file pipeline result that is blocked, preserving its exact stage and payload;
- an unavailable/not-connected result that cannot be promoted to an empty successful batch;
- controller method body evidence projected from that same source document;
- source identity mismatch as a typed blocked outcome, not a runtime guess in the scanner.

Then the CLI composition root should create the document and invoke the existing pipeline once per file, and pass the correlated typed input into the core controller scan. The core scanner should only project the existing judgment into `invocationSemanticIntegratedResponse`. Keep name resolution, invocation closure, and completeness ownership in their existing upstream authorities.

## Explicit non-goals

- No `semantic/foundation` dependency.
- No new duplicate invocation authority.
- No treating an empty list as proof of complete coverage.
- No deleting legacy subscanner until the replacement path is actually connected and regression-tested.
- No claim that build/typecheck/runtime integration passed.

## Verification

Run `node scripts/audits/audit-phase1813-laravel-invocation-interface-first-wiring-frontier.cjs`. This is a source-trace audit only, not a build or end-to-end test.
