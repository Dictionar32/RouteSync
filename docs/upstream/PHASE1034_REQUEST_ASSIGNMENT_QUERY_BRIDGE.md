# Phase 1034 — Request → Assignment → Query Bridge

## Decision

Keep `DataFlowInterface` execution-only. The new work is a seed projection, not a solver change.

## Bridge

For request accesses discovered inside controller variable definitions:

`request raw/validated field -> request-access identity -> canonical root:<variable> identity`

The scanner already interns assignment targets as `variable` identities with `root:<name>` slots. This projection therefore meets the existing assignment/value-flow evidence instead of inventing an AST-level flow node.

Direct request expressions used by controller query inputs also bridge to the exact canonical query invocation identity already emitted by `semanticDataflowControllerQueryProjection`.

## Request operations

`all`, `input`, `get`, `query`, `string`, `integer`, `boolean`, `filled`, and `only` remain raw request access. `safe` and `validated` are validated access.

## Boundaries

- AST / Assignment / Expression: scanner evidence and semantic identities only.
- Request projection: canonical seed facts only.
- Manifest: aggregates seeds only.
- Dataflow: single closure authority.
- Graph: structural projection.
- IR: consumes the closed judgment.

This follows the upstream pattern used by CodeQL, where AST nodes and data-flow nodes are related but distinct and source/sink/additional-flow-step configuration is separate from the generic solver, and by MLIR, where the solver owns fixed-point orchestration while analyses provide transfer/dependency semantics.
