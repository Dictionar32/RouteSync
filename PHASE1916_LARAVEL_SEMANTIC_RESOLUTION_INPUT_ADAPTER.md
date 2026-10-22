# Phase 1916 — Laravel semantic-resolution input adapter

## Trace finding

`controllerDataflowAnalyzer.ts` previously constructed `ControllerVariableSemanticEvidence` from `PhpAstValue` and translated parameter tuples into `ControllerVariableSemanticBinding` inline before invoking the existing upstream executor. This coupled parser representation to semantic-request assembly inside the analyzer.

## Interface-first change

- Added `ControllerVariableSemanticResolutionInputAdapterInterface<Expression, ParameterSemantics>` under `types/upstream`.
- Added the PHP-specific adapter under scanner wiring. It maps PHP AST evidence and typed parameter semantics into the existing `ControllerVariableSemanticResolutionRequest`.
- Analyzer now delegates request adaptation to that injected contract, then invokes the existing `ControllerVariableSemanticRuntimeExecutorInterface`.
- The semantic authority remains the single upstream owner of rule selection and closed semantic judgment. No second authority was introduced.
- Invocation judgment and `invocationSemanticIntegratedResponse` remain distinct values on `ControllerDataflowAst`.

## Remaining work

This does not make the analyzer wiring-only. It still produces semantic knowledge, orchestrates the authority calls, correlates intermediate judgments, and projects definitions. The next trace should determine whether the whole per-definition derivation can be expressed as a single upstream judgment without duplicating binding/payload or variable identity authorities.

## Verification

The static audit script checks interface, adapter, wiring, sole-resolver preservation, and canonical invocation/integrated-response retention. Build, typecheck, and tests were not run.
