# RouteSync Scanner Runtime Trace — Phase 1418

## Ownership rule

Move reusable decision/control algorithms into `packages/core/src/types/upstream/*Algebra.ts` or `*Contract.ts`; keep source-language observations, grammar catalogues, and AST construction as injected scanner capabilities. Semantic domain conclusions must be represented in upstream semantic types/relations, not reconstructed by a downstream consumer.

## Current path and migration frontier

| Scanner area | Current responsibility | Recommended ownership boundary | Priority |
|---|---|---|---|
| `lexer/astClassifierRuntime.ts` — statement traversal | Cursor movement, boundary selection, statement accumulation | `scannerStatementSequenceAlgebra` and `scannerStatementBoundaryAlgebra`; make non-progress an explicit contract-violation ADT rather than returning a partial prefix | P0 |
| `lexer/astClassifierRuntime.ts` — assignment parts | Operator candidate order, target validity, `&` reference handling, assignment-part assembly | `scannerAssignmentPartsAlgebra`; PHP operator spellings and target/expression resolvers injected by runtime | **Implemented in 1418** |
| `lexer/astClassifierRuntime.ts` — assignment target/destructuring | Distinguishes variable/property/index/append/static-property/list destructuring and recursively handles keyed/nested entries | Generic target-resolution protocol in upstream; PHP-specific target rule provider for target variants; preserve `PhpAstFactory` at AST edge | P1 |
| `lexer/astClassifierRuntime.ts` — top-level token scanning | `findTopLevelOperator`, `splitTopLevel`, matching delimiter/brace scans | Shared token-structure algebra with depth state and explicit `found` / `not_found` / `malformed` outcomes | P1 |
| `lexer/astClassifierRuntime.ts` — expression parser | Rule catalogue order, compound operators, ternary/binary/unary decisions and fallback | Expression candidate/precedence/associativity algebra; PHP grammar and operator catalogues injected as capabilities; no silent `unsupported` fallback where an explicit unresolved judgment is required | P1 |
| `lexer/astClassifierRuntime.ts` — statement/AST rule catalogues | Rule applicability and first-match resolution | Keep rules as PHP evidence providers; move priority, applicability proof, candidate ranking, and exhaustive/no-match result into algebra | P1 |
| `subscanners/queryEvidenceProducer.ts` | Large mixed layer: expression traversal, query method-name catalogue, argument extraction, relation-path construction, grouping, aggregates, joins, operation projection and nested-query handling | Split traversal/list/argument algorithms from Laravel/Eloquent query semantics. Generic sequence/argument algebra should emit a typed witness; Eloquent method/operator catalogues remain the domain provider; output is a closed query semantic contract | P2 |
| `descriptors/validation/validationRuleEntry.ts` | Maps Laravel validation rule shapes to semantic type, presence and field shape | Generic rule-evidence folding/constraint aggregation in contract; Laravel validation rule meaning in a rule catalogue; unknown rule should remain explicit evidence, not silently guessed | P2 |
| `lexer/controllerDataflowAnalyzer.ts` | Controller variable canonicalization, source spans, value-to-semantic candidate resolution and dataflow projection | Reuse canonical identity/definition-use/dataflow relations from upstream; controller-specific source facts remain evidence. Avoid a second local semantic classifier if the relation already resolves it | P2 |
| `descriptors/request/controllerExpressionAlgebra.ts` + `controllerExpressionContract.ts` | Existing algebra/contract split for controller expression interpretation | Use as pattern only after checking ownership: confirm contract owns decision/result closure and runtime does not reclassify its result | P2 |
| `descriptors/route/routeGroupSemanticResolver.ts` and `upstream/route/routeGroupSemanticResolver.ts` | Route group interpretation across descriptor/upstream surfaces | Trace duplicate responsibility and establish one upstream route-group judgment contract, with adapters/wiring only; do not leave two independent classifiers | P2 |
| `StaticLaravelScanner.ts` | Scanner orchestration / source collection entry point | Keep orchestration only: acquire facts, invoke producer contracts, assemble complete source model. No semantic inference fallback or consumer-specific reconstruction | P3 |

## Phase 1418 change

`astClassifierRuntime.parseAssignmentParts` now supplies the PHP operator vocabulary and callbacks to `scannerAssignmentPartsAlgebra.resolve`. The upstream algebra owns candidate selection, range/target validation, reference marker handling, and typed result assembly. `classifyAssignmentExpression` / `classifyAssignment` continue to construct their respective PHP AST variants from the resolved parts.

## Acceptance criteria for later phases

1. Every migrated function has one declared semantic/control owner and explicit consumers.
2. Runtime callbacks report evidence/capabilities; they do not duplicate generic candidate selection or result assembly.
3. Missing, ambiguous, malformed, and unsupported cases are distinct closed outcomes where downstream behavior differs.
4. AST syntax structure and value/dataflow meaning remain distinct representations.
5. Audit checks verify wiring and ownership; fixture tests verify behavior; typecheck/build verifies integration. Structural audit alone is not a build pass.
