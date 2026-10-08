# Phase 675 — AST ADT Mapping → Resolver → Analysis → Lowering Authority

## Purpose

Phase 675 raises the remaining scanner/resolver boundary from constructor-style
helpers to explicit AST ADT judgments. The goal is not to cosmetically remove
host-language syntax, but to move semantic authority into closed interfaces
that can be consumed by a declarative relation/rewrite engine.

## Changes

### 1. Closed upstream mapping interface

Added `types/upstream/astMappingInterface.ts` with:

- `AstMappingFact`
- `AstMappingDerivation`
- `AstMappingJudgment`
- `AstMappingInterface`

A mapping now carries source term, upstream target term, preservation/refinement
facts, derivation witness, fixed-point closure, reasoning mode, and the
`mapping_to_resolver` proof obligation.

### 2. Resource AST mapping authority

`resourceSemanticMappingRelations.ts` now exposes
`resolveResourceAstMappingInterface()` in addition to the stage transport port.
The relation registry remains derived data; the closed mapping judgment is the
semantic authority.

### 3. Resolver graph consumes mapping judgment

`resolverGraphSemanticInterface.ts` now requires `AstMappingInterface` as an
explicit input and carries the mapping judgment into the resolver graph facts.
The graph is therefore no longer an isolated trio of domain/security/CRUD
resolvers; its upstream semantic dependency is explicit.

### 4. Scanner/query evidence frontier

`queryEvidenceProducer.ts` was elevated from `Extract`/optional-access
refinement to `RelationVariant` + relational option/refinement dispatch. The
selected boundary now has zero host control-flow, host absence, strict
comparison, unsafe-cast, `Extract`, collection-method, or optional-syntax
violations under the TypeScript AST audit.

### 5. Resolver capability authority

`capabilityResolution.ts` now has a closed `RouteCapabilitySemanticInput`
whose optional authoring evidence is normalized into `Presence<T>` before
semantic resolution. `resolveRouteCapabilityJudgment()` is the declarative
authority; `resolveRouteCapability()` is only the compatibility adapter.

### 6. Analysis → lowering bridge

`AstAnalysisFact` now admits a typed `semantic_type` judgment. The lowering
layer exposes `resolveTypeScriptLoweringFromAnalysis()`, so semantic type
lowering can consume an analysis judgment rather than being authoritative only
over a bare type-kind scalar.

## Validation

- Phase 675 AST interface audit: **PASS**.
- Phase 674 audit: **PASS**.
- Phase 673 transition audit: **PASS**.
- Phase 525 inactive-file vacuum: `candidates=[]`, `remainingNonEmptyCandidates=[]`.
- Full TypeScript transpilation: **1696 files, 0 failures**.
- `tsc --noEmit` remains environment-blocked only by missing `node` and
  `vitest/globals` type-definition packages; no Phase 675 file-specific error
  was reported by the compiler run.

## Architectural direction

The resulting shape is closer to the interface/contract style of MLIR,
rewrite semantics in K, relational recursion in Soufflé/egglog-like systems,
fixed-point attribute evaluation, and proof-carrying semantic preservation in
CompCert/Alive2-style pipelines. MLIR explicitly uses interfaces to decouple
transformations and analyses from concrete operations/dialects, while dialect
conversion separates legality, rewrite patterns, and type conversion.

K models executable semantics as configurations plus rewrite rules, and
circular reference attribute grammars express recursive semantic equations via
fixed points.

CompCert's architecture makes semantic preservation a proof obligation across
compiler transformations, while WebAssembly WIT makes interfaces/worlds an
explicit contract layer for typed component boundaries.

## Next frontier

1. Replace the remaining `RouteBoundaryOptions` optional authoring contract
   with an explicit boundary-evidence ADT and keep the legacy shape outside the
   semantic authority.
2. Elevate `boundaryBasics` to `RouteBoundaryBasicsJudgment` using the same
   `Presence` + relation refinement algebra.
3. Replace the remaining scalar `dataflow_fact` representation with typed
   analysis relations and connect resolver edges directly to analysis premises.
4. Make semantic type legality a proof-carrying analysis-to-lowering transition,
   rather than only a legality field on the lowering judgment.
5. Continue scanner/lexer migration by replacing residual `Extract`/optional
   host constructs only at semantic authority boundaries; source-language
   variants such as PHP `null`, ternary, coalesce, and strict equality remain
   valid **data vocabulary** when represented as closed AST ADTs.
