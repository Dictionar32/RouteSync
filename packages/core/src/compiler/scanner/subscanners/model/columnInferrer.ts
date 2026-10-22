/** Compatibility projection for model consumers; schema lookup is owned by the existing upstream schema-relation index. */
import type { Columns, Indexes, ForeignKeys } from '../../../../types/upstream/collections';
import type { SchemaInterface, SchemaTable } from '../../../../types/upstream/schema';
import type { TableName } from '../../../../types/upstream/names';
import { schemaRelationIndexFrom } from '../../../../types/upstream/schemaRelation';

export type ResolvedModelSchema = { readonly columns: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys };

export interface ResolveModelColumnsInterface {
    (table: TableName, schema: SchemaInterface): Columns;
}

export interface ResolveModelSchemaInterface {
    (table: TableName, schema: SchemaInterface): ResolvedModelSchema;
}

const requireSchemaTable = (table: TableName, schema: SchemaInterface): SchemaTable => {
    const resolved = schemaRelationIndexFrom(schema).schemaTable(table);
    if (resolved !== undefined) return resolved;
    throw Error(`Model boundary violation: schema associated with table "${table.value.value}" was not found.`);
};

export const resolveModelColumns: ResolveModelColumnsInterface = (table, schema) => requireSchemaTable(table, schema).columns;

export const resolveModelSchema: ResolveModelSchemaInterface = (table, schema) => {
    const resolved = requireSchemaTable(table, schema);
    return { columns: resolved.columns, indexes: resolved.indexes, foreignKeys: resolved.foreignKeys };
};
