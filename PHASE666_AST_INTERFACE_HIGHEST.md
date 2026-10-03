# Phase 666 — AST Interface Highest

Phase 666 elevates the existing stage judgment/port model into a closed semantic interface algebra.

## Model

The compiler no longer needs to consume concrete scanner, upstream mapping, resolver, analysis, lowering, or target implementations to reason about a stage. A stage is exposed through:

- stage identity
- input/output contract
- AST semantic judgment authority
- closed semantic facts
- preservation/refinement proof obligations
- declarative fixed-point/rewrite reasoning mode

## New interface algebra

`packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts`

Exports:

- `AstSemanticStageInterface`
- `astSemanticStageInterface`
- `astSemanticStageInterfaceOf`
- `astSemanticStageInterfaceAt`
- `astSemanticPipelineInterfaces`
- `astSemanticInterfaceFacts`
- `astSemanticInterfaceProofs`

The interface is closed and does not expose raw implementation state.

## Stage elevation

Companion semantic-interface projections now exist for:

- scanner AST evidence
- upstream semantic mapping
- resolver graph/resource resolution
- control/data-flow analysis
- semantic type lowering
- TypeScript target surface projection

Existing port APIs remain available as compatibility transport boundaries; the new interface algebra is the semantic client boundary.

## Audit

Phase 665 boundary audit remains clean.

Phase 666 audit verifies:

- closed AST semantic interface algebra
- stage judgment carries proof obligations
- legacy semantic solver and syntax-error core are empty
- forbidden host constructs are absent from the selected semantic authority boundary
- scanner/mapping/resolver/analysis/lowering/target interface projections transpile

Inactive-file vacuum was rerun and reports zero candidates.

## Remaining scanner/resolver frontier

The repository-wide scan still finds older implementation leaks outside the selected closed authority boundary, notably:

- `phpMethodParser.ts`
- `controllerMethodParser.ts`
- `arrayParser.ts`
- `controllerDataflowAnalyzer.ts`
- `astClassifierEvidence.ts` token indexing
- legacy route semantic catalogs using `Extract` casts
- legacy `Presence.fromOptional` compatibility API

These are not declared clean merely because the new interface algebra is clean. The next elevation should replace their token/optional implementation APIs with the same closed lexical evidence and stage-interface algebra, then discharge the stage proof obligations through the rewrite engine rather than merely storing obligations.

## Design correspondence

The elevation follows the useful architectural ideas of MLIR interfaces and dialect conversion, Statix constraint/scope-graph semantics, K rewrite semantics, Soufflé/Nemo/Flix relational fixed points, CompCert pass-by-pass semantic preservation, WebAssembly WIT contract boundaries, CiaoPP abstract interpretation, and circular/reference attribute grammars. These systems differ substantially, so RouteSync does not copy their implementations; it adopts the common architectural ideas relevant to a compiler-style semantic transformation.
