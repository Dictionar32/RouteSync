# Phase 1992 — Response Evidence Observation Coverage (Interface First)

## Trace finding

`ControllerDeclarationEvidence.methods` is the source-owned inventory of controller methods. Each `ControllerMethodEvidence` contains its canonical `ControllerActionFlowContract`, including the `ControllerResponse` ADT, and the method `SourceSpan`.

The Phase 1991 producer inventory only returned present response references. That loses a key distinction: an empty evidence inventory could mean methods were observed but their response ADTs were `response_absent`, or there were no method observations at all. The contract also did not preserve one explicit observation per declared method.

## Contract change

`laravelControllerResponseSemanticJudgmentInterface.ts` now declares `LaravelControllerResponseEvidenceProductionObservation` with two variants:

- `controller_method_response_observed`: preserves the original `ControllerMethodEvidence`, action, response reference, and the derived observed response evidence.
- `controller_method_response_absent`: preserves the original method evidence and its explicit `response_absent` outcome without manufacturing response evidence.

Both producer inventory variants retain method observations. The empty evidence inventory may therefore contain absence observations, while the present evidence inventory requires non-empty observed response evidence. The producer contract now states exact per-method observation coverage and limits source binding to actual response-reference evidence.

The observation type is publicly exported. No producer implementation, scanner wiring, response authority implementation, or AST runtime implementation was changed in this phase.

## Why this is a stronger model

The prior inventory collapsed two distinct facts: “no response-reference evidence” and “no method observations.” The new contract preserves the source-level absence as an ADT observation while keeping response evidence empty. This prevents a downstream authority from treating missing evidence as proof that the controller declaration had no methods, and does not claim `response_absent` is a complete response semantic product.

This aligns with TypeScript's discriminated-union guidance: a literal discriminant lets consumers distinguish cases and check that each case is handled. It does not, by itself, prove runtime provenance; the observation must still be constructed from the canonical `ControllerDeclarationEvidence`.

## Remaining integration gap

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still constructs the declaration evidence and calls `controllerProducer.produce(...)`; it does not invoke the response evidence producer or set `responseJudgment` on `LaravelControllerScanArtifact`. That runtime migration remains deliberately deferred until the interface contract is stable.

## Verification

The phase audit is structural only. No full TypeScript typecheck or build is claimed. No `semantic/relations` or `semantic/foundation` subscanner was added or removed.
