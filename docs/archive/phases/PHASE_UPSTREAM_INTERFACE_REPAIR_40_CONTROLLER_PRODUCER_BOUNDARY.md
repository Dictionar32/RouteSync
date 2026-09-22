# Phase Upstream Interface Repair 40 — Controller Semantic Producer Boundary

Date: 2026-09-19

## Scope

Whole `packages/core/src` active tree. `packages/core/src/compiler.ts` remains legacy/excluded.

## Trace

`controllerDataflowContract.ts` was traced against canonical `types/upstream/controller.ts`.

The canonical upstream contract already contains the higher-level facts:

- `ControllerVariableSemantic`
- `ControllerVariableDefinition`
- `ControllerVariableBinding`
- `ControllerResourceBinding`
- `ControllerSemanticReturn`
- `ControllerSemanticDataflow`

The active scanner still owns a duplicate semantic vocabulary and reconstructs model origin by traversing raw `PhpAstValue` in `resolveModelOrigin()`.

## Root found

The remaining duplication cannot safely be solved by another lookup wrapper. The active controller producer is still using `ResourceExpressionModel`, while the canonical upstream controller contract requires the canonical upstream `Expression` ADT.

Therefore the missing upstream boundary is:

```text
PhpAstValue
  ↓
source/provenance-complete expression AST
  ↓
upstream Expression ADT
  ↓
ControllerVariableSemantic
  ↓
ControllerSemanticDataflow
```

The current `PhpAstValue`/`ResourceExpressionModel` boundary does not yet carry enough canonical source/provenance information to populate the upstream `Expression` contract without fabricating spans or duplicating another expression vocabulary.

## Repair decision

Do not weaken the canonical upstream controller interface and do not add another `T | undefined` adapter.

The next interface root is the **expression AST provenance/semantic mapping boundary**. Once that is raised, `controllerDataflowContract.ts` can emit the existing canonical upstream controller facts directly and `resolveModelOrigin()` can be removed rather than wrapped.

## Important

No compiler consumer flow was changed in this phase. `compiler.ts` legacy remains excluded.
