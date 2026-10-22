# Phase 1914 — Laravel Controller Source-Payload Evidence Adapter

## Trace finding

`controllerDataflowAnalyzer.ts` still owned `collectStatementPayloads`, including recursive PHP AST traversal and source-span construction. That was evidence extraction, not a semantic judgment, but it coupled the analyzer orchestration directly to every PHP statement shape. The actual consumers show that `controllerDataflowContract.ts` consumes the resulting semantic variable flow, while the analyzer needs source payloads only to feed the existing binding/payload correspondence authority.

## Interface-first change

Added `ControllerDataflowSourcePayloadEvidenceAdapterInterface<Source, Payload>` in `packages/core/src/types/upstream/controllerDataflowSourcePayloadEvidenceAdapterInterface.ts`. The upstream interface is generic and does not import PHP AST types. It defines source evidence acquisition, not semantic classification.

Added the PHP-specific implementation in `packages/core/src/compiler/scanner/lexer/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts`. It traverses `PhpBlock`, emits typed `ControllerDataflowSourcePayload` values, and uses the exact `SourceFile` from the canonical invocation judgment. The adapter does not correlate bindings, classify origin, resolve variable semantics, or group definitions.

`controllerDataflowAnalyzer.ts` now requests payloads through the injected interface. `controllerVariableSemanticRuntimeBinding.ts` supplies the PHP adapter. The existing upstream binding/payload correspondence authority remains the sole owner of matching and origin judgment.

## Invocation invariant

The analyzer still computes knowledge from the same source path derived from `judgment.sourceFile`, composes integrated response using the exact `judgment.response`, and retains the original `invocationJudgment` beside `invocationSemanticIntegratedResponse`. The adapter does not create or reconstruct invocation judgments or integrated responses.

## Remaining work

This phase does not claim the analyzer is wiring-only. It still orchestrates `resolveSemanticForValue` and `canonicalSemanticVariables`. Those responsibilities need a separate consumer trace and a compatible existing upstream owner before any further migration. No build, typecheck, or unit-test suite was run; verification is the focused static audit only.
