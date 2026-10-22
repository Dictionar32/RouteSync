# Phase 2042 — Controller Method Evidence Projection, Interface First

## Trace finding

`laravelControllerScanner.ts` directly assembled `ControllerMethodEvidence`, including method source spans and return-expression evidence. This duplicated the existing `ControllerProducer` ownership boundary: the producer already owns declaration-to-controller artifact projection, but method evidence construction remained embedded in scanner wiring.

## Change

- Extended the existing upstream `ControllerProducer` contract with `projectMethodEvidence` rather than introducing a second producer/authority or a `relation/foundation` subscanner.
- Added `ControllerMethodEvidenceSyntax`, an upstream syntax-evidence shape. The upstream contract does not import concrete scanner AST types.
- The projection receives precomputed `ControllerActionFlowContract` and `ControllerMethodContract`. It only packages them with source spans and return-expression syntax; it does not rerun action/response/invocation semantic reasoning.
- `laravelControllerScanner.ts` now delegates the `ControllerMethodEvidence` assembly to the existing producer.
- The canonical invocation judgment, response semantic pipeline, and AST projection continue on the same path.

## Remaining boundary

`controllerMethodContractFromMethod` and `controllerActionFromMethod` still perform concrete AST-to-semantic projection before this evidence projection. This phase does not claim that action semantic inference has already moved into a closed upstream judgment. That is a separate trace target; moving those functions without modeling their semantic inputs and outcomes would only relocate runtime reasoning.

## Verification

Run `npm run audit:phase2042-controller-method-evidence-projection-interface-first`. This is a structural audit, not a substitute for full TypeScript type-check or build.
