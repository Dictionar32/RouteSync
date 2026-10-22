# Phase 2016 — Controller Declaration Blocked Propagation, Interface First

## Trace and root cause

The existing `ControllerDeclarationSemanticJudgment` already returns a closed selection ADT. The complete branch proves `root_reached`; the blocked branch preserves `parent_outside_inventory` or `inheritance_cycle`. The controller scanner previously selected `actionMethods` and continued to produce controller AST artifacts without first excluding the blocked branch. Consequently, a declaration whose ancestry was not closed could be published as an ordinary controller AST.

## Contract-first change

The existing `LaravelControllerScannerInterface` contract was evolved to version 23. `LaravelControllerScanJudgment` now carries `ControllerDeclarationSelectionInventoryOutcome`, a closed ADT with:

- `controller_declaration_selection_inventory_complete`
- `controller_declaration_selection_inventory_blocked`, preserving controller identity and the original ancestry termination.

This is an extension of the existing scanner contract, not a second semantic authority.

## Runtime executor alignment

`laravelControllerScanner.ts` now checks the existing declaration judgment before deriving actions. A blocked selection is retained in the aggregate blocker outcome and is not projected into `LaravelControllerScanArtifact`. Complete selections follow the existing invocation/response judgment and AST projection path unchanged.

`laravelSourceAstPipeline.ts` marks the controller AST category `not_scanned` when declaration selection is blocked. The existing `validateCompleteSourceAst` then prevents a blocked declaration inventory from being reported as a complete source-AST projection.

## Explicit boundaries

- No `relation` or `foundation` subscanner was added.
- Existing `semantic/relations` imports remain; this phase does not claim their retirement.
- This phase does not claim the whole Laravel scanner is a thin executor; parsing and source evidence collection remain in the scanner.
- Full TypeScript typecheck, build, and runtime integration tests have not been verified in this environment.
