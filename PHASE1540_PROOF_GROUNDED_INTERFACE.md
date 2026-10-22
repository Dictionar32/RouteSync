# Phase 1540 — Proof-Grounded Semantic Dataflow Interface

## Scope

This phase intentionally strengthens the existing `SemanticDataflowJudgmentBoundaryInterface`. It does not change the semantic dataflow authority or scanner implementation.

## Interface changes

- Reject duplicate facts in the admitted closure, so `derivationCoverage.coveredFacts` cannot be satisfied by counting duplicate facts.
- Reject duplicate `(rule, witness)` pairs, preserving witness identity as a meaningful proof address.
- Require every closure fact to have a grounded derivation chain rooted in canonical input facts. Cyclic derivations cannot certify themselves.
- Preserve the existing authority → admission boundary → scanner projection flow.

## Trace

- `packages/core/src/types/upstream/semanticDataflowInterface.ts`: modified; validation contract and admission checks.
- `scripts/audits/audit-phase1540-proof-grounded-interface.cjs`: added static contract audit.
- `package.json`: added `audit:phase1540-proof-grounded-interface` script.
- `packages/core/src/types/upstream/semanticDataflowAuthority.ts`: unchanged.
- `packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts`: unchanged.

## Verification

- Phase 1540 interface audit: 7/7 passed.
- Phase 1534 source-bound query interface audit: 11/11 passed.
- Phase 1535 ownership-correlated runtime contract audit: 7/7 passed.
- Phase 1536 source-bound execution validation audit: 7/7 passed.
- Phase 1538 fixed-point certificate audit: 9/9 passed.
- Phase 1539 derivation-closed interface audit: 9/9 passed.
- Phase 1500 interface-first query authority audit: passed.
- Phase 918 upstream dataflow boundary audit: clean.
- Phase 1384 runtime contract audit: 11/12 passed; the pre-existing `route producer uses canonical materialize API` check remains failing and was not changed here.
- Full TypeScript build/typecheck: not run; workspace dependencies and `tsdown` are unavailable.

## Limitation

This boundary validates the internal support graph of a supplied derivation set. It does not prove that the upstream solver enumerates every valid derivation or that the full inference system is complete. A valid closure whose authority emits only cyclic/un-grounded witnesses will be rejected; that is an explicit migration signal for the authority, not something the interface repairs.
