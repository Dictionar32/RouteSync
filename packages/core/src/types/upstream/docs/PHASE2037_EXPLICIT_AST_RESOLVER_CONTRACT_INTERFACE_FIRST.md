# Phase 2037 — Explicit AST Resolver Contract, Interface First

## Trace finding

The ordered AST rule algebra already accepted a closed `AstRuleResolution`, but `expressionRule` exposed four positional callback slots (`resolve`, `derive`, `resolveJudgment`). That made the semantic difference between a complete judgment and a legacy relation-shaped result implicit in argument position.

## Change

`AstClassificationResolverContract` now models resolver mode as a discriminated union:

- `judgment`: the canonical resolver returns `AstRuleResolution<Output, Failure>` directly.
- `legacy_adapter`: a compatibility-only resolver produces the legacy result shape, which is normalized at the adapter boundary.

The runtime now receives one resolver contract. Assignment, match, cast, and compound-expression rules use the canonical judgment variant. Other legacy rules are marked explicitly as adapters. The existing `AstClassificationRuleAlgebraInterface` remains the sole ordered-selection authority; no second classifier or subscanner is introduced.

## Scope and limitation

This phase removes positional resolver ambiguity, not all legacy relation-shaped parsing. The remaining `legacy_adapter` entries are migration debt and should be retired by migrating each source parser to a closed judgment, without creating a duplicate semantic authority. Laravel invocation and integrated-response ownership were checked for preservation. No build or full TypeScript type-check was run.
