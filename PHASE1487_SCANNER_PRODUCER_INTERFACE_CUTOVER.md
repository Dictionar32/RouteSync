# Phase 1487 — Scanner producer semantic authority cutover

## Why this phase exists

The scanner still contains a large amount of local `const`/function code. A declaration count is an inventory signal, not proof that every helper is semantic reasoning: parser mechanics, token traversal, adapters, and AST construction must remain in the scanner where appropriate. The migration target is semantic classification and vocabulary that downstream code should not re-derive.

## Inventory snapshot

`PHASE1487_SCANNER_RUNTIME_PRODUCER_INVENTORY.json` records the non-test scanner inventory using declaration lines, excluding test/spec files. It currently identifies 220 files and 4,749 declarations. Largest files include:

- `subscanners/queryEvidenceProducer.ts` — 304 declarations after this cutover
- `lexer/astClassifierRuntime.ts` — 208
- `subscanners/controller/controllerAstCanonical.ts` — 138
- `lexer/routeAst/semanticRouteSyntaxRelations.ts` — 104
- `lexer/routeAst/relationalSyntaxCursor.ts` — 99
- `subscanners/ResourceScanner.ts` — 97
- `lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts` — 97

These counts are a triage index. Do not blindly move all functions: source acquisition and syntax mechanics belong to scanner execution; semantic vocabulary, precedence, and interpretation rules belong in upstream contracts/algebras.

## Source changes

- Added `queryProducerSemanticInterface.ts` as the typed upstream contract for query-producer semantic judgments.
- Added `queryProducerSemanticAlgebra.ts` as the authority for Laravel relation-aggregate vocabulary, query-join method descriptors, join interpretation, and ordering direction.
- `resolveRelationAggregateFunction` and `resolveQueryJoin` return closed `resolved | not_applicable` judgments. `toOption` is the explicit compatibility projection at the scanner wiring boundary.
- `queryEvidenceProducer.ts` no longer owns the aggregate catalog, join catalog, join descriptor construction, join semantic resolution, or ordering-direction classification. It delegates those decisions to the upstream algebra and keeps producer-specific composition/projection.
- Added regression tests for recognized aggregate vocabulary, unknown vocabulary, unknown join methods, and judgment-to-option projection.
- Exported the new contract and algebra from `types/upstream/index.ts`.

## Intended authority flow

Laravel/PHP expression evidence → typed `Expression`/method-name input → `QueryProducerSemanticInterface` → closed semantic judgment → scanner wiring compatibility projection → `QueryAst` / `QueryOperationAst`.

The scanner remains responsible for collecting expressions and assembling producer outputs. It must not own the canonical meaning of relation-aggregate names, join method descriptors, join target/constraint shape, or ordering direction.

## Validation

- TypeScript `transpileModule` syntax validation: passed for the changed interface, algebra, producer, test, and export barrel using installed global TypeScript 5.8.3.
- Static inventory regenerated after the cutover.
- Vitest, package typecheck, and build were not run: dependencies are not installed in this extracted workspace, and the global TypeScript version does not match the repository's configured compiler.

## Next migration frontier

1. `astClassifierRuntime.ts`: move any remaining precedence/applicability/semantic selection rules into upstream judgment algebras; keep token traversal and AST construction as executor work.
2. `controllerAstCanonical.ts` and `serviceAstCanonical.ts`: trace whether these are canonical AST constructors or still hold source interpretation policy. Move only the latter into upstream contracts.
3. `semanticRouteSyntaxRelations.ts` / `relationalSyntaxCursor.ts`: distinguish evidence scanning and cursor mechanics from syntax-meaning relations, then make the latter the sole authority.
4. `queryEvidenceProducer.ts` still has many declarations. Continue with one semantic family at a time, not a bulk move: query operation catalog, projection/grouping rules, where-condition interpretation, then model-static operation inference. Add a closed judgment and consumer regression for each cutover.
5. Verify AST, query AST, semantic graph, IR, and generated route consumers before reducing runtime code further.
