# Phase 1993 — Response Reference Provenance, Interface First

## Scope

This phase changes upstream response evidence contracts only. It does not implement the response producer, alter scanner runtime, wire the response authority, delete subscanners, or run the full build.

## Trace finding

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` constructs each action's response as `response_present` from `result.descriptor.response.responseTypeName()`. That is a descriptor-derived response reference candidate, not direct proof that a PHP return expression was observed. The prior upstream evidence kind `observed_controller_response_reference` overstated that provenance by describing the item as parser-backed.

The same scanner builds `ControllerMethodEvidence` from the action, method contract, and source span. Existing `ControllerResponse` already distinguishes `response_present` from `response_absent`, but the current scanner path synthesizes the present variant for every scanned action. This phase records that as a runtime integration defect; it does not silently change runtime while the requested work is contract-first.

## Contract changes

- Replaced `observed_controller_response_reference` with `controller_action_response_reference_candidate`.
- Added the required origin discriminant `controller-action-descriptor-response-type`.
- Added `LaravelControllerResponseReferenceCandidateEvidence` as the accurate public type name.
- Updated producer observations to call the present case a response-reference candidate, not an observed PHP return.
- Included the candidate in the source-indexed evidence shape so the existing source-identity authority can bind the candidate to the invocation source. That binding proves file identity only; it does not promote the candidate to direct PHP return evidence.
- Bumped the response producer contract to version 2 and response semantic judgment contract to version 5.
- Added the explicit `descriptorCandidateBoundary` obligation.

## Required semantic ownership

`ControllerDeclarationEvidence` remains the evidence owner. The response producer can collect candidate evidence but cannot classify response products. `LaravelSourceIdentitySemanticsInterface` remains the identity owner. The response semantic authority must not treat descriptor provenance as direct return proof. Runtime executor and AST projection must preserve authority-owned judgments without reclassification.

## Not changed

- `laravelControllerScanner.ts` runtime implementation remains untouched.
- `controllerProducer.produce(...)` wiring remains untouched.
- `LaravelControllerScanArtifact` production still lacks the integrated response judgment.
- No `relation` or `foundation` subscanner was added or deleted.

## Verification

The phase audit is a structural contract audit. TypeScript `transpileModule` is syntax-only. No full project typecheck or build is claimed.
