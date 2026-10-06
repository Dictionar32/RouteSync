# Phase 987 — MigrationInterface upstream boundary closure

Phase 987 closes the remaining ownership leak in the migration semantic interface.

## Boundary

The canonical migration path is now:

`MigrationAst -> migrationInterfaceAdapter -> MigrationInterface -> SchemaProducer -> SchemaInterface`

`MigrationInterface` is now semantic-only. It contains `MigrationDefinition`, `SourceSpan`, and the closed marker, but does not import or mention `MigrationAst`.

The AST-to-interface conversion is owned by the scanner boundary at:

`packages/core/src/compiler/scanner/upstream/migrationInterfaceAdapter.ts`

This matches the broader upstream rule that scanner evidence is adapted once and downstream semantic consumers do not reinterpret AST evidence.

## Dataflow separation

The migration interface remains upstream schema input. It is not imported by the semantic dataflow algebra, dataflow fixed-point authority, manifest seed surface, or IR projection.

The two provenance paths therefore remain separate:

1. `MigrationInterface -> SchemaInterface -> SchemaRelationInterface -> ModelSemanticRelation -> GraphEdgeRelation`
2. `SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> SemanticDataflowIRProjection`

No migration-specific dataflow solver or second fixed-point authority is introduced.

## Compatibility

`migrationInterfaceFromAst` remains publicly exported from the package index, but its implementation now lives in the scanner adapter rather than the upstream semantic interface module.

The legacy `packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` remains physically present and empty.
