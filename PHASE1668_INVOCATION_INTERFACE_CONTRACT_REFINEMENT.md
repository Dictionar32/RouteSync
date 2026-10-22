# Phase 1668 — Invocation Interface Contract Refinement

## Scope

This phase changes only `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`, plus this report and its audit script. Algebra, authority, runtime executor, scanner, and downstream consumers are intentionally untouched, per the interface-first sequence.

## Contract changes

- Bumped `InvocationSemanticModel` from version 10 to 11 and `InvocationSemanticContract` from version 21 to 22.
- `InvocationPositionalArgumentEvidence` now carries both the invocation identity and the exact normalized argument sequence. This lets a future authority reject evidence borrowed from another invocation or another sequence.
- `InvocationArgumentCorrespondenceEvidence` now explicitly binds its claim to invocation and target identities, in addition to argument, parameter, and claim-specific provenance.
- Replaced independently supplied `bindings` and `unboundArguments` with one ordered `argumentDispositions` ledger. Each entry is a domain-level `bound-argument` or `unbound-argument` disposition. This removes the structural duplication that could let bound and unbound collections drift apart.
- Declared the coverage invariant as one ordered disposition per invocation argument, with no loss or duplication; declared the exact invocation/argument-sequence invariant for positional evidence.
- Kept cross-object identity and exact sequence equality as explicit authority-validation obligations. TypeScript structural types alone cannot prove runtime identity equality.

## Verification

- Interface-focused strict TypeScript check passed:
  `npx --no-install tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
- Interface-contract audit: 12/12 checks passed.
- Full repository build and tests were not run. The new interface intentionally does not migrate existing consumers; they still require a subsequent wiring phase. This ZIP is not represented as end-to-end buildable.
- ZIP integrity was checked after packaging.

## Next phase gate

Before changing wiring, confirm the upstream source-model can actually supply the normalized sequence and per-correspondence provenance. Then migrate the semantic algebra to produce this contract directly and make authority validate its invariants. Do not fabricate evidence or reintroduce semantic reasoning in the executor/scanner.
