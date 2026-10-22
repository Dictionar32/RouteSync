# Phase 2289 — Contextuality Judgment Closure

## Purpose

The Laravel attribute scanner contract must distinguish a source-proven contextual attribute from a fully resolved non-contextual declaration. A boolean `contextual?: boolean` is not a sufficient producer input: it loses the evidence and allows incomplete name resolution to be projected as `false`.

## Upstream contract evolution

`laravelAttributeScannerInterface.ts` now owns `LaravelAttributeContextualityJudgment`:

- `LaravelContextualAttributeDeclarationEvidence` is the positive, source-proven contextual variant.
- `LaravelAttributeNonContextualDeclarationJudgment` is a closed negative variant that retains the qualified class identity, declaration span, and resolved interface evidence.
- `LaravelAttributeResolvedInterfaceEvidence` records each resolved implemented interface with source provenance.

The producer no longer accepts an optional contextual boolean. It accepts the closed judgment and projects its discriminant into the existing `AttributeDefinition.contextual` field. The semantic decision remains upstream evidence, not a guess based on absence of a match.

## Blocked-path correction

The per-file scanner now returns a blocked judgment before parsing/projecting the attribute AST whenever a class identity or implemented-interface name cannot be resolved. The source-project scan only publishes attributes and contextual inventory when every file scan is complete. This prevents unresolved names from being silently treated as a non-contextual attribute.

## Trace

`CLI scan -> laravelSourceAstPipeline -> LaravelAttributeScannerInterface.scan -> scanAttributeAsts -> phpClassNameResolutionAuthority -> LaravelAttributeContextualityJudgment -> attributeProducer -> complete/blocked scan judgment -> controller scanner`

The controller scanner still receives only `LaravelContextualAttributeInventory`, which can be published only from the complete scan outcome.

## Known debt kept explicit

`attributeProducer.ts` still imports `semantic/relations` for unrelated AST construction operations. Phase 2289 does not claim that the transitive relations dependency has been removed. The prior Phase 2288 audit checked only `attributeAstCanonical.ts` while labeling that check as if it covered the producer; Phase 2289's audit checks both files and reports the remaining dependency honestly. No `semantic/foundation` dependency was added.

## Verification limits

The focused audit and JavaScript syntax check are runnable in this package snapshot. TypeScript typecheck/build and PHP fixture execution were not run; no successful build is claimed.
