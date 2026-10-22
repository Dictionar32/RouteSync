# Phase2371 — Existing Declaration Evidence Authority

## Audit and trace

`RouteDeclarationEvidence` already exists in the upstream type layer and is carried by `RouteProducerInput.declaration`. Phase2370 introduced a second, resource-only evidence type for the same parsed declaration. That created parallel representations of one source concept and left the authority boundary disconnected from the canonical declaration contract.

## Evolution

`RouteResourceDeclarationInput` now consumes the existing `RouteDeclarationEvidence`. The resource authority owns the semantic derivation of `ResourceName`, `RouteResourceRegistration`, and the closed `RouteResourceFlowJudgment`. The scanner only projects parsed AST facts into the existing evidence contract and passes it to the authority.

The AST-to-evidence projection is shared with the existing producer-boundary path, avoiding a second resource-specific projection operation.

## Remaining issues

This is a bounded contract correction, not full completion. The scanner still uses `routeDeclarationFlow`, controller/action projections, `semantic/relations`, and `subscanners` for emision/path work. The next contract-first step must determine the existing owner of the whole route-declaration judgment before changing executor wiring. CLI end-to-end and type-check are not claimed as passing.
