/**
 * Canonical schema-table lookup boundary.
 * Models consume the cumulative SchemaInterface produced upstream; they never
 * interpret raw migration operations directly.
 */
import type { Columns, Indexes, ForeignKeys } from '../../../../types/upstream/collections';
import type { SchemaInterface, SchemaTable } from '../../../../types/upstream/schema';
import type { TableName } from '../../../../types/upstream/names';
import { relationEqual, relationGate } from '../../../../semantic/foundation/semanticRelations';
import { relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/foundation/relationalSequence';

type SchemaTables = SchemaInterface['definition']['tables']['items'];

const schemaTableWitness = (table: TableName, tables: SchemaTables): RelationOption<SchemaTable> =>
    relationGate(
        relationEqual(tables.kind, 'cons'),
        () => relationGate(
            relationEqual(tables.head.table.value.value, table.value.value),
            () => relationSome(tables.head),
            () => schemaTableWitness(table, tables.tail),
        ),
        relationNone<SchemaTable>,
    );

const requireSchemaTable = (table: TableName, schema: SchemaInterface): SchemaTable =>
    relationOptionFold(
        schemaTableWitness(table, schema.definition.tables.items),
        () => {
            throw Error(`Model boundary violation: schema associated with table "${table.value.value}" was not found.`);
        },
        value => value,
    );

export function resolveModelColumns(table: TableName, schema: SchemaInterface): Columns {
    return requireSchemaTable(table, schema).columns;
}

export type ResolvedModelSchema = { readonly columns: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys };

export function resolveModelSchema(table: TableName, schema: SchemaInterface): ResolvedModelSchema {
    const resolved = requireSchemaTable(table, schema);
    return { columns: resolved.columns, indexes: resolved.indexes, foreignKeys: resolved.foreignKeys };
}
