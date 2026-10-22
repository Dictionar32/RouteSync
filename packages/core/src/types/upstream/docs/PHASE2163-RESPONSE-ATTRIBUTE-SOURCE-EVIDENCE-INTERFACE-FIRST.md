# Phase 2163 — Response Attribute Source Evidence, Interface First

## Trace finding

The existing response evidence producer retained direct PHP return observations and descriptor-derived response-reference candidates, but it did not retain the parser's response-attribute declaration as a distinct source fact. This made the response evidence inventory insufficient for a future migration away from `resolveResponse()`.

## Changes

- Evolved the existing `ControllerMethodEvidence` contract with a closed `ControllerResponseAttributeSourceEvidence` ADT: `response_attribute_not_declared` or `response_attribute_declared` carrying a typed `ResponseReference` and `ResponseShape`.
- Evolved the existing `ControllerProducer` projection contract to project that parsed source fact without interpreting DTO fields or claiming an HTTP response result.
- Wired `LaravelControllerScannerExecutor` to supply the already-parsed response-attribute fact to the existing producer.
- Evolved the existing `LaravelControllerResponseSemanticEvidence` with `response_attribute_source` and made the existing evidence producer retain it per method, alongside direct return evidence and the separate descriptor candidate.
- Updated the existing evidence coverage contract to state that response-attribute source evidence is now produced while resolved response-descriptor evidence and DTO declaration evidence remain open.
- Kept the existing source-binding authority and integrated response pipeline. No new authority, relation/foundation layer, or response subscanner was introduced.

## Semantics preserved

`response_attribute_source` is source syntax evidence only. It is not a resolved DTO declaration, a response shape proof, or proof that PHP returns an HTTP response. The existing `declared_response_attribute` semantic evidence variant still represents a resolved inline descriptor; the coverage calls out that resolved descriptor obligation separately to avoid conflating these levels.

## Still open

- The response evidence producer does not yet acquire the DTO class declaration and its field evidence through this contract.
- `resolveControllerActionContract()` still calls `resolveResponse()` and `resolveResponseAttributeAst()` remains the legacy resolver of DTO source, fields, and merged observed-return fields.
- Full legacy retirement must wait until the existing integrated response pipeline consumes complete source-bound DTO declaration evidence and produces the required closed descriptor/response product.

## Validation scope

The phase audit verifies contract shape and production wiring. Syntax-only transpilation is not a full typecheck. Full build, full typecheck, and Vitest were not run.
