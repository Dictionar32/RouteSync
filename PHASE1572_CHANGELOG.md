# Phase 1572 changelog

- Tightened duplicate-occurrence failure witnesses in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Added domain-correlated unions for both single repeated-location and pairwise repeated-location counterexamples.
- Correlated the domain label with its semantic-key prefix, evidence-reference type, and occurrence-key type for route/resource/request evidence.
- Added `scripts/audits/audit-phase1572-domain-correlated-duplicate-counterexample.cjs` and `PHASE1572_AUDIT.json` (11/11 static structural checks passed).
- Added `PHASE1572_TRACE_AND_MODEL.md` with concrete upstream → scanner → executor trace and explicit non-claims.
- Did not change scanner wiring or runtime executor; no authority implementation was found in `packages/core/src`.
- Full build and Vitest were not run because dependencies are not installed in the workspace. Targeted `tsc` exits 2 due to 35 imported-dependency diagnostics and reports 0 diagnostics directly in the edited interface file.
