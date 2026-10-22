# Phase 1674 — Invocation Judgment Outcome Correlation

## Scope

Interface-first refinement only. The phase changes `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts` and adds a focused structural audit plus compile-time type tests. It does not migrate the invocation algebra, authority, runtime executor, scanner, or downstream consumers.

## Contract changes

- `InvocationSemanticModel` version 16 → 17.
- `InvocationSemanticContract` version 27 → 28.
- A closed invocation judgment now requires `targetResolution.kind === 'resolved'` and only the `not-required` or `established` argument-binding outcomes.
- An incomplete judgment with a resolved target cannot use the `blocked` binding outcome.
- An incomplete judgment with an unresolved target is correlated with a blocked/unresolved binding target.
- An incomplete judgment with an ambiguous target is correlated with a blocked/ambiguous binding target.
- The contract records these outcome-correlation laws explicitly.

## Verification

- `node packages/core/scripts/audits/audit-phase1674-invocation-judgment-outcome-correlation.cjs`: 9/9 checks passed.
- Focused TypeScript strict check passed for the interface and compile-time negative tests:
  `npx --no-install tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts packages/core/scripts/audits/phase1674-invocation-judgment-outcome-typecheck.ts`
- Full repository build and tests were not run.

## Known boundary

TypeScript cannot enforce equality between arbitrary invocation/target IDs held in separate properties. Authority must still validate identity equality, evidence provenance, and exact argument coverage. Because the existing algebra and consumers have not yet been migrated, this is an interface-contract phase, not a claim that the whole repository already conforms to the new contract.
