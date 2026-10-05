/**
 * Canonical migration-column boundary. Schema discovery is expressed as a
 * recursive relation over migration and operation evidence.
 */
import type { Columns, Indexes, ForeignKeys } from '../../../../types/upstream/collections';
import type { MigrationAst } from '../../../../types/upstream/ast';
import type { MigrationOperation } from '../../../../types/upstream/migration';
import type { TableName } from '../../../../types/upstream/names';
import { relationEqual, relationGate } from '../../../../semantic/foundation/semanticRelations';
import { relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/foundation/relationalSequence';

type SchemaWitness = {
    readonly columns: Columns;
    readonly indexes: Indexes;
    readonly foreignKeys: ForeignKeys;
};

const operationWitness = (table: TableName, operation: MigrationOperation): RelationOption<SchemaWitness> =>
    relationGate(
        relationEqual(operation.kind, 'create_table'),
        () => relationGate(
            relationEqual(operation.table.value.value, table.value.value),
            () => relationSome({ columns: operation.columns, indexes: operation.indexes, foreignKeys: operation.foreignKeys }),
            relationNone<SchemaWitness>,
        ),
        () => relationGate(
            relationEqual(operation.kind, 'alter_table'),
            () => relationGate(
                relationEqual(operation.table.value.value, table.value.value),
                () => relationSome({ columns: operation.additions, indexes: operation.indexes, foreignKeys: operation.foreignKeys }),
                relationNone<SchemaWitness>,
            ),
            relationNone<SchemaWitness>,
        ),
    );

const operationsWitness = (table: TableName, operations: MigrationAst['definition']['operations']['items']): RelationOption<SchemaWitness> =>
    relationGate(
        relationEqual(operations.kind, 'cons'),
        () => {
            const head = operationWitness(table, operations.head);
            return relationGate(
                relationEqual(head.kind, 'some'),
                () => head,
                () => operationsWitness(table, operations.tail),
            );
        },
        relationNone<SchemaWitness>,
    );

const schemaWitness = (table: TableName, migrations: readonly MigrationAst[], index = 0): RelationOption<SchemaWitness> =>
    relationGate(
        relationEqual(index, migrations.length),
        () => relationNone<SchemaWitness>,
        () => {
            const witness = operationsWitness(table, migrations[index].definition.operations.items);
            return relationGate(
                relationEqual(witness.kind, 'some'),
                () => witness,
                () => schemaWitness(table, migrations, index + 1),
            );
        },
    );

const requireSchema = (table: TableName, migrations: readonly MigrationAst[]): SchemaWitness =>
    relationOptionFold(
        schemaWitness(table, migrations),
        () => {
            throw Error(`Model boundary violation: schema associated with table "${table.value.value}" was not found.`);
        },
        witness => witness,
    );

export function resolveModelColumns(
    table: TableName,
    migrations: readonly MigrationAst[],
): Columns {
    return requireSchema(table, migrations).columns;
}

export type ResolvedModelSchema = { readonly columns: Columns; readonly indexes: Indexes; readonly foreignKeys: ForeignKeys };

export function resolveModelSchema(
    table: TableName,
    migrations: readonly MigrationAst[],
): ResolvedModelSchema {
    const witness = requireSchema(table, migrations);
    return { columns: witness.columns, indexes: witness.indexes, foreignKeys: witness.foreignKeys };
}
