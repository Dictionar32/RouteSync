# Phase 1820 — Laravel Invocation Source-Bound Delivery

## Decision

Retire the source-result index/`lookup(SourceFile)` interface from the active invocation pipeline. The CLI already analyzes the exact controller source documents before manifest construction, so it now delivers the closed pipeline results directly as `PhpSourceInvocationSemanticPipelineDeliveryBatch` entries. Each result retains its own `document.sourceFile` provenance.

## Changed boundaries

- Added `phpSourceInvocationSemanticPipelineDeliveryInterface.ts` as the upstream delivery contract.
- Updated manifest builder, Laravel AST scanner/pipeline, orchestrator, and `ControllerScanner` to accept the direct delivery batch.
- `ControllerScanner` iterates delivered source-bound results and does not reconstruct a source-to-result association by lookup.
- When no delivery batch is supplied, scanner keeps its explicit `not_connected` evidence path.
- Integrated response contract version advanced to 7 and no longer treats index ambiguity as an integration outcome. Integration projects complete/blocked pipeline judgments and source-binding rejection without reconstructing semantic meaning.
- Retired `phpSourceInvocationSemanticPipelineResultIndex.ts` by emptying the file and removing active public exports, rather than deleting the file.
- Updated cumulative static audits for the new contract.

## Static verification

The Phase 1820 audit checks direct delivery, provenance retention, no scanner-side lookup, explicit not-connected behavior, integrated response alignment, and retirement of the old index module. These are source-level checks only. No build, TypeScript typecheck, or end-to-end test was run in this environment.

## External references

- TypeScript Handbook — Discriminated Unions: https://www.typescriptlang.org/docs/handbook/2/narrowing
- PHP-Parser — Lexer and Source Positions: https://github.com/nikic/PHP-Parser/blob/master/doc/component/Lexer.markdown

These references support explicit union modeling and source provenance; they do not substitute for verification of RouteSync's internal contracts.
