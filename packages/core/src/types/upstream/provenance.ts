import type { NumberValue } from './valueObjects';
import type { SourceFile, TableName } from './names';
export type SourceSpan = { readonly kind: 'source_span'; readonly file: SourceFile; readonly start: NumberValue; readonly end: NumberValue };

/** Semantic provenance for upstream migration evidence; deliberately excludes MigrationAst. */
export type MigrationOperationProvenance = Readonly<{
  readonly kind: 'migration_operation_provenance';
  readonly operation: 'create_table' | 'alter_table' | 'drop_table' | 'raw';
  readonly table?: TableName;
  readonly index: NumberValue;
}>;

export type MigrationProvenance = Readonly<{
  readonly kind: 'migration_provenance';
  readonly source: SourceSpan;
  readonly operation: MigrationOperationProvenance;
}>;

