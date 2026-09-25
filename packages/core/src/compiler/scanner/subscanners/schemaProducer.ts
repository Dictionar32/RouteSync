import type { MigrationAst } from '../../../types/upstream/ast';
import type { SchemaAst, SchemaDefinition, SchemaProducer, SchemaProducerInput, SchemaTable } from '../../../types/upstream/schema';
import type { MigrationOperation } from '../../../types/upstream/migration';
import type { ColumnDefinition, ForeignKey, IndexDefinition } from '../../../types/upstream/databaseVocabulary';
import type { Columns, ForeignKeys, Indexes, MigrationAsts, Sequence } from '../../../types/upstream/collections';
import type { TableName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
    (tail, item) => ({ kind: 'cons', head: item, tail }),
    { kind: 'empty' },
);

const sequenceArray = <T>(items: Sequence<T>): readonly T[] => {
    const result: T[] = [];
    let cursor = items;
    while (cursor.kind === 'cons') {
        result.push(cursor.head);
        cursor = cursor.tail;
    }
    return result;
};

const migrationsFromInput = (migrations: MigrationAsts): readonly MigrationAst[] => {
    if (migrations.items.kind === 'not_scanned') return [];
    if (migrations.items.result.kind === 'discovered_empty') return [];
    return sequenceArray(migrations.items.result.items);
};

type TableState = {
    readonly table: TableName;
    readonly columns: readonly ColumnDefinition[];
    readonly indexes: readonly IndexDefinition[];
    readonly foreignKeys: readonly ForeignKey[];
    readonly sourceMigrations: readonly MigrationAst[];
    readonly source: SourceSpan;
};

const addColumns = (existing: readonly ColumnDefinition[], additions: Columns): readonly ColumnDefinition[] => [
    ...existing,
    ...sequenceArray(additions.items),
];

const addIndexes = (existing: readonly IndexDefinition[], additions: Indexes): readonly IndexDefinition[] => [
    ...existing,
    ...sequenceArray(additions.items),
];

const addForeignKeys = (existing: readonly ForeignKey[], additions: ForeignKeys): readonly ForeignKey[] => [
    ...existing,
    ...sequenceArray(additions.items),
];

const sameTable = (left: TableName, right: TableName): boolean => left.value.value === right.value.value;

const applyOperation = (states: readonly TableState[], operation: MigrationOperation, migration: MigrationAst): readonly TableState[] => {
    switch (operation.kind) {
        case 'create_table':
            return [
                ...states,
                {
                    table: operation.table,
                    columns: sequenceArray(operation.columns.items),
                    indexes: sequenceArray(operation.indexes.items),
                    foreignKeys: sequenceArray(operation.foreignKeys.items),
                    sourceMigrations: [migration],
                    source: migration.source,
                },
            ];
        case 'alter_table':
            return states.map(state => sameTable(state.table, operation.table)
                ? {
                    ...state,
                    columns: addColumns(state.columns, operation.additions),
                    indexes: addIndexes(state.indexes, operation.indexes),
                    foreignKeys: addForeignKeys(state.foreignKeys, operation.foreignKeys),
                    sourceMigrations: [...state.sourceMigrations, migration],
                }
                : state);
        case 'drop_table':
            return states.filter(state => !sameTable(state.table, operation.table));
        case 'raw':
            return states;
    }
};

const applyMigrations = (migrations: readonly MigrationAst[]): readonly TableState[] => {
    let states: readonly TableState[] = [];
    for (const migration of migrations) {
        const operations = sequenceArray(migration.definition.operations.items);
        for (const operation of operations) states = applyOperation(states, operation, migration);
    }
    return states;
};

const tableAst = (state: TableState): SchemaTable => ({
    kind: 'schema_table',
    table: state.table,
    columns: { kind: 'columns', items: sequence(state.columns) },
    indexes: { kind: 'indexes', items: sequence(state.indexes) },
    foreignKeys: { kind: 'foreign_keys', items: sequence(state.foreignKeys) },
    sourceMigrations: sequence(state.sourceMigrations),
    source: state.source,
});

export const schemaProducer: SchemaProducer = {
    produce: (input: SchemaProducerInput): SchemaAst => {
        const migrations = migrationsFromInput(input.migrations);
        const states = applyMigrations(migrations);
        const tables = states.map(tableAst);
        const source = input.projectSource;
        const definition: SchemaDefinition = {
            kind: 'schema_definition',
            tables: { kind: 'schema_tables', items: sequence(tables) },
            source,
        };
        return { kind: 'schema_ast', definition, source };
    },
};
