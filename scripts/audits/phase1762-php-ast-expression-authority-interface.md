# Phase 1762 — PHP AST Expression Authority Interface First

## Trace finding

`Expression` is already the canonical closed semantic ADT. `PhpAstValue` belongs to the scanner lexer, while `mapResourcePhpAstToUpstream` in `subscanners/resource/resourceUpstreamExpressionCanonical.ts` currently performs the PHP-AST-to-`Expression` transformation and is imported directly by multiple scanner producers.

The upstream interface must not import `PhpAstValue` or depend on `compiler/scanner`. This phase therefore defines a generic evidence boundary in `types/upstream` and names the returned `Expression` ADT as the semantic judgment, avoiding a duplicate result wrapper or another status discriminator.

## Changes

- Added `phpAstExpressionSemanticAuthorityInterface.ts` under `types/upstream`.
- The contract receives generic source evidence, a domain `SourceFile`, and an explicit `Option<PhpTypeClassContext>`.
- The contract returns the existing closed `Expression` ADT; `unsupported_expression` remains an explicit member of that ADT.
- Added a transitional implementation adapter at the existing mapper owner.
- Routed the shared `expressionFromPhpAst` producer through the authority interface.
- Added an executable audit for contract ownership and the shared producer boundary.

## Deliberate remaining work

This phase does **not** claim that the resource subscanner has been retired. Other scanner modules still call `mapResourcePhpAstToUpstream` directly. The audit reports their count so subsequent phases can migrate each consumer to the authority boundary and then remove the subscanner only when no references remain.

## Validation

Run:

```sh
node scripts/audits/phase1762-php-ast-expression-authority-interface.mjs
```

Typecheck, Vitest, and full build were not run for this phase.
