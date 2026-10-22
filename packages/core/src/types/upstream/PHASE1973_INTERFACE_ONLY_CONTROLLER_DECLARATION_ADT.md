# Phase 1973 — Interface-Only Controller Declaration ADT

## Trace result

The canonical Laravel invocation judgment already preserves its four integrated response outcomes (`not_connected`, `source_binding_rejected`, `complete`, `blocked`) inside the source-correlated judgment. The AST projection context retains that exact judgment; this phase does not add another invocation authority, response wrapper, or scanner.

The remaining interface-level defect in the adjacent controller declaration contract was that `ControllerDeclarationSemanticSelection` allowed `ancestryTermination` to be `parent_outside_inventory` or `inheritance_cycle` while the same value still looked like an ordinary selection. That made a partial ancestry result structurally indistinguishable from a complete controller declaration projection.

## Interface-only correction

`controllerDeclarationSemanticJudgmentInterface.ts` now models the existing selection as a closed ADT:

- `controller_declaration_selection_complete` requires `root_reached`.
- `controller_declaration_selection_blocked` requires either `parent_outside_inventory` or `inheritance_cycle`.
- Both variants retain source-derived local action methods and the ancestry facts already established, without promoting partial ancestry to a complete result.

No authority implementation, scanner runtime, executor, resolver, projection, wiring, or semantic relation was edited in this phase. The implementation remains intentionally unmigrated and will need a later explicitly requested wiring phase to construct the new discriminants.

## Explicit exclusions

- No `relation` or `foundation` subscanner was created or used as a new layer.
- No second invocation judgment/authority was introduced.
- No runtime function was moved to another file.
- No build or TypeScript compilation is claimed; the type contract is intentionally ahead of its implementation.
