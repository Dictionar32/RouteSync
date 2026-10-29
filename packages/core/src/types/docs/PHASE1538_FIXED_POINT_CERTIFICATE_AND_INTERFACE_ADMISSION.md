# Phase 1538 — Fixed-Point Certificate and Interface Admission

## Trace

`semanticDataflowAuthority.ts` computes fact reachability and path closure. The resulting `SemanticDataflowJudgment` crossed `semanticDataflowJudgmentBoundary` in `semanticDataflowInterface.ts`, then the compatibility scanner projected it in `compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts`.

The previous judgment claimed `fixedPoint: 'least_fixed_point'` and `closed: true`, while the closure algorithms had a 128-round escape that could return a partial result without exposing whether the cap, rather than convergence, stopped the computation. The interface could check internal references but had no closure certificate to distinguish a converged result.

## Model change

- `SemanticDataflowJudgment` now carries `closureCertificate`, with separate fact-closure and path-closure round counts and explicit `converged: true` evidence.
- The authority rejects a fact closure that reaches its iteration limit without convergence.
- The path closure rejects a capped, unfinished computation instead of returning it as a closed judgment.
- Path expansion is restricted to simple paths (a path cannot revisit its source or an already visited target), preventing cyclic graphs from producing endlessly longer path witnesses.
- `SemanticDataflowJudgmentBoundaryInterface` validates the certificate before admitting the judgment to scanner/downstream projection. It still does not derive facts or repair evidence.
- The certificate type is exposed on the upstream interface surface.

## Authority flow

`Source Evidence → SemanticDataflowInput → Upstream SemanticDataflowReasoningAuthority → Judgment + Closure Certificate → Interface Admission → Scanner Projection → Downstream`

The interface remains an admission contract; the authority remains the only solver. The certificate is evidence of solver termination, not by itself a formal proof that the transfer relation is monotone or that every domain-specific inference rule is complete.

## Verification status

Static audit verifies that the judgment carries the certificate, both capped solvers fail closed on non-convergence, path expansion prevents cycles, and scanner admission remains before projection. Full TypeScript build/type-check remains unverified in this workspace because the local TypeScript 7 toolchain and project dependencies are unavailable; the globally installed TypeScript version does not support the repository's `ES2025` configuration and required type packages are absent.
