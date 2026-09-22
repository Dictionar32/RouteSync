# Model / AST / ADT Connection Trace

## Current active connection

Laravel Model source
→ `ModelScanner.scan()`
→ `scanModelAsts()`
→ `modelAstFromParsed()`
→ `ModelAst`
→ `ModelSymbolTable`
→ active semantic consumers

`ModelAst` is now the active model type at the production pipeline boundary. The legacy `scanModels()` path remains only for `scannerLegacyDelegates.ts` compatibility.

## Upstream AST vocabulary

`packages/core/src/types/upstream/ast.ts`
- `ModelAst`
- `ResourceAst`
- `RequestAst`
- `RouteAst`
- `ControllerAst`
- `ResponseAst`

`packages/core/src/types/upstream/collections.ts`
- `SourceAsts`
- `ModelAsts`
- `ResourceAsts`
- `RequestAsts`
- `RouteAsts`
- `ControllerAsts`
- `ResponseAsts`
- semantic ADT collections: `Expressions`, `Assignments`, `Properties`, `ModelRelations`, `ResourceFields`, `RequestFields`, etc.

## Producer status

- ModelAst: PRODUCED by `packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts`
- ResourceAst: TYPE ONLY; no producer yet
- RequestAst: TYPE ONLY; no producer yet
- RouteAst: TYPE ONLY; no producer yet
- ControllerAst: TYPE ONLY; no producer yet
- ResponseAst: TYPE ONLY; no producer yet

## ModelAst consumer repair already connected

The following active consumers now accept `ModelAst` rather than `ParsedModel`:
- `TypeDeriver`
- `SemanticTypeDeriver`
- `SemanticDerivationContext`
- `modelTypeDeriver`
- `InvalidationResolver`
- `ScannedResourceRouteGroupDescriptor`
- `StaticLaravelScanner` active derivation/invalidation signatures
- `ModelSymbolTable`
- `OriginModelSymbol`

## Remaining direct breakpoints

The compiler currently identifies these downstream paths still expecting legacy model semantic data:

`ModelAst`
→ `resource/propertyPathResolution.ts`
→ currently reads `model.node.semantic`

`ModelAst`
→ `resource/whenLoadedSemanticBinder.ts`
→ currently reads `modelSymbol.node.semantic`

These are not fixed by adding fields to `ModelAst`. They must be connected to the existing upstream ADTs (`ModelDefinition`, `ModelRelation`, `PropertyDefinition`, `TypeExpression`) or their consuming contracts must be raised to those existing types.

## Full AST aggregate is not connected yet

The existing `SourceAsts` / `CompleteSourceAst` boundary is present, but there is no production aggregate that currently populates all categories from Laravel scanners.

Target connection without introducing new interfaces:

Laravel source
→ scanner / lexer
→ existing local parser AST + existing ADTs
→ `ModelAst` / `ResourceAst` / `RequestAst` / `RouteAst` / `ControllerAst` / `ResponseAst`
→ existing `SourceAsts`
→ existing `CompleteSourceAst`
→ existing `RouteSyncManifest`

No `ManifestAst`, `ExpressionAst`, `PropertyAst`, or `AssignmentAst` type should be introduced; the repository already has the corresponding semantic ADTs and collection vocabulary.
