# Phase 1967 — Controller Declaration Judgment, Interface First

## Trace finding

`compiler/scanner/wiring/laravelControllerScanner.ts` previously owned three semantic decisions directly:

- excluding `__construct` from controller actions;
- excluding static `middleware()` when the declaration implements `HasMiddleware`;
- recursively deriving inherited controller names and inherited `WithoutMiddleware` attributes.

Those decisions contradicted the intended source-artifact-only scanner boundary already described by `LaravelControllerInvocationSemanticBoundaryContract`.

## Implemented change

Added the upstream contract `ControllerDeclarationSemanticJudgment` and its authority. The contract receives typed controller identities, parent-class evidence, interface evidence, method candidates, and attribute candidates. It returns a closed selection for every controller, including selected actions, inherited controller identities, inherited middleware attributes, and a typed ancestry termination (`root_reached`, `parent_outside_inventory`, or `inheritance_cycle`).

`LaravelControllerScannerInterface` now exposes the injected declaration judgment authority and has contract version 17. The new judgment contract and its canonical authority are exported through `packages/core/src/index.ts` so the authority is not hidden as a scanner-local implementation detail. `createLaravelControllerScanner(authority)` wires the authority into the scanner. The scanner converts parser evidence to the authority input, consumes the resulting judgment, and projects the selected method values into the existing sequence-based AST pipeline. It no longer performs its own action selection or ancestry traversal.

The invocation judgment and its integrated response are not reconstructed or reclassified; the exact existing judgment still flows into `controllerProducer.produce` and the resulting controller artifact.

## Boundaries retained

- No `relation` or `foundation` subscanner was created.
- No parallel invocation authority was introduced.
- Existing controller evidence and AST projection types are reused.
- The sequence conversion in the scanner is representation adaptation only; it does not select methods or resolve ancestry.

## Verification status

The Phase 1967 audit script checks the contract, authority wiring, removal of the scanner-local action-selection and ancestry algorithms, invocation-judgment forwarding, and absence of newly added relation/foundation subscanner directories.

This is a source-level structural audit. TypeScript compilation and the project build were not run, so this artifact does not claim build success. The typed ancestry termination is now explicit, but downstream consumers have not yet been migrated to make decisions based on that termination; that is a follow-up interface integration point.
