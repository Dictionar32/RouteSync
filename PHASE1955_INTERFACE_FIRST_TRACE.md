# Phase 1955 Interface-First Trace

```text
Source Inventory + Invocation Judgment Evidence
                    |
                    v
LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface
       | project binding judgment
       | completeness witness judgment
       | source identity uniqueness judgment
       | judgment correspondence judgment
                    |
                    v
Existing Inventory Authority.close()
                    |
            +-------+-------+
            v               v
 Receipt-bearing validated   Non-empty rejected ledger
                    |
                    v
Laravel Scanner / AST / CLI Manifest Composition
```

## Before

`close()` directly derived `witnessComplete`, `duplicateSources`, `missingJudgments`, `multipleJudgments`, and `orphanJudgments`, then mapped them into rejections. The interface exposed rules but not the semantic judgments produced by applying each rule.

## After

The existing authority exposes a typed reasoning interface. Its four operations return discriminated semantic judgments. `close()` composes the rejection collections and preserves the existing validated/rejected result ADT. No second inventory authority is introduced.

## Semantic boundaries

- Project-binding mismatch remains distinct from witness-shape failure.
- Source identity uses the existing canonical typed identity relation judgments.
- Correspondence retains separate missing, multiply-judged, and orphan source findings.
- The validated receipt preserves the original invocation judgment references and integrated-outcome preservation contract.
- The scanner/CLI remain consumers of the closure result, not additional inventory authorities.

## Official design references

- TypeScript interfaces define structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions model distinct judgment outcomes: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel distinguishes controller actions from the HTTP response returned to the client: https://laravel.com/framework/docs/13.x/responses
