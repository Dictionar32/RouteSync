# Phase 28 — Controller Return Semantic Contract

## Scope
Upstream interface only.

## Trace finding
The controller return contract previously exposed only `absent | expression`, while resource/model origin was stored separately in `resourceBindings`. A downstream consumer could therefore need to traverse the return expression and join it against resource bindings to discover what the controller returns.

## Repair
Introduced `ControllerReturnSemantic` with correlated cases:
- `absent`
- `resource` with resource + model + expression
- `model` with model + expression
- `expression`

`ControllerSemanticDataflow.returned` now uses this contract.

## Principle
The meaning of a returned expression must travel with the expression. Downstream must not resolve the return origin by traversing AST or joining unrelated collections.
