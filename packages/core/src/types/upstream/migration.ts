import type { Sequence } from './collections';
import type { Columns, ForeignKeys, Indexes } from './collections';
import type { Expression } from './expression';
import type { SourceFile, TableName } from './names';
import type { SourceSpan } from './provenance';

export type MigrationOperation =
  | { readonly kind: 'create_table'; readonly table: TableName; readonly columns: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys }
  | { readonly kind: 'alter_table'; readonly table: TableName; readonly additions: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys }
  | { readonly kind: 'drop_table'; readonly table: TableName }
  | { readonly kind: 'raw'; readonly expression: Expression };

export type MigrationDefinition = {
  readonly kind: 'migration_definition';
  readonly file: SourceFile;
  readonly operations: MigrationOperations;
  readonly source: SourceSpan;
};

export type MigrationOperations = {
  readonly kind: 'migration_operations';
  readonly items: Sequence<MigrationOperation>;
};
