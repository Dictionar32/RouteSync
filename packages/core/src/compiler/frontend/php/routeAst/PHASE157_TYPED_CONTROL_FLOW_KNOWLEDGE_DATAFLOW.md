# Phase 157 — Typed Control-Flow Knowledge/Data-Flow Model

## Source of truth

The semantic source of truth is typed knowledge/data, not `Map` lookup and not consumer control-flow classification.

```text
Laravel/PHP source
  -> syntax evidence
  -> typed PHP statement AST
  -> typed control-flow knowledge
  -> knowledge data-flow graph
  -> semantic consumer
```

Tree-sitter/PHP syntax is an evidence substrate. It is not the RouteSync semantic model.

## Elevated constructs

- comparison operators: `==`, `!=`, `===`, `!==`, `>`, `<`, `>=`, `<=`
- condition
- branch / `if`
- iteration / `while`
- selection / `switch`
- switch case, default, and fall-through
- source provenance

The model deliberately retains source semantics as datum. Consumers must not rediscover the meaning by inspecting syntax kinds and branching over them.

## Typed model

`knowledgeFlowModel.ts` now contains:

- `KnowledgeDatum`
- `KnowledgeSource`
- `ComparisonKnowledge`
- `ConditionKnowledge`
- `BranchKnowledge`
- `IterationKnowledge`
- `SelectionCase`
- `SelectionKnowledge`
- `ControlFlowKnowledge`
- `KnowledgeFlowNode`
- `KnowledgeFlowEdge`
- `KnowledgeFlowGraph`

The previous `unknown`-based generic knowledge values were removed from this source-of-truth model.

## PHP AST elevation

`PhpStatement` now explicitly represents:

- `while_statement`
- `switch_statement`

with typed `PhpSwitchCase` data for case/default, labels, body, fall-through, and source provenance.

`astClassifier` produces these statements from source instead of dropping them into generic expression statements.

## Important boundary

`if`, `while`, and `switch` may still appear as syntax names in the parser because they are PHP language constructs. That does **not** make them the semantic source of truth. The semantic layer must consume typed knowledge produced from them.

Runtime loops and `switch` dispatch are interpreters of the data-flow model; they are not the storage format for the knowledge.

## Verification limitation

This checkpoint should not be described as a clean full TypeScript build until the repository's existing dependency/type-definition blockers are resolved. In particular, the Phase 156 environment has missing Node/Vitest type definitions. Structural source inspection is therefore part of this checkpoint verification.
