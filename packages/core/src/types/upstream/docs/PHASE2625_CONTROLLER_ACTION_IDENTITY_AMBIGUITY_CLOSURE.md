# Phase 2625 — Controller/Action Identity Ambiguity Closure

## Root cause

The canonical `controllerActionBindingAlgebra` used `.find()` for supplied policies and catalog controllers. Multiple records sharing a controller/action identity therefore collapsed into whichever record appeared first. The source-model policy lookup independently used `matching[0]`, producing the same unsafe result. In addition, `sourceModelReferenceIndexFromCatalog` projected the entire effective-policy inventory directly and then projected policy relations again while iterating controller nodes, creating a second success path that could preserve duplicate policy output even after binding was made ambiguity-aware.

## Changes

- Evolved the existing `ControllerActionBindingResult` ADT with `supplied_policy_ambiguous` and `catalog_controller_ambiguous` variants.
- Changed the existing binding algebra to collect exact-identity candidates and distinguish zero, one, and multiple candidates. It no longer chooses a first match.
- Routed ambiguous route bindings into a blocked `EffectiveControllerActionPolicy` judgment, carrying every candidate's controller/action identity and source provenance.
- Routed ambiguous source-model policy inventories into the same explicit blocked judgment rather than falling back to raw controller evidence.
- Removed the duplicate direct projection of `effectivePolicies`; the controller/action inventory binding lane is now the single source-model policy projection path, while route-specific policy projection remains separate.
- Added a focused Vitest contract test for duplicate supplied policies, duplicate controller candidates, and unique supplied-policy precedence.

## Intended flow

`typed controller/action identity + closed policy/controller inventory`
→ `controllerActionBindingAuthority`
→ `unique | ambiguous | unbound` ADT
→ `complete policy | explicit blocked semantic judgment | evidence-only fallback when genuinely unbound`
→ `source-model relation graph`
→ `manifest judgment`
→ `CLI output gate`

Ambiguity is not converted into a successful policy, and no first candidate is silently selected.

## Verification

- Structural audit: `node scripts/audits/audit-phase2625-controller-action-identity-ambiguity.cjs`
- Audit script syntax: `node --check scripts/audits/audit-phase2625-controller-action-identity-ambiguity.cjs`
- TypeScript parser checks are performed separately for the changed TypeScript files.
- Full project typecheck/build/Vitest/CLI E2E are not claimed as passing. The available global TypeScript 5.8.3 reports numerous pre-existing project errors and does not match the package's declared TypeScript 7.0.2 dependency; package-local dependencies are not installed in this workspace.

## Remaining boundary

The binding input still represents controller and action identity as string fields. This phase closes first-match ambiguity and preserves provenance, but a follow-up should trace whether those string fields can be replaced by the existing typed `ControllerName` and `ActionName` identity contracts without introducing another identity model. That migration must be done at the producer/consumer boundary, not by adding a parallel resolver.
