# Phase 2166 — Interface-first response contract accuracy

## Scope

This phase corrects inaccurate wording in the existing response evidence contract. It does not add an interface, authority, runtime branch, relation/foundation layer, or subscanner.

## Trace findings

- `ControllerMethodEvidence.responseAttribute` already carries a closed absent/declared ADT.
- The declared variant carries a `ResponseReference`, `ResponseShape`, and exact `SourceSpan`.
- `produceResponseEvidence` emits `response_attribute_source` for every method, distinct from return observations and descriptor candidates.
- Therefore, describing *declared response-attribute source evidence* as missing was inaccurate.
- The actual unresolved obligations remain `resolved_response_attribute_descriptor` and `response_dto_declaration`.
- `resolveResponseAttributeAst` still resolves the class file, parses DTO properties, and merges observed returns in the legacy path. No claim is made that this legacy ownership has been retired.

## Change

Updated the existing upstream producer contract and its coverage wording to distinguish syntax evidence from semantic resolution. The contract now states that parsed attribute evidence is already produced, while a resolved descriptor and source-correlated DTO declaration judgment remain absent.

## Architectural decision

Keep the existing invocation authority, invocation executor, integrated response pipeline, response evidence producer, response source-binding authority, response judgment authority, and response executor. Do not introduce relation/foundation/subscanner layers or duplicate authorities. The next behavioral migration still requires a typed DTO declaration inventory from an upstream source-model stage; `SourceProjectIdentity` alone is not that inventory.

## Verification boundaries

The dedicated audit checks interface signatures, evidence variants, contract accuracy, runtime delegation, scanner wiring, and the still-active legacy resolver. It is not a full build/typecheck/test claim.
