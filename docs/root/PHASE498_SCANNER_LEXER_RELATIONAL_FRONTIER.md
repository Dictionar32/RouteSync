# Phase 498 — Scanner/Lexer Relational Frontier

## Objective

Continue the scanner/lexer and resolver eradication boundary using a higher semantic model: declarative relations, candidate requirements, relation options, recursive closure, fixed-point/rewrite-oriented execution, and no imperative parser authority for the closed frontier.

## Research synthesis

The design is informed by several families of systems:

- Tree-sitter: incremental concrete syntax parsing remains useful as lexical/syntactic evidence, but it is not the semantic authority.
- CodeQL: semantic data-flow is represented separately from AST structure, reinforcing the separation between syntax evidence and semantic relations.
- Souffle/Flix/Datafrog-style Datalog: relations, indexed joins, and fixed-point closure are the natural representation for recursive semantic facts.
- Statix/Scope Graphs: name resolution can be expressed as scope/declaration/reachability constraints rather than imperative resolver dispatch.
- MLIR/PDLL: matching and rewriting can be declared as patterns and applied by a rewrite driver until a fixed point.
- egglog: equality saturation plus Datalog provides a useful model for confluent candidate/rewrite closure.

## Phase 498 change

`packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts` was moved further behind the relational absence boundary:

- explicit `undefined` parser absence was replaced by `RELATION_NONE` / `RelationMaybe`.
- parser absence is now a relation witness rather than a JavaScript absence sentinel.
- structured statement parsers use relational presence/absence predicates.
- switch-case and try/catch parser results participate in the same relation option boundary.
- the AST classifier is now part of the closed scanner/lexer authority surface.

This is intentionally semantic rather than textual: no `void 0`, sentinel null, or equivalent lexical dodge is introduced.

## Remaining frontier

The next highest scanner/resolver surfaces remain:

1. `subscanners/providerAstCanonical.ts`
2. `subscanners/migrationProducer.ts`
3. `subscanners/serviceAstCanonical.ts`
4. `subscanners/controller/controllerDataflowContract.ts`
5. `subscanners/serviceSourceStatements.ts`
6. `subscanners/form-request/canonicalValidationRuleEntry.ts`
7. `subscanners/form-request/validationFieldAssembler.ts`
8. `subscanners/resource/resourceFieldProducer.ts`
9. `subscanners/resource/resourceUpstreamExpressionCanonical.ts`
10. `descriptors/request/controllerExpressionContract.ts`

These should be migrated by semantic category, not by blind token replacement:

`source evidence -> relation facts -> candidate requirements -> closure -> canonical semantic value -> rewrite`

## Validation

`npm run audit:scanner-lexer:phase498`

The full repository typecheck/test remains environment-dependent because the checkpoint does not contain the full installed dependency tree. The phase audit is therefore the authoritative structural check for this cutover.
