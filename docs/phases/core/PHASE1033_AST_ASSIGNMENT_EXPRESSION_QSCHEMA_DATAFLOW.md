# Phase 1033 — AST / Assignment / Expression / QuerySchema Dataflow Frontier

## Decision

`DataFlowInterface` remains execution-only: `seed`, `derive`, `close`, `reaches`.

AST, Assignment, Expression, and QueryAst are upstream evidence/semantic projections.
They are not inserted into `DataFlowInterface` and do not own fixed-point closure.

## Request flow

Controller expression request operations are projected into canonical request lineage:

- `input`, `get`, `query`, `string`, `integer`, `boolean`, `filled`, `only` -> raw request field flow.
- `safe`, `validated` -> validated request field flow.
- field-less access -> all declared validated FormRequest fields when the evidence cannot narrow the field.

The projection is fact-scoped and downstream policy decides source/sink semantics.

## AST / Assignment / Expression

`AstNodeKind` continues to distinguish `expression_ast`, `request_ast`, `controller_ast`, etc.
`AssignmentAst` and `Expression.assignment_expression` remain canonical semantic evidence.
Scanner semantic knowledge already produces assignment/value-flow relations; Phase 1033 adds the missing request-operation projection from canonical `Expression` values rather than reconstructing PHP syntax.

## Query / qschema

`QueryAst` remains the query semantic boundary, including model identity, operations, nested queries, and correlation. Query facts continue to be projected into controller query dataflow; schema/FK evidence remains structural and is not automatically converted into value flow.

## Downstream boundaries

- manifest: seed aggregation only
- dataflow: single canonical closure authority
- graph: structural projection only
- IR: consumes closed `SemanticDataflowJudgment`
- state policy: source/sink/barrier/additional-step classification downstream of closure
