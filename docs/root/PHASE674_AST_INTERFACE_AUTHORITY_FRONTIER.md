# Phase 674 — AST Interface Authority Frontier

## Model

Phase 674 raises RouteSync beyond individual stage ports into closed semantic authority interfaces for the resolver graph, analysis/SSA, and target type legality. Concrete parser/resolver/analysis implementations are adapters; semantic meaning is carried by ADTs, relations, fixed-point closure, refinement witnesses, and legality judgments.

## Elevations

- Added `compiler/scanner/resolvers/resolverGraphSemanticInterface.ts`.
  - Closed resolver graph judgment.
  - Domain/security/CRUD facts.
  - Explicit resolver edges.
  - Least-fixed-point reasoning declaration.
  - `resolver_graph_judgment` authority.
- Exposed the existing RouteDomain judgment through `RouteDomainResolver.resolveJudgment` so the resolver graph consumes a judgment rather than a scalar-only compatibility projection.
- Added `compiler/analysis/astAnalysisInterface.ts`.
  - Closed analysis fact algebra.
  - Derivation witnesses.
  - Preservation relation.
  - Fixed-point/rewrite reasoning declaration.
- Added `compiler/analysis/ssa/ssaSemanticInterface.ts`.
  - Closed SSA semantic judgment/interface.
- Removed remaining `as Extract` from the selected SSA and loop analysis frontier by using `RelationVariant` refinement.
- Changed CFG constant operands from `unknown` to the closed `ConstantValue` algebra.
- Raised TypeScript lowering legality from a string marker to a closed `TypeScriptLoweringLegality` ADT.

## Audit

`audit-phase674-ast-interface-authority-frontier.cjs` uses TypeScript AST inspection, not raw regex, for host-language constructs.

Selected authority boundary has zero occurrences of:

- if / while / for / switch
- map / filter / reduce / flatMap calls
- undefined identifier
- nullish operator
- strict equality / inequality
- `as unknown`
- `as Extract`
- TypeScript `any`
- null literal
- `new Set` / `new Map`
- conditional / optional syntax

## Inactive vacuum

Phase 525 inactive-file audit remains clean:
`candidates=[]`, `remainingNonEmptyCandidates=[]`, `allCandidatesEmpty=true`.

## Validation

- Phase 674 audit: PASS
- Phase 673 audit: PASS
- Phase 672 audit: PASS
- Phase 671 audit: PASS
- Phase 525 inactive-file vacuum: PASS
- Production TypeScript transpilation: 1128 files, 0 failures
- `tsc --noEmit`: environment-blocked only by missing `node` and `vitest/globals` type definitions.

## Architectural direction

The next frontier is to make upstream mapping itself a closed transformation judgment and to connect resolver facts to analysis facts through the existing five transition proofs. Type lowering should then consume an explicit target legality judgment rather than a kind-to-operation lookup alone.
