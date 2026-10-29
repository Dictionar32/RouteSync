# Phase 1545 — Interface Contract / Implementation Separation

## Goal

Make the upstream interface the architectural contract, rather than a file that
also owns the executable validation algorithm. This phase intentionally does
not modify semantic reasoning, closure derivation, or the scanner's semantic
model.

## Trace

`core/src/types/upstream/semanticDataflowInterface.ts`
- Owns public ADT aliases, request/result unions, rejection/acceptance types, and
  the `SemanticDataflowJudgmentBoundaryInterface` and
  `SemanticDataflowRuntimeExecutorInterface` contracts.
- Contains no executable judgment admission algorithm after this change.

`core/src/types/upstream/semanticDataflowAdmission.ts`
- Implements `SemanticDataflowJudgmentBoundaryInterface`.
- Checks the already-produced proof envelope and references.
- Does not derive facts, recompute closure, or repair judgments.

`core/src/types/upstream/semanticDataflowRuntimeExecutor.ts`
- Is the single runtime composition point: authority -> admission boundary.
- Implements the contract declared by `semanticDataflowInterface.ts`.

`core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts`
- Consumes `semanticDataflowRuntimeExecutor.execute(...)` only for this path.
- Does not import the authority or admission implementation directly.
- Still has a legacy compatibility projection; that is a separate downstream
  migration and is not falsely claimed complete here.

## Contract invariants

1. Interface declarations are not the admission implementation.
2. Semantic authority is the only component that derives the judgment.
3. Admission only accepts/rejects a produced judgment.
4. Runtime executor owns composition; scanner does not recompose it.
5. Request variants are correlated with their result variants at the type level.
6. `no_evidence` is a protocol outcome, never a successful semantic judgment.
7. Compatibility projection is not treated as canonical authority.

## Remaining work

- Inventory all scanner semantic producers beyond the data-flow analyzer.
- Migrate consumers off the legacy projection only after their requirements are
  represented by a declared contract.
- Run the project build and regression tests with the repository-pinned toolchain.

## Verification limitation

The workspace does not contain `node_modules/.bin/tsdown`, so a full build cannot
be claimed. The Phase 1545 audit verifies source-boundary architecture only; it
is not a substitute for type-checking or runtime tests.

## Design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic consumers invoke behavior through declared contracts rather than duplicating concrete implementation knowledge.
- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/ — IR values/operations are explicit representations, which supports separating model, contract, and execution.
- TypeScript Compiler Architectural Overview: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2 — parser, binder, checker, and emitter are distinct responsibilities.
