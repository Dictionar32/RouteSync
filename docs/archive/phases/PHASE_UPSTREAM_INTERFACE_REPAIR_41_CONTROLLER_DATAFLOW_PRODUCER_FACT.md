# Phase 41 — Controller Dataflow Producer Semantic Fact

## Scope
Whole `packages/core/src`, excluding legacy `packages/core/src/compiler.ts`.

## Trace
`controllerDataflowContract.ts` was re-inferring model origin from raw `PhpAstValue`, parameters, and reverse definition lookup. The scanner AST did not carry the semantic fact, forcing downstream semantic reconstruction.

## Repair
Raised the controller scanner AST boundary:

- `ControllerVariableDefinition.semantic: ControllerVariableSemantic`
- `ControllerParameterAst.semantic: ControllerVariableSemantic`

The existing controller dataflow compatibility resolver now consumes those producer facts when available instead of reconstructing model origin from raw expression shape.

## Intent
Target flow:

```text
PHP source
  -> controller lexer/dataflow AST
  -> ControllerVariableSemantic
  -> controller semantic contract
  -> downstream
```

not:

```text
raw PhpAstValue
  -> find parameter
  -> reverse-find definition
  -> infer model origin
  -> downstream
```

## Important migration state
The producer scanners that construct `ControllerVariableDefinition` and `ControllerParameterAst` have not yet been migrated to populate the new semantic field. Resulting TypeScript errors are intentional migration signals; do not weaken the interface or add fallbacks to make them compile.

## Legacy exclusion
`packages/core/src/compiler.ts` remains excluded because it is the legacy compiler file already replaced by `packages/core/src/compiler/`.
