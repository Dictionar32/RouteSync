# Phase 1831 — Laravel Inventory Identity Interface First

## Goal

Remove identity equality semantics from the inventory authority implementation and give that rule one canonical upstream owner. The prior phase used `Object.is` directly inside inventory closure logic, which made the identity rule an implementation detail rather than a declared upstream contract.

## Contract-first changes

- `sourceProjectIdentity.ts` now declares `LaravelSourceIdentitySemanticsContract` and `LaravelSourceIdentitySemanticsInterface`.
- The same upstream module owns the canonical implementation for source-project identity and source-file identity equivalence.
- Inventory contract version advances to v5 and explicitly requires the canonical identity semantics dependency.
- `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface` exposes that dependency.
- The inventory authority delegates project/source equality through the identity semantics interface; it no longer uses `Object.is`.
- Invocation judgment remains correlated as `{ sourceFile, response }`, where response is the integrated invocation pipeline result.
- The scanner boundary continues to accept the closure receipt rather than raw judgments.

## Scope and limitations

This phase does not complete production scanner migration. `laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow()`. Those legacy consumers remain visible for the next migration phase; do not claim the subscanner is retired.

The identity equivalence implementation necessarily performs value comparisons at runtime. The improvement is ownership and contract clarity: equality is centralized under the upstream source identity semantics rather than scattered as `Object.is` calls in inventory closure. This is not a claim that TypeScript interfaces execute or runtime checks disappear.

No build, typecheck, or E2E run was performed. Only static audits were used.
