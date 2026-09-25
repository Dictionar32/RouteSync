import type { Columns, ForeignKeys, Indexes, Sequence } from './collections';
import type { TableName } from './names';
import type { SourceSpan } from './provenance';
import type { MigrationAst } from './ast';

export type SchemaTable = {
    readonly kind: 'schema_table';
    readonly table: TableName;
    readonly columns: Columns;
    readonly indexes: Indexes;
    readonly foreignKeys: ForeignKeys;
    readonly sourceMigrations: Sequence<MigrationAst>;
    readonly source: SourceSpan;
};

export type SchemaTables = {
    readonly kind: 'schema_tables';
    readonly items: Sequence<SchemaTable>;
};

export type SchemaDefinition = {
    readonly kind: 'schema_definition';
    readonly tables: SchemaTables;
    readonly source: SourceSpan;
};

export type SchemaAst = {
    readonly kind: 'schema_ast';
    readonly definition: SchemaDefinition;
    readonly source: SourceSpan;
};

export type SchemaProducerInput = {
    readonly migrations: import('./collections').MigrationAsts;
    readonly projectSource: SourceSpan;
};

export interface SchemaProducer {
    readonly produce: (input: SchemaProducerInput) => SchemaAst;
}
