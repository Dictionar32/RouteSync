# Phase 1759 — Invocation Integrated Response: Closed Correlation Contract

## Interface-first trace

Phase 1758 made the integrated response and its analysis projection one scanner-facing composition result. The remaining contract hole was at the TypeScript type level: the result still declared `response` and `analysisProjection` as two independent unions. Runtime composition returned matching variants, but the interface permitted a validated response to be paired with a rejected projection (or vice versa).

## Interface change

`InvocationSemanticIntegratedResponseCompositionResult` is now a closed discriminated union:

- `validated-integrated-response` can only be paired with `validated-integrated-response-analysis`;
- `rejected-integrated-response` can only be paired with `rejected-integrated-response-analysis`.

The composition contract is version 7 and explicitly names this type-level correlation as an invariant. The projection helper has variant-preserving overloads, so the implementation can satisfy the interface without assertions or a weaker detached result type.

## Implementation boundary

Composition narrows the existing publication outcome and returns the correlated response/projection pair. It does not derive judgments, revalidate publication, synthesize fallback analysis, or move semantic reasoning into the scanner. Scanner AST continues to expose the atomic composition result only.

## Static audit

Run from repository root:

```sh
node scripts/audits/phase1759-invocation-integrated-response-closed-correlation.mjs
```

This audit checks the closed result union, both outcome correlations, variant-preserving projection overloads, composition narrowing, and the scanner's atomic boundary.

## Validation limits

This phase does not claim a TypeScript typecheck, Vitest pass, or full build. The static audit and ZIP integrity check are separate, limited validations. Laravel resource subscanner retirement remains a separate downstream migration and is not claimed complete here.
