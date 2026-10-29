# Phase 159 — Typed Knowledge/Data-Flow Elevation

## Principle

RouteSync treats typed knowledge/data as the source of truth. PHP/Tree-sitter syntax is evidence; parser branching is construction mechanics; semantic consumers must consume typed knowledge rather than rediscovering meaning from statement kinds.

## Changes

- `ConditionKnowledge` is now a closed ADT:
  - `comparison_condition`
  - `expression_condition`
- comparison absence is represented by `KnowledgePresence`, not `undefined`.
- `===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=` are preserved as typed `ComparisonOperator` data.
- `BranchKnowledge.whenFalse` is `KnowledgePresence<KnowledgeDatum<Block>>`; no synthetic empty block is created when an `else` is absent.
- branch outcomes are block data, not the condition expression copied into both branches.
- `while`, `foreach`, and `for` carry body/repeat/terminate data as typed knowledge.
- `switch` carries case labels, case bodies, fall-through state, and a typed optional default outcome.
- `Map` remains an optional derived index; typed fact arrays/graphs remain the source of truth.

## External semantics checked

Tree-sitter fields describe syntax-node relationships and are not the RouteSync semantic model.
PHP documents `if`, loops, `switch`, and comparison operators as language semantics. In particular, `===`/`!==` preserve type-sensitive comparison semantics, while `switch` has its own case comparison/fall-through behavior.
Laravel routing documents route attributes, constraints, middleware order, and nested-group merge behavior as domain semantics. Those should likewise be represented as facts/relations rather than inferred from consumer control flow.

## Remaining boundary

`KnowledgeSource.filePath` is still `<php-source>` because the current controller-body parser does not carry a canonical project file path into `analyzeControllerDataflow`. The path must be elevated from scanner entry-point provenance rather than invented at this layer.

The full narrow TypeScript compile remains blocked by the checkpoint's missing Node type definitions (`TS2688`). Changed knowledge files pass TypeScript transpilation/syntax validation.

## Next elevation targets

Continue the same model for `match`, `try/catch/finally`, `return`, `throw`, `break`, `continue`, ternary, short ternary, null-coalesce, and nullsafe semantics. Do not add consumer-side reclassification branches as a substitute for these facts.
