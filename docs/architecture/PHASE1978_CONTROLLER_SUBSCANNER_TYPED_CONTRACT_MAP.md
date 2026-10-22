# Phase 1978 — Controller subscanner typed contract map

## Scope

This phase is interface-only. It changes the type-level ownership map in `types/upstream/laravelSubscannerRetirementInterface.ts` and its type-only public exports. It does not edit controller scanner implementation, runtime executor, AST projection implementation, response composition implementation, or wiring.

No `semantic/relations`, `semantic/foundation`, replacement-subscanner, or parallel invocation authority is added.

## Trace correction

The previous responsibility map named `InvocationSemanticIntegratedResponseCompositionInterface` as the target for response-attribute, response-shape, and response-DTO scanners. That was an incorrect boundary: the composition interface accepts a semantic-knowledge projection and an authority-integrated PHP invocation outcome; it does not accept raw response descriptors or DTO fields as composition input.

Phase 1978 corrects those three ownership labels to `LaravelSourceAstPipelineInterface` and adds `LaravelControllerSubscannerResponsibilityTypeMap`. This type map uses actual upstream/domain types for the responsibility's source-evidence shape, semantic product, and existing owner. The type-level projections `LaravelControllerSubscannerSemanticProduct<Kind>` and `LaravelControllerSubscannerSemanticOwner<Kind>` allow callers and future audits to resolve the real types instead of treating descriptive string labels as the contract itself.

The canonical semantic chain remains:

`Laravel source evidence → LaravelControllerScannerInterface → LaravelControllerInvocationSemanticJudgmentInterface → InvocationSemanticIntegratedResponseCompositionInterface → LaravelSourceAstProjectionJudgment → canonical AST/ADT`

The composition result is not substituted for the controller invocation judgment. The invocation judgment keeps its exact discriminated PHP invocation outcome; the integrated response remains the aggregate of publication result and PHP invocation outcome; AST projection preserves complete versus blocked projection as a separate ADT.

## Existing implementation findings

The 12 non-empty controller subscanner modules are still present. A direct import trace found 27 textual imports/references to `semantic/relations/` across those files and zero `semantic/foundation/` path references. This phase does not claim those legacy relation helper dependencies are removed; removing them requires a later runtime migration after the actual consumers have been moved to the existing typed upstream contracts.

## Audit

`node scripts/audits/audit-phase1978-controller-subscanner-typed-contract-map.cjs` passes 8/8 structural checks. This is not a TypeScript build or typecheck. No build was run.
