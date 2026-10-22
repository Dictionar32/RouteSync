# Phase 1677 — Invocation Semantic Algebra Implementation

## Scope

Implements the Phase 1676 `InvocationSemanticAlgebraInterface` against the canonical invocation judgment contract. The phase updates the judgment input contract only where needed to accept upstream positional-argument evidence. It does not migrate scanner wiring or downstream consumers.

## Implementation

- `invocationSemanticAlgebra` is now a concrete `InvocationSemanticAlgebraInterface` implementation.
- Target resolution, argument binding, effect projection, and judgment closure are separate domain operations.
- Argument binding consumes the already-derived target-resolution judgment and does not re-resolve callable candidates.
- Positional binding is withheld unless upstream evidence identifies the same invocation and exactly the same ordered argument sequence.
- The argument disposition ledger is constructed in source order, preserving repeated argument identities as distinct positional occurrences.
- Result and exception emissions remain separate discriminated outcomes and are projected only from emissions declared by the resolved callable.
- Closure consumes phase judgments, obligations, evidence, trace, and derivation witnesses. It does not rerun the prior phases.
- Authority validation now checks invocation membership, cross-field identity, positional correspondence, proof/trace correlation, declared-emission membership, and separate provenance channels.
- Batch analysis preserves per-invocation judgments and proof artifacts.

## Research alignment

The implementation follows TypeScript's discriminated-union approach for expressing mutually exclusive semantic outcomes and its exhaustive-narrowing guidance. It also follows the compiler-interface principle documented by MLIR: analyses should consume domain interfaces instead of embedding per-operation semantic special cases in each consumer. Changing an interface also requires updating the callers that cross that boundary; this is why the authority now consumes the new judgment shape rather than the former `callTargets` field on a single judgment.

## Verification

- Focused strict TypeScript check for the algebra interface, algebra implementation, and authority: passed.
- Compiled the upstream authority dependency slice to CommonJS and executed six runtime semantic cases: passed.
- Phase 1676 interface audit: 15/15 passed.
- Phase 1677 implementation audit: 21/21 passed.
- Durable Phase 1677 test source type-check: passed with a temporary Vitest type shim; six runtime scenarios were executed against the compiled authority slice and passed.
- Full repository build/test suite: not verified. The workspace does not include installed dependencies (`npm run build` stops because `tsdown` is unavailable), and the available global TypeScript compiler is 5.8.3 while the repository declares TypeScript 7.0.2. A repository-wide probe therefore cannot serve as a valid full build result and also reports unrelated missing dependencies and pre-existing errors.

The invocation contract version is now 30 to record the optional, validated positional-evidence input. The semantic model version remains 17 because the domain rule catalog was not changed.

## Important semantic boundary

No upstream producer of `InvocationPositionalArgumentEvidence` was discovered in the inspected source tree. Consequently, calls with arguments remain `argument-form-unproven` unless a caller supplies matching upstream evidence. This is intentional: the algebra no longer treats array order alone as proof of positional call semantics.

## Next step

Trace and connect the actual upstream producer of positional argument evidence, then validate end-to-end wiring. Do not remove old scanner/runtime code until the producer-to-authority-to-downstream path is demonstrated by tests.
