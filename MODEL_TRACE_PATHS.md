# Model Interface Trace Paths

Status: trace-only path map. No interface repair is implied by this file.

## Root pipeline

- packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts

## Model path

1. packages/core/src/compiler/scanner/subscanners/ModelScanner.ts
2. packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts
3. packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts
4. packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts
5. packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts
6. packages/core/src/compiler/scanner/symbols/model/originModelSymbol.ts
7. packages/core/src/compiler/scanner/subscanners/TypeDeriver.ts
8. packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts
9. packages/core/src/compiler/scanner/subscanners/semantic/modelTypeDeriver.ts
10. packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts
11. packages/core/src/compiler/scanner/subscanners/resource/resourceBindingModelFactory.ts
12. packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts
13. packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts
14. packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts
15. packages/core/src/compiler/scanner/subscanners/InvalidationResolver.ts

## Intended trace direction

Laravel source
  -> Model scanner / parser
  -> ModelAst
  -> production manifest model boundary
  -> ModelSymbolTable
  -> TypeDeriver / SemanticTypeDeriver
  -> resource/model consumers
  -> route-group derivation
  -> invalidation derivation

## Rule

Do not introduce a new model interface for this trace. ModelAst is the upstream semantic model boundary. ParsedModel remains legacy/adapter vocabulary until the trace proves where it must be removed or adapted.
