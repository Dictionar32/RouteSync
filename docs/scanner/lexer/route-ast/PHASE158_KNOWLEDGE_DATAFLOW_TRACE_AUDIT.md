# Phase 158 — Knowledge/Data-Flow Trace Audit

## Principle

RouteSync treats typed knowledge/data-flow as the semantic source of truth. Tree-sitter/PHP syntax is evidence; parser control flow is an interpreter/producer. Maps are derived indexes only.

## Trace

Laravel/PHP source → PHP syntax AST → typed control-flow knowledge → ControllerDataflowAst.knowledgeFlow → semantic consumers.

## Elevated datum

- comparisons: equal, not_equal, identical, not_identical, greater_than, less_than, greater_or_equal, less_or_equal
- condition
- branch
- iteration
- selection/case
- fall-through as typed knowledge (`continues` / `terminates`)
- knowledge graph nodes and relations

## Producer

`controlFlowKnowledgeProducer.ts` produces knowledge from `PhpStatement` using the exhaustive `matchPhpStatement` algebra. `ControllerDataflowAst` now carries the produced graph so consumers do not need to rediscover control-flow semantics from statement kinds.

## PHP/Tree-sitter evidence

Tree-sitter documents named fields as syntax-tree analysis facilities; they are not the semantic model. PHP documents `if`, `while`, `switch`, and comparison operators as language semantics. Therefore RouteSync keeps those semantics as typed knowledge above the syntax substrate.

## Laravel evidence

Laravel routing exposes route groups, middleware, `where` constraints, prefixes/names, and route model binding as domain semantics. These should continue to be represented as typed route knowledge/data-flow, not inferred by downstream control flow.

## Remaining elevation

1. `KnowledgeSource.filePath` is currently supplied by the producer as a placeholder because the current controller statement AST contains offsets but not the originating path. The next producer boundary must receive the real source path from the project scanner.
2. `knowledgeDataModel.ts` still contains generic type parameters, but defaults no longer use `unknown`; semantic uses should be specialized at call sites.
3. The existing controller analyzer still contains imperative traversal mechanics. It may remain as an interpreter, but its semantic branch/loop meaning should progressively consume `knowledgeFlow` rather than reclassify statement kinds.
4. `for` clauses need a richer typed iteration model so empty initializer/condition/update are represented as ADT presence rather than dropped.
5. `try/catch/finally`, `return`, `throw`, `break`, `continue`, `match`, ternary, null-coalesce, and nullsafe semantics should join the same knowledge/data-flow vocabulary.

## Verification

- Phase 157 archive restored to `/mnt/data/RouteSync`.
- TypeScript transpilation of the new producer succeeds.
- Full `tsc` remains blocked by the existing missing `@types/node` environment dependency (`TS2688`); this is not claimed as a clean compile.
