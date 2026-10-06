import type { Columns, ForeignKeys, Indexes, Sequence } from './collections';
import type { MigrationInterface } from './migrationInterface';
import type { TableName } from './names';
import type { MigrationProvenance, SourceSpan } from './provenance';

export type SchemaTable = {
    readonly kind: 'schema_table';
    readonly table: TableName;
    readonly columns: Columns;
    readonly indexes: Indexes;
    readonly foreignKeys: ForeignKeys;
    readonly migrationProvenance: Sequence<MigrationProvenance>;
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

/**
 * Canonical upstream schema semantic boundary.
 * SchemaAst remains the compatibility evidence representation; semantic consumers
 * cross this closed interface instead of reinterpreting migration operations.
 */
export interface SchemaInterface {
    readonly kind: 'schema_interface';
    readonly definition: SchemaDefinition;
    readonly source: SourceSpan;
    readonly closed: true;
}

export type SchemaProducerInput = {
    readonly migrations: readonly MigrationInterface[];
    readonly projectSource: SourceSpan;
};

export interface SchemaProducer {
    readonly produce: (input: SchemaProducerInput) => SchemaInterface;
}
