# Phase 891 — Upstream Controller Parameter Wiring

## Trace

The existing upstream controller contracts already define:

- `ControllerParameterKind`
- `ControllerParameter`
- `ControllerDependency`
- `ControllerMethodContract`
- `ControllerOperation`

The production controller path previously stopped at `ControllerVariableSemantic` and emitted `ControllerAction` without exposing the existing `ControllerParameter` contract.

## Repair

`ControllerAction` now owns:

```text
parameters: Sequence<ControllerParameter>
```

The canonical projection is produced in `controllerAstCanonical.ts` from the already-established `ControllerParameterAst.semantic` evidence.

Mapping authority:

```text
ControllerParameterAst.semantic
        |
        +-- request_origin -> ControllerParameterKind.request
        +-- model_origin   -> ControllerParameterKind.model
        +-- dependency identity -> ControllerParameterKind.dependency
        +-- remaining semantic values -> ControllerParameterKind.value
        |
        v
ControllerParameter
        |
        v
ControllerAction.parameters
        |
        v
ControllerActionFlowContract
```

Dependency classification does not inspect PHP parameter types. It uses the existing `ControllerDependency.parameter` identity produced by `resolveConstructorDependencies` / `resolveMethodDependencies`.

Route/model binding remains a separate route contract. No `ModelSymbolTable` classifier was added to the controller path.

## Why this shape

CodeQL separates syntax/AST representation from semantic data-flow nodes, and its data-flow API explicitly maps parameter syntax into semantic flow nodes rather than requiring downstream consumers to re-read syntax. MLIR likewise models analysis as propagation of semantic state through a solver rather than duplicating interpretation at consumers. RouteSync's existing upstream contracts follow the same direction: scanner AST is evidence, while `ControllerParameter` is the semantic boundary.

References:

- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- CodeQL data-flow model: https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/
- MLIR DataFlowSolver: https://mlir.llvm.org/doxygen/classmlir_1_1DataFlowSolver.html

## Audit

`audit-phase891-upstream-controller-parameter-wiring.cjs` verifies:

- existing upstream parameter ADTs remain the authority;
- `ControllerAction` exposes `ControllerParameter`;
- canonical producer is wired;
- dependency identity comes from `ControllerDependency.parameter`;
- request/model semantics come from existing `ControllerVariableSemantic`;
- PHP `parameter.type` is not reclassified;
- controller does not gain a second `ModelSymbolTable` authority;
- route binding remains separate;
- legacy empty-file count remains 203;
- no legacy file is deleted.
