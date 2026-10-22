# Phase 2028 — Expression Structure Judgment Preservation (Interface First)

## Trace

`scannerExpressionStructure` already closes candidate resolution into a discriminated judgment: `structured`, `not_structured`, `malformed_source`, or `contract_violation`. The AST runtime previously collapsed `not_structured` into `RelationOption.none`, but converted malformed and contract-violation judgments directly into generic `Error` throws. That discarded the typed judgment and its rule identity, source location, expected/actual evidence, and attempt history at the AST classifier boundary.

## Change

The existing AST rule algebra is now the consumer boundary for compound expressions. The compound candidate returns `AstRuleResolution` directly:

- `not_structured` → `not_resolved`;
- `malformed_source` → typed `malformed` with the exact upstream judgment retained;
- `contract_violation` → typed `rule_contract_violation` with the exact upstream judgment retained;
- `structured` → AST projection after the upstream structure judgment is closed.

No new relation/foundation subscanner was introduced. The existing `RelationOption` adapter remains for other legacy parser helpers; this phase does not claim that the entire AST runtime is relation-free.

## Scope boundary

This change preserves compound-expression structural judgments through the AST rule algebra. The public `classifyAstTokens` API still projects a successful AST value and surfaces malformed/contract failures through `AstClassificationFailureError`, whose `judgment` property preserves the full closed AST classification judgment. It does not change the Laravel invocation or response ADTs; audit checks confirm their forwarding path remains present.

## Verification

Run `npm run audit:phase2028-expression-structure-judgment-preservation-interface-first`. This audit is source-contract verification, not a substitute for a TypeScript build or runtime integration tests.
