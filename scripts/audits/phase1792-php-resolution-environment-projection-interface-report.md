# Phase 1792 — PHP Resolution Environment Projection Interface-First

## Scope

Continue from Phase 1791 by evolving the existing PHP name-resolution contract and adding the missing projection authority from a validated whole-file source inventory to the lexical environment required by `PhpFunctionNameResolutionInput`.

## Trace finding

The source inventory authority could certify a complete inventory, but the complete result discarded the whole-file `SourceSpan`. That prevented a later stage from binding each invocation span to the exact source file extent before selecting a namespace region. The name-resolution input also required a completed `PhpFunctionResolutionEnvironmentJudgment`, while no typed contract projected a validated inventory region into that judgment.

The Laravel scanner is still method-body-oriented and does not yet produce whole-file namespace/import/declaration inventory. Therefore the pending invocation integration state remains truthful and must not be removed.

## Changes

- Extended the complete `PhpFunctionResolutionSourceInventory` variant to retain the certified whole-file `source` span.
- Versioned `PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT` from version 2 to version 3 and added an explicit obligation to retain the whole-file span for downstream source binding.
- Added `PhpFunctionResolutionEnvironmentProjectionContract`, `PhpFunctionResolutionEnvironmentProjectionInput`, `PhpFunctionResolutionEnvironmentProjectionFailure`, `PhpFunctionResolutionEnvironmentProjectionResult`, and `PhpFunctionResolutionEnvironmentProjectionInterface` to the existing `phpFunctionNameResolutionInterface.ts` contract module.
- Added `phpFunctionResolutionEnvironmentProjectionAuthority.ts`. It accepts only a complete inventory, binds the invocation span to the same file and certified whole-file span, requires a non-empty span, and selects exactly one owning namespace region. It reuses the region's existing imports, declarations, and completeness witness rather than rebuilding or reclassifying them.
- The projection result distinguishes complete and incomplete outcomes and retains typed reasons for incomplete projection.
- Exported the projection authority from the upstream index.
- Left `PhpFunctionNameResolutionAuthorityInterface`, invocation semantic judgment, batch closure, and the existing integrated-response slot in place. No new response layer was created.
- Expanded the pending integration contract to explicitly name the missing inventory-to-projection, projection-to-name-resolution-input, and projection-to-invocation-batch connections. Kept pending state explicit because real whole-file parser evidence has not yet been connected.
- Added `audit-phase1792-php-resolution-environment-projection-interface-first.cjs`.

## Validation

- Phase 1788 static audit: 13/13.
- Phase 1789 static audit: 11/11.
- Phase 1790 static audit: 13/13.
- Phase 1791 static audit: 20/20.
- Phase 1792 static audit: 22/22.
- Total static checks across these audits: 79/79.
- ZIP integrity is checked when packaging.
- TypeScript build/typecheck was not run in this environment.

## Remaining work

1. Define or evolve the existing parser evidence contract so the whole-file parser emits namespace-region boundaries, namespace-prefix imports, function imports, and named-function declarations.
2. Wire the actual parser evidence to `PhpFunctionResolutionSourceInventoryInput` and the inventory authority.
3. Use this projection authority to build `PhpFunctionNameResolutionInput` for each invocation occurrence.
4. Derive `PhpFunctionInvocationSemanticJudgment` and close a total batch with the existing batch closure authority.
5. Feed the validated batch to the existing `phpFunctionInvocations` integrated-response slot.
6. Only after every consumer is migrated, audit and remove obsolete subscanner paths.

## Official references

- PHP namespace definitions: https://www.php.net/language.namespaces.definition.php
- PHP namespace imports and aliases: https://www.php.net/language.namespaces.importing.php
- nikic/PHP-Parser NameResolver documentation: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
