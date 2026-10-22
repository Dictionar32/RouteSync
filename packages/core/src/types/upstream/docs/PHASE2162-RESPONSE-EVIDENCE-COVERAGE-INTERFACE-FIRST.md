# Phase 2162 — Response Evidence Production Coverage, Interface First

## Finding

The existing `LaravelControllerResponseSemanticPipelineInterface` is wired into `LaravelControllerScannerExecutor`, and its evidence producer correctly keeps parser-observed returns distinct from descriptor-derived response-reference candidates. However, the producer's actual evidence union is narrower than the complete response semantic evidence union: it does not yet produce `declared_response_attribute` or `response_dto_declaration` evidence. Meanwhile, `resolveControllerActionContract()` still invokes `resolveResponse()`, and `responseAttributeScanner.ts` still resolves the declared DTO class, extracts fields, and combines them with observed return fields.

This means the integrated response pipeline is real and useful, but its evidence production is not yet the sole owner of declared-response descriptor derivation.

## Change

- Added `LaravelControllerResponseEvidenceProductionCoverage`, a closed typed coverage value attached to both empty and non-empty evidence inventories.
- The coverage explicitly enumerates produced evidence (`observed_controller_return`, `controller_action_response_reference_candidate`) and missing evidence (`declared_response_attribute`, `response_dto_declaration`).
- Advanced the existing evidence-production interface/contract from version 5 to 6.
- Wired the existing producer to attach the same coverage value for both inventory outcomes.
- Did not add a response authority, relation/foundation layer, or subscanner.

## Why this is an architectural repair

An evidence inventory must not look complete merely because its list is non-empty. The output now carries an explicit typed remainder that tells downstream orchestration exactly which upstream facts have not crossed the interface boundary. This prevents a closed inventory shape from being mistaken for closed semantic ownership.

## Still open

This phase does **not** retire `resolveResponse()` or `resolveResponseAttributeAst()`. The next production migration must enrich the existing source-bound evidence contract with declared response-attribute and DTO declaration evidence, then have the existing response semantic pipeline consume it. Only after that path is wired and audited can the legacy descriptor resolver be retired. The current response descriptor remains a compatibility projection, not the authority for integrated HTTP return meaning.

## Validation

The targeted audit verifies both inventory variants carry coverage, the interface and implementation versions match, the integrated response pipeline remains wired, and the legacy ownership remainder stays explicit. Syntax-only transpilation is performed for the changed TypeScript files. Full build, full typecheck, and Vitest are intentionally not run.
