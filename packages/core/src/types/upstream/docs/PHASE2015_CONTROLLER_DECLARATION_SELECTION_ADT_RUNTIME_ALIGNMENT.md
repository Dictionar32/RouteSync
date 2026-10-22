# Phase 2015 — Controller Declaration Selection ADT / Runtime Alignment

## Trace finding

`ControllerDeclarationSemanticJudgment` declared an outcome-indexed ADT:

- `controller_declaration_selection_complete`, requiring `root_reached`;
- `controller_declaration_selection_blocked`, requiring either an out-of-inventory parent or an inheritance cycle.

The authority implementation emitted a third, undeclared discriminant (`controller_declaration_semantic_selection`) and attached the raw termination union. The implementation therefore did not construct the contract's closed judgment, despite the interface already requiring it.

## Change

The existing authority now derives the ADT discriminant from the existing ancestry termination judgment. It preserves the controller identity, action candidates, inherited controller names, and inherited middleware attributes. No new authority, relation subscanner, or foundation subscanner is introduced.

## Boundary still open

The controller scanner still consumes declaration selections by controller name and does not yet propagate a blocked declaration selection as a blocked `LaravelControllerScanJudgment`. This phase corrects the authority's output contract; it does not claim that blocked ancestry is fully propagated through controller → response → route → source-AST execution. That is the next required interface-first change.
