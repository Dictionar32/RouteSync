# Phase 1364 — Controller Semantic Flow Contract Adoption

## Change

`ControllerSemanticVariableFlow` is the upstream contract for a controller's canonical semantic variable bindings. The controller lexer AST already uses this type, and the canonical dataflow analyzer produces it. The scanner's `ControllerDataflowContract` previously weakened that boundary by restating the shape inline as `{ variables: Sequence<ControllerVariableBinding> }`.

The scanner contract and its helpers now consume `ControllerSemanticVariableFlow` directly. This removes a duplicate shape declaration and makes the producer → wiring → consumer path explicit without changing runtime data or semantic classification.

## Flow

`produceSemanticKnowledgeDataFlow` → `canonicalSemanticVariables` → `ControllerSemanticVariableFlow` → `ControllerDataflowContract` → resource-binding projection.

The AST evidence and dataflow representation remain distinct. The change does not synthesize `ControllerExpressionFact`, `ExpressionDefinition`, `ValidationRuleDefinition`, or `SchemaRelationTarget` into this path because their meanings are not interchangeable with the canonical variable-flow contract.

## Validation

Run `npm run audit:phase1364-controller-semantic-flow-contract`. This audit checks that the upstream contract is used consistently and that the duplicate inline shape is gone. A static audit is not a substitute for the TypeScript build or runtime tests.
