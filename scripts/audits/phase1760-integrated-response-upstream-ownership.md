# Phase 1760 — Integrated Response Upstream Ownership

## Trace finding

Phase 1759 closed the composition result's response/projection pairing with overload-assisted projection typing. The overloads were compensating for a redundant API layer: analysis was already owned by the publication receipt, but the public composition added a second projection object to expose it.

## Interface-first correction

- Removed `InvocationSemanticIntegratedResponseAnalysisProjection` and its projection interface/constant from the public upstream contract.
- Removed the overloaded `projectIntegratedResponse` helper and its duplicated branching implementation.
- Kept the validated/rejected discriminated union on `InvocationSemanticIntegratedResponse`; each variant owns exactly one corresponding publication result, and that publication result owns the analysis.
- Simplified `InvocationSemanticIntegratedResponseCompositionResult` to one source-bound `knowledge` value and one integrated `response`.
- Simplified Laravel scanner wiring to one `integrate(...)` call and one atomic result. No detached projection is created or returned.
- Updated regression coverage to read the analysis from the publication selected by the response's discriminant.
- Bumped integrated response contract to v5, composition contract to v8, and pipeline contract to v56.

## Validation boundary

The phase audit is static and checks for contract shape, removed projection/overload paths, and the scanner boundary. It does not replace TypeScript typechecking or Vitest. The full build/typecheck and Vitest suite were not run in this environment.

## Remaining Laravel migration

This phase does not retire `subscanners/resource/resourceUpstreamExpressionCanonical.ts`. The Laravel AST-to-upstream `Expression` contract remains a separate interface-first migration and must be modeled upstream before wiring consumers and deleting the subscanner.
