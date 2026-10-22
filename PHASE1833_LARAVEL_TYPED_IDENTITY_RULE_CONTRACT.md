# Phase 1833 — Laravel Typed Identity Rule Contract

## Objective

Continue interface-first work by strengthening the existing upstream identity contract rather than adding another authority interface. The prior phase changed identity results from primitive `boolean` predicates to typed relation judgments, but its rule definitions were still string labels.

## Changes

- `sourceProjectIdentity.ts` now declares `SourceProjectIdentityRule` and `SourceFileIdentityRule` as closed typed rule data.
- The canonical identity contract advances to version 3 and names the project identity components and canonical source-file value rule.
- The canonical identity semantics implementation dispatches on the rule discriminants and returns typed relation judgments. The field-by-field comparison mapping is still explicit runtime code; the tuple in the contract documents the intended components but is not itself interpreted as a generic rule program.
- The inventory contract advances to version 7 and explicitly names the canonical upstream typed identity rule contract as its single rule source.
- Public exports expose the existing identity contract and rule types; no duplicate authority interface was introduced.
- Invocation semantic judgment remains a correlated value containing `sourceFile` and `PhpSourceInvocationSemanticPipelineIntegrationResult`.
- The scanner boundary continues to consume the closure receipt.

## Trace finding that remains open

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow()`. The production path has not yet migrated to the inventory authority receipt. The legacy subscanner cannot be retired until all production consumers are migrated and a repository-wide audit shows no remaining consumers.

## Runtime caveat

Typed interfaces and discriminated unions describe compile-time contracts; they do not execute validation themselves. The identity authority still compares runtime identity components to produce the typed judgment. This phase makes the rule definition explicit and canonical; it does not claim that all runtime comparisons or semantic decisions have disappeared.

## Verification

- `npm run audit:phase1833-laravel-typed-identity-rule-contract`: static audit only.
- No build, typecheck, or E2E run was performed.
