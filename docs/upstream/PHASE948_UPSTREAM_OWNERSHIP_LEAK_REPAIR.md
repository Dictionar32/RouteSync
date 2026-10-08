# Phase 948 — Upstream ownership leak repair

## Finding

The canonical upstream contract remains `packages/core/src/types/upstream/`. There is no `packages/core/src/upstream/` tree.

A direct ownership leak was found in the semantic kernel: `packages/core/src/semantic/kernel/semanticEvidenceRelations.ts` imported scanner evidence producers, and `semantic/kernel/syntax/relationalSyntaxCursor.ts` imported scanner lexer types. Those modules were consumed only by scanner code, so the semantic kernel was acting as a reverse scanner adapter.

## Repair

The two producer-owned modules now live at:

- `packages/core/src/compiler/scanner/semantic/semanticEvidenceRelations.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/relationalSyntaxCursor.ts`

Scanner consumers import them locally. `packages/core/src/semantic/kernel` has no remaining direct `compiler/` or `scanner/` imports.

## Canonical dataflow consumption

```text
scanner semantic knowledge
  -> SemanticDataflowInput
  -> createSemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface
  -> SSA / lowering consumers
```

`reaches` remains authority-derived only; it is not accepted by `SemanticDataflowInput`.

## Laravel policy consumption

```text
Laravel route/controller/resource evidence
  -> effective controller-action policy closure
  -> ControllerActionPolicyRelation / RouteActionPolicyRelation
  -> sourceModel.relations
  -> structural graph filter excludes policy
```

Policy relations are intentionally not graph edges and are not generic dataflow facts.

## Remaining advisory frontier

`types/upstream` currently uses generic relation helpers from `semantic/kernel`. Conversely, a small number of kernel modules use upstream types. This is a foundational-layer dependency that should be addressed only by first extracting truly generic relation primitives into a lower, upstream-independent relation layer; it must not be “fixed” by moving semantic contracts back into compiler/scanner ownership.
