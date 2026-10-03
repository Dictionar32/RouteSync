# Phase 591 — Scanner Construction Frontier

Phase 591 moves resource scanner semantic construction behind a relation-shaped construction catalog and removes host construction/control authority from the selected resource-binding and resource-group scanner frontier.

## Cutover

- Resource semantic type creation now goes through `scannerSemanticType`.
- Scanner validation entries are immutable data produced by a factory object rather than direct class construction.
- Resource-group descriptors expose relation-bound `create` projections; scanner code no longer instantiates descriptor classes directly.
- Resource variable-definition lookup uses `RelationIndex` rather than a host `Map` default.
- `new Error(...)` was removed from the scanner production surface.

The compatibility semantic type classes remain below the projection boundary for now. They are the next construction-authority frontier; this phase deliberately does not claim that the entire repository is constructor-free.

## Research model

The design follows the same separation seen in declarative compiler/semantics systems: facts and constraints are the authority, while execution is a projection/evaluator. MLIR PDLL expresses matching and rewriting declaratively; WebAssembly specifies validity as declarative typing constraints; Soufflé expresses recursive analysis as Horn rules; Statix models scope/name resolution through scope-graph relations; K models semantics through rewrite rules; egglog unifies Datalog fixed-point reasoning with equality saturation. These are reference points, not copied implementations.

## Validation

`audit:phase591-scanner-frontier` uses the TypeScript AST rather than raw token matching. Source-language `null` evidence is therefore not confused with a host `null` expression.
