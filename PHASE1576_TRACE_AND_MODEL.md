# Phase 1576 — Executable Authority Outcome Enforcement

## Objective

Continue interface-first work by implementing the authority boundary that enforces the verified-outcome contract. Do not migrate scanner or runtime executor before the boundary is enforceable and tested.

## Trace

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Replaced the separately duplicated 32-member law union with `REQUEST_TYPE_DERIVATION_LAW_IDS` as the canonical runtime registry and derived `RequestTypeDerivationLawId` from that tuple.
  - Added explicit outcome states for an invalid-input judgment whose rejection cannot be verified, and for inconsistent judgment/verification discriminants.
  - Added mismatch reasons for rejection reason, rejection evidence, contract coverage, and verified coverage.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts`
  - Added a concrete authority-boundary factory around an injected semantic kernel.
  - `derive()` always calls the kernel's judgment producer, calls verification, validates exact required-law coverage and exact verified-law coverage, and only then classifies the outcome.
  - A judgment is never returned as `verified` when verification fails, when judgment and verification kinds contradict, or when any of the 32 law IDs are missing/duplicated in coverage.
  - An input rejection is accepted only if the verifier confirms the same rejection reason and structurally equivalent evidence.
  - The semantic kernel remains an explicit dependency: this phase does not claim that all 32 semantic laws have a complete production verifier yet.
- `scripts/audits/audit-phase1576-authority-outcome-enforcement.cjs`
  - Structural checks for the canonical law registry, coverage gates, outcome coherence, and unchanged scanner/runtime boundary.
- `scripts/audits/test-phase1576-authority-outcome-behavior.cjs`
  - Executable behavior matrix for coherent and contradictory authority outcomes.
- Phase 1571–1575 audits were updated to recognize the new canonical law registry rather than incorrectly expecting a type-only law union or a runtime-free interface file.

## Verification

- Phase 1576 structural audit: 14/14 passed.
- Phase 1576 behavioral matrix: 10/10 passed.
- Phase 1571 regression: 10/10 passed.
- Phase 1572 regression: 11/11 passed.
- Phase 1573 regression: 12/12 passed.
- Phase 1574 regression: 10/10 passed.
- Phase 1575 regression: 9/9 passed.
- Targeted TypeScript check exits 2 due to 35 diagnostics in imported dependency modules; zero diagnostics directly reference the two Phase 1576 TypeScript files.
- Full package build and Vitest were not run because `node_modules` is not installed in this workspace.

## Scope boundary

`RequestTypeDeriver.ts` and `request-deriver/groupAggregator.ts` are not migrated in this phase. `semanticTypeDerivationRuntimeExecutor.ts` is unchanged. The new factory is an enforcement boundary around an injected kernel, not the missing full semantic derivation/verifier implementation. The next phase should implement the law verifier against source evidence, then wire the scanner to this authority, and simplify runtime executor last.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
  - Supports the principle that analyses/transforms depend on stable interfaces instead of hard-coded implementation details.
- TypeScript Handbook — Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - Documents discriminated unions and `never`-based exhaustiveness techniques.

These references inform the design but do not validate RouteSync's implementation.
