/**
 * Canonical migration-column boundary. Model columns are sourced directly
 * from MigrationAst/ColumnDefinition; no ParsedColumn reconstruction and no
 * Map<string, Columns> semantic boundary are allowed here.
 */
import type { Columns, Indexes, ForeignKeys } from '../../../../types/upstream/collections';
import type { MigrationAst } from '../../../../types/upstream/ast';
import type { MigrationOperation } from '../../../../types/upstream/migration';
import type { TableName } from '../../../../types/upstream/names';

export function resolveModelColumns(
    table: TableName,
    migrations: readonly MigrationAst[]
): Columns {
    for (const migration of migrations) {
        let operations = migration.definition.operations.items;
        while (operations.kind === 'cons') {
            const operation: MigrationOperation = operations.head;
            if (operation.kind === 'create_table' && operation.table.value.value === table.value.value) {
                return operation.columns;
            }
            if (operation.kind === 'alter_table' && operation.table.value.value === table.value.value) {
                return operation.additions;
            }
            operations = operations.tail;
        }
    }

    throw new Error(
        `Model boundary violation: migration schema for table "${table.value.value}" was not found. ` +
        'Model columns cannot be synthesized from Eloquent naming conventions.'
    );
}

export type ResolvedModelSchema = { readonly columns: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys };

export function resolveModelSchema(
    table: TableName,
    migrations: readonly MigrationAst[]
): ResolvedModelSchema {
    for (const migration of migrations) {
        let operations = migration.definition.operations.items;
        while (operations.kind === 'cons') {
            const operation: MigrationOperation = operations.head;
            if (operation.kind === 'create_table' && operation.table.value.value === table.value.value) {
                return { columns: operation.columns, indexes: operation.indexes, foreignKeys: operation.foreignKeys };
            }
            if (operation.kind === 'alter_table' && operation.table.value.value === table.value.value) {
                return { columns: operation.additions, indexes: operation.indexes, foreignKeys: operation.foreignKeys };
            }
            operations = operations.tail;
        }
    }
    throw new Error(`Model boundary violation: schema for table "${table.value.value}" was not found.`);
}
