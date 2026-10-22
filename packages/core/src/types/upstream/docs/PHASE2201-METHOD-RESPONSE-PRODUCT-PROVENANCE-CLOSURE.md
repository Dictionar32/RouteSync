# Phase 2201 — Method Response Product Provenance Closure

## Root cause

Phase 2200 closed DTO declaration ownership in the declaration-resolution judgment, but the integrated response pipeline still emitted method response products containing only the canonical return semantic and `ResponseResult`. DTO response-contract projection judgments remained attached to the integrated response evidence bag. A downstream consumer could see the DTO contracts and the method products, but the product contract itself did not state which DTO contracts belonged to which method.

## Change

The existing `LaravelControllerMethodResponseProduct` now carries `dtoResponseContracts`. The existing response projection composes this property from the canonical method evidence already retained by each DTO declaration judgment. It only admits `controller_response_attribute_owner` judgments whose `methodEvidence` is the exact same canonical evidence object as the method product; `dto_property_type_reference_owner` judgments cannot become controller method response contracts.

This is not a new authority and it does not classify source syntax. It carries the existing projection judgments onto the method product that owns them. The AST projection continues forwarding the exact product and does not rebuild the association.

## Contract versions

- `LaravelControllerResponseSemanticJudgmentContract`: 12 → 13.
- `LaravelControllerResponseSemanticPipelineContract`: 29 → 30.
- `LaravelControllerMethodResponseAstProjectionContract`: 2 → 3.

## Constraints preserved

- Canonical invocation judgment is retained without reconstruction.
- DTO declaration and response projection remain owned by existing upstream interfaces.
- No new `relation`, `foundation`, or `subscanner` layer.
- Runtime executor remains a delegator; AST projection does not reclassify semantics.
- No source-span lookup is used to reconstruct method ownership.

## Validation limits

Syntax transpilation and structural assertions are performed for this phase. Full TypeScript typecheck, Vitest, and package build are not claimed unless executed separately.
