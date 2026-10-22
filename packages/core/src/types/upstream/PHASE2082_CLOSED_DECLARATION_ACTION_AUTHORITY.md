# Phase 2082 — Closed Declaration Action Authority

## Contract change

`ControllerDeclarationSemanticSelection` now grants `actionMethods` only on the `controller_declaration_selection_complete` variant. A `controller_declaration_selection_blocked` value carries ancestry evidence and termination, but has no executable action list in its type or runtime shape.

This makes the discriminant enforce an authority rule rather than merely annotate an outcome:

- `complete` means the declaration ancestry reached a known root and the selected action methods are available.
- `blocked` means ancestry could not be closed; action selection is not exposed to consumers.

The existing `ControllerDeclarationSemanticJudgment` and authority are evolved in place. No parallel interface, folder, or new runtime authority was introduced.

## Runtime implementation change

The existing authority computes `selectActions(candidate)` only in the complete branch. The blocked branch no longer constructs an action list. Existing scanner flow already narrows blocked outcomes before reading `actionMethods`, so its control-flow boundary remains aligned with the contract.

## Regression assertions added

The existing Phase 1968 authority test now asserts that ambiguous-parent, unresolved-parent, and cyclic-ancestry outcomes do not expose `actionMethods` at runtime.

## Scope and limitations

This strengthens declaration/action authorization. It does not claim that the Laravel scanner is free of `semantic/relations`, controller subscanners, functions, constants, or classes. Action contract derivation remains a separate migration target. Build, typecheck, and Vitest were not run in this environment.
