# Phase 2083 — Closed Action Selection Judgment

## Goal

Strengthen the existing declaration semantic contract so action eligibility is an explicit upstream judgment, not a filtered list that loses why methods were excluded. The change evolves `ControllerDeclarationSemanticSelection` and its existing authority in place. It does not introduce a parallel interface or move the existing contract to another folder.

## Contract change

The complete declaration outcome now carries `actionSelections`, a discriminated union for each method:

- `controller_action_selected` carries the method authorized for action projection.
- `controller_action_excluded` carries the method and a closed exclusion reason: `non_public_visibility`, `constructor_lifecycle_method`, or `laravel_middleware_registration_hook`.

The `blocked` declaration outcome carries no `actionSelections`. Thus the ancestry closure discriminant still gates all action authorization, while complete declarations preserve the decision for each candidate method.

## Runtime integration

`controllerDeclarationSemanticJudgmentAuthority.ts` now emits the per-method judgment. `laravelControllerScanner.ts` consumes only the `controller_action_selected` outcomes after it has narrowed the declaration outcome to `controller_declaration_selection_complete`. It no longer receives a pre-filtered `actionMethods` list with the exclusion evidence erased.

The eligibility rules preserve the previous behavior:

1. Methods not public or implicit are excluded.
2. `__construct` is excluded as a lifecycle method.
3. Static `middleware` is excluded when the declaration implements `HasMiddleware`.
4. Other public or implicit methods remain selected.

## Regression coverage

The existing authority test now checks both selected methods and exclusion reasons. A dedicated assertion checks the `HasMiddleware` static middleware hook. Existing blocked ancestry assertions now verify that `actionSelections` is absent for ambiguous parent inventory, unresolved parent identity, and inheritance cycles.

## Trace: remaining architectural gaps

This is a contract strengthening, not a claim that the whole scanner is now a pure executor. The current trace still finds:

- `laravelControllerScanner.ts` imports `semantic/relations` operations and calls `scanControllerAction`.
- `actionScanner.ts` calls `resolveControllerActionContract`.
- `controllerActionContract.ts` still performs semantic derivation and imports relation helpers and controller subscanner modules.
- `controllerDeclarationSemanticJudgmentAuthority.ts` still uses helper functions for ancestry traversal and action judgment. These are currently inside the authority implementation, not in the scanner, but they are not yet expressed as a fully declarative relation-free semantic algebra.
- AST parsing/projection, integrated response judgment, and correlated artifact contracts remain separate existing owners; this phase does not reconstruct them or claim they have been migrated.

## Verification boundary

A repository-local static assertion audit was performed for the changed contract, authority, scanner consumer, and regression test. Full TypeScript typecheck, build, and Vitest were not run. No claim is made that the whole codebase is free of `relation/foundation`, subscanners, functions, constants, or classes.
