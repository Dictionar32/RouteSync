import type { MigrationInterface } from '../../../types/upstream/migrationInterface';
import type { SchemaInterface, SchemaDefinition, SchemaProducer, SchemaProducerInput, SchemaTable } from '../../../types/upstream/schema';
import type { MigrationOperation } from '../../../types/upstream/migration';
import type { ColumnDefinition, ForeignKey, IndexDefinition } from '../../../types/upstream/databaseVocabulary';
import type { Columns, ForeignKeys, Indexes, Sequence } from '../../../types/upstream/collections';
import type { TableName } from '../../../types/upstream/names';
import { numberValue } from '../../../types/upstream/valueObjects';
import type { MigrationProvenance, SourceSpan } from '../../../types/upstream/provenance';
import { relationEqual, relationFold, relationGate, relationOptionFold, relationProject, relationSelect, relationSome, type RelationOption } from '../../../semantic/foundation/relationalSequence';

const sequence = <T>(items: readonly T[]): Sequence<T> => {
    const build = (index: number): Sequence<T> => relationGate(
        index < items.length,
        () => ({ kind: 'cons', head: items[index], tail: build(index + 1) }),
        () => ({ kind: 'empty' }),
    );
    return build(0);
};

const sequenceArray = <T>(items: Sequence<T>): readonly T[] => {
    const collect = (cursor: Sequence<T>, output: readonly T[]): readonly T[] => relationGate(
        relationEqual(cursor.kind, 'cons'),
        () => collect(cursor.tail, [...output, cursor.head]),
        () => output,
    );
    return collect(items, []);
};

const migrationsFromInput = (migrations: readonly MigrationInterface[]): readonly MigrationInterface[] => migrations;

type TableState = {
    readonly table: TableName;
    readonly columns: readonly ColumnDefinition[];
    readonly indexes: readonly IndexDefinition[];
    readonly foreignKeys: readonly ForeignKey[];
    readonly migrationProvenance: readonly MigrationProvenance[];
    readonly source: SourceSpan;
};

const addColumns = (existing: readonly ColumnDefinition[], additions: Columns): readonly ColumnDefinition[] =>
    [...existing, ...sequenceArray(additions.items)];

const addIndexes = (existing: readonly IndexDefinition[], additions: Indexes): readonly IndexDefinition[] =>
    [...existing, ...sequenceArray(additions.items)];

const addForeignKeys = (existing: readonly ForeignKey[], additions: ForeignKeys, provenance: MigrationProvenance): readonly ForeignKey[] =>
    [...existing, ...sequenceArray(additions.items).map(foreignKey => ({ ...foreignKey, migrationProvenance: provenance }))];

const migrationProvenance = (migration: MigrationInterface, operation: MigrationOperation, index: number): MigrationProvenance => Object.freeze({
    kind: 'migration_provenance',
    source: migration.source,
    operation: Object.freeze({
        kind: 'migration_operation_provenance',
        operation: operation.kind,
        ...(operation.kind === 'raw' ? {} : { table: operation.table }),
        index: numberValue(index),
    }),
});

const sameTable = (left: TableName, right: TableName): boolean => relationEqual(left.value.value, right.value.value);

const createState = (operation: Extract<MigrationOperation, { kind: 'create_table' }>, migration: MigrationInterface, provenance: MigrationProvenance): TableState => ({
    table: operation.table,
    columns: sequenceArray(operation.columns.items),
    indexes: sequenceArray(operation.indexes.items),
    foreignKeys: addForeignKeys([], operation.foreignKeys, provenance),
    migrationProvenance: [provenance],
    source: migration.source,
});

const alterState = (state: TableState, operation: Extract<MigrationOperation, { kind: 'alter_table' }>, provenance: MigrationProvenance): TableState => ({
    ...state,
    columns: addColumns(state.columns, operation.additions),
    indexes: addIndexes(state.indexes, operation.indexes),
    foreignKeys: addForeignKeys(state.foreignKeys, operation.foreignKeys, provenance),
    migrationProvenance: [...state.migrationProvenance, provenance],
});

const applyOperation = (states: readonly TableState[], operation: MigrationOperation, migration: MigrationInterface, index: number): readonly TableState[] => {
    const provenance = migrationProvenance(migration, operation, index);
    const createCandidate: RelationOption<readonly TableState[]> = relationGate(
        relationEqual(operation.kind, 'create_table'),
        () => relationSome([...states, createState(operation, migration, provenance)]),
        () => ({ kind: 'none' }),
    );
    const alterCandidate: RelationOption<readonly TableState[]> = relationGate(
        relationEqual(operation.kind, 'alter_table'),
        () => relationSome(relationProject(states, state => relationGate(sameTable(state.table, operation.table), () => alterState(state, operation, provenance), () => state))),
        () => ({ kind: 'none' }),
    );
    const dropCandidate: RelationOption<readonly TableState[]> = relationGate(
        relationEqual(operation.kind, 'drop_table'),
        () => relationSome(relationSelect(states, state => relationGate(sameTable(state.table, operation.table), () => false, () => true))),
        () => ({ kind: 'none' }),
    );
    const drop = relationOptionFold(dropCandidate, () => states, value => relationProject(value, state => state));
    const altered = relationOptionFold(alterCandidate, () => drop, value => value);
    return relationOptionFold(createCandidate, () => altered, value => value);
};

const applyOperations = (states: readonly TableState[], migration: MigrationInterface, operations: readonly MigrationOperation[], index = 0): readonly TableState[] =>
    index < operations.length
        ? applyOperations(applyOperation(states, operations[index], migration, index), migration, operations, index + 1)
        : states;

const applyMigrations = (migrations: readonly MigrationInterface[]): readonly TableState[] => relationFold(
    migrations,
    [],
    (states, migration) => applyOperations(states, migration, sequenceArray(migration.definition.operations.items)),
);



const toSchemaTable = (state: TableState): SchemaTable => ({
    kind: 'schema_table',
    table: state.table,
    columns: { kind: 'columns', items: sequence(state.columns) },
    indexes: { kind: 'indexes', items: sequence(state.indexes) },
    foreignKeys: { kind: 'foreign_keys', items: sequence(state.foreignKeys) },
    migrationProvenance: sequence(state.migrationProvenance),
    source: state.source,
});

const toSchemaDefinition = (tables: readonly TableState[], source: SourceSpan): SchemaDefinition => ({
    kind: 'schema_definition',
    tables: { kind: 'schema_tables', items: sequence(relationProject(tables, toSchemaTable)) },
    source,
});

const produceSchema = (input: SchemaProducerInput): SchemaInterface => {
    const migrations = migrationsFromInput(input.migrations);
    const tables = applyMigrations(migrations);
    return Object.freeze({
        kind: 'schema_interface' as const,
        definition: toSchemaDefinition(tables, input.projectSource),
        source: input.projectSource,
        closed: true as const,
    });
};

export const schemaProducer: SchemaProducer = Object.freeze({ produce: produceSchema });
