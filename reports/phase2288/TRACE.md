# Phase 2288 trace — Laravel contextual attribute resolution

## Observed failure

The v6 contract required `qualifiedIdentity` and `implementation` proof, but the production wiring still returned v5 and inferred inventory declarations by filtering `attribute.definition.contextual`. `attributeAstCanonical.ts` used `/implements[^\{]*\bContextualAttribute\b/`, which does not account for PHP namespace/import aliases.

## Cutover

- Existing upstream contract advanced to v7.
- Existing `PhpClassNameResolutionRuleInterface` is used with the declaration's lexical namespace/import context.
- The canonical contract identity is checked after resolution, not by short spelling.
- The attribute producer returns the exact closed `LaravelAttributeScanJudgment`.
- The source-AST projection has an explicit blocked outcome retaining the scan judgment and invocation receipt.
- The manifest builder handles the new blocked outcome without pretending it is a source-AST completeness failure.

## Remaining limitations

- The project's local token parser is not a complete PHP grammar implementation; grouped imports and unusual declaration forms require fixture-level verification.
- No TypeScript typecheck or package build was run. `npm run build` remains intentionally excluded by the user's environment constraint.
