# Phase 2794 — Upstream-contract-first Fully Typed Runtime Scanner Operations

## Contract-first rule

Inspect `packages/core/src/types/upstream` before introducing an interface/ADT. Reuse an existing contract when it owns the same responsibility. Parser-specific AST contracts stay with the parser/frontend layer when moving them upstream would make upstream depend on compiler implementation types. A contract is not justified solely to hide a `switch`.

## Existing upstream contracts consulted

- `PhpAstExpressionSemanticAuthorityInterface<Evidence>`: final semantic PHP AST expression authority.
- `ExpressionFromPhpAstOperationInterface<SyntaxEvidence>`: top-level syntax-to-`Expression` projection.
- `ResourceAstExpressionMappingOperationInterface<SyntaxValue>` and `ResourceAstExpressionMappingAuthorityInterface<SyntaxValue>`: Resource-domain mapping.
- `ScannerExpressionOperatorInterface`: operator resolution contract.
- `SemanticKnowledgeEvidenceAdapter<Evidence>`: parser evidence adapter boundary and its projection input/result.
- `LaravelSourceAstPipelineInterface` with `LaravelSourceAstProjectionJudgment`: source-AST pipeline and explicit complete/blocked result.
- `ManifestBuilderOperationPreparationInterface` and `ManifestBuilderInterface` with `ManifestBuilderJudgment`: preparation and canonical manifest construction.

These upstream contracts do not directly describe the concrete parser-owned `RouteBindingDeclarationAst` or `PhpStatement` syntax-registry operation. For those, a local frontend operation interface is appropriate; moving it upstream would leak frontend-owned types. No new upstream interface or ADT is added by this phase.

## Applied interface-first runtime changes

1. Replaced exported free function `parseRouteBindingDeclarations(path)` with `routeBindingDeclarationParser: RouteBindingDeclarationParserInterface`, a frozen operation object. The route declaration parser now calls `routeBindingDeclarationParser.parse(...)`.
2. Replaced exported free function `projectPhpStatementSyntaxEvidence(statement, context)` with `phpStatementSyntaxEvidenceProjection: PhpStatementSyntaxEvidenceProjectionInterface`, a frozen operation object. The semantic dataflow adapter now calls `.project(...)`.
3. Existing semantic authority/adapter and manifest contracts remain the top-level boundaries; the local syntax operations do not claim to replace them.
4. `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes). No generic collection wrapper or new reasoning primitive was introduced.

## CLI → upstream manifest runtime trace

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation
  -> controller-invocation manifest composition
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment (complete | blocked)
  -> source-model construction judgment (complete | blocked)
  -> ManifestBuilderJudgment (manifest_builder_complete | manifest_builder_blocked)
  -> CLI manifest projection / validation / serialization
```

The same existing ADTs must be preserved end-to-end. Empty results, absent evidence, and blocked outcomes are not interchangeable. A `switch` that exhaustively eliminates an ADT inside its owning implementation can remain; a caller-side switch duplicating domain policy should delegate to the existing owning operation.

## Producer boundary and remaining contract decision

The runtime subtree also had two exported free-function producer entry points. They are now frozen, interface-typed operation objects:

- `phpAstSemanticKnowledgeDataFlowProductionOperation: PhpAstSemanticKnowledgeDataFlowProductionOperationInterface` exposes `.produce(...)` for the parser-owned `PhpBlock` evidence.
- `semanticKnowledgeDataFlowProducer: SemanticKnowledgeDataFlowProducerInterface` exposes `.produce(...)` as a local convenience operation over the existing `SemanticKnowledgeEvidenceAdapter`.

Before introducing these local contracts, the upstream `SemanticKnowledgeEvidenceAdapter<Evidence>` contract was inspected. Its `project(input)` contract intentionally binds evidence, source file, provider, and a projection receipt; it is not shape-equivalent to the parser-local `produce(block, filePath?)` helper. The new interfaces remain in the frontend layer because their signatures contain parser-owned `PhpBlock`. They do not replace or duplicate the upstream adapter's top-level ownership. Tests were migrated to call the operation objects. No `export function` declarations remain in the audited `routeAst`, scanner, or CLI command runtime directories.

A further simplification could migrate callers directly to `phpAstSemanticKnowledgeEvidenceAdapter.project(...)` and remove the convenience producer, but that requires changing the consumer input boundary, not simply renaming a function. It is not claimed here as completed.

## Verification boundary

The Phase2794 audit checks contract inventory, runtime operation-object shape, call-site wiring, trace documentation, and the empty collections file. It does not prove full TypeScript typecheck, build, complete tests, or CLI scan/sync end-to-end execution.
