# Phase 915 — Upstream Controller Evidence Boundary

Controller producer input no longer accepts concrete scanner AST values.

## Boundary

`ControllerMethodAst` / declaration AST are scanner implementation evidence. The producer receives:

- `ControllerDeclarationEvidence`
- `ControllerMethodEvidence`
- `ControllerMethodContract`
- `ControllerActionFlowContract`

The scanner remains responsible for converting concrete AST into these semantic evidence contracts.

## Dataflow

No dataflow ontology is added. The Phase 910 semantic dataflow contract remains the authority boundary.

## Laravel alignment

Laravel's `HasMiddleware`, middleware attributes, `only`/`except`, and resource middleware scopes are semantic declarations. They should be represented as evidence/contracts before applicability and dataflow projection.
