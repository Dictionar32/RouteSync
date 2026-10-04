# Phase 743 — Diagnostic → Semantic State Authority

## Diagnostic input

The authoritative local build reported DTS failures in:

`packages/core/src/compiler/scanner/lexer/routeAst/semanticStateDataFlow.ts`

Missing canonical symbols:
- `SemanticAccessMember`
- `SemanticPresence`

The fix imports both symbols from the canonical semantic knowledge/data-flow relation module. No cast, fallback, compatibility descriptor, or host-language absence sentinel was introduced.

## Structural correction

`SemanticStateLocation.member` now explicitly consumes the canonical `SemanticAccessMember` ADT.

`SemanticStateMerge.selector` now explicitly consumes `SemanticPresence<KnowledgeId>`.

The merge constructor was also made an explicitly typed semantic constructor so literal assertions are not required.

The state analysis remains relation-derived:

`SemanticKnowledgeDataFlow facts → typed relation selection/projection/expansion → SemanticStateDataFlow`

The state/data-flow analysis is derived from canonical semantic facts; it is not an alternative AST or parsed descriptor.

## Controller authority frontier

Phase 742 removed production consumers of:

- `.dataflow.definitions`
- `.dataflow.references`
- `LegacyController*`
- `ControllerDataflowReference`
- legacy controller definition-origin compatibility types

Phase 743 audit confirms those legacy surfaces remain absent from the controller authority frontier.

## Unused surfaces

The audit confirms the following source files are already empty and have no production import/path references discovered by the phase audit. They are retained empty rather than recreated:

- `packages/core/src/compiler/analysis/legacyFlow.ts`
- `packages/core/src/compiler/contracts.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParserHelpers.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxRelationProgram.ts`
- `packages/core/src/compiler/scanner/scannerLegacyDelegates.ts`
- `packages/core/src/types/domain/resourceAggregateResolver.ts`
- `packages/core/src/types/domain/resourceCollectionGroupModel.ts`
- `packages/core/src/types/domain/resourceCollectionMethodSurface.ts`
- `packages/core/src/types/domain/resourceCollectionSurfaceResolver.ts`
- `packages/core/src/types/domain/resourceEloquentFlow.ts`
- `packages/core/src/types/domain/resourceGroups.ts`

## Architecture direction

RouteSync remains structured as:

Laravel syntax/evidence
→ closed scanner evidence ADTs
→ canonical upstream semantic ADTs
→ declarative semantic relations
→ constraint/fixed-point closure
→ semantic rewrite/saturation
→ Next.js target semantic projection

The architecture reference scan reinforces three principles:

1. WebAssembly validation separates declarative validity rules from the validation algorithm.
2. MLIR PDLL/DRR separates pattern matching from rewrite specification.
3. Circular Reference Attribute Grammars express recursive semantic equations directly as fixed-point computations.
4. CodeQL and Soufflé model analysis as relations/tuples rather than imperative traversal.
5. K models semantics as rewrite rules over structured configurations.
6. Spoofax separates declarative syntax, static semantics/scope graphs, and term transformations.
7. Alive2 demonstrates a useful downstream invariant for RouteSync: transformations should be checkable against a semantic relation/refinement boundary rather than trusted merely because the implementation compiles.
