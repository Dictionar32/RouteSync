# Phase 1614 — Interface-first AST closure contract

## Scope

This phase changes the existing AST semantic interface contract and its contract tests only. It does not change scanner wiring, route projection wiring, RequestType wiring, or relocate the AST closure implementation into another file.

## Contract changes

- Replaced positional `close(seed, rules, maxRounds)` arguments with the named `AstSemanticClosureRequest` contract.
- Replaced the ambiguous `converged: boolean` result with a discriminated `AstSemanticClosure` outcome:
  - `status: 'closed'` carries a fixed-point certificate.
  - `status: 'incomplete'` distinguishes invalid limits from limits reached before closure.
- Specified closure laws at the interface boundary: derivation premises must have been available, conclusions must come from the named rule, duplicate facts are canonicalized, and exhausting the bound cannot be reported as closed.
- Defined `roundLimit` as a positive safe integer and aligned iteration accounting so the limit is not silently exceeded.
- Added tests for successful closure, no derivation from unmatched rules, invalid limits, and a rule chain that remains incomplete after one round.

## Verification status

The source and test edits were inspected. Full TypeScript/Vitest execution has not yet been verified in this workspace because project dependencies are not installed. No claim is made that downstream wiring is migrated or that all upstream interfaces are complete.
