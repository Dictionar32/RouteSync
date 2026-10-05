import type { MigrationAst } from '../../../types/upstream/ast';
import type { SchemaAst, SchemaDefinition, SchemaProducer, SchemaProducerInput, SchemaTable } from '../../../types/upstream/schema';
import type { MigrationOperation } from '../../../types/upstream/migration';
import type { ColumnDefinition, ForeignKey, IndexDefinition } from '../../../types/upstream/databaseVocabulary';
import type { Columns, ForeignKeys, Indexes, MigrationAsts, Sequence } from '../../../types/upstream/collections';
import type { TableName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
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

const migrationsFromInput = (migrations: MigrationAsts): readonly MigrationAst[] => {
    const scanned = relationSome(migrations.items);
    return relationOptionFold(
        scanned,
        () => [],
        item => relationGate(
            relationEqual(item.result.kind, 'discovered_empty'),
            () => [],
            () => sequenceArray(item.result.items),
        ),
    );
};

type TableState = {
    readonly table: TableName;
    readonly columns: readonly ColumnDefinition[];
    readonly indexes: readonly IndexDefinition[];
    readonly foreignKeys: readonly ForeignKey[];
    readonly sourceMigrations: readonly MigrationAst[];
    readonly source: SourceSpan;
};

const addColumns = (existing: readonly ColumnDefinition[], additions: Columns): readonly ColumnDefinition[] =>
    [...existing, ...sequenceArray(additions.items)];

const addIndexes = (existing: readonly IndexDefinition[], additions: Indexes): readonly IndexDefinition[] =>
    [...existing, ...sequenceArray(additions.items)];

const addForeignKeys = (existing: readonly ForeignKey[], additions: ForeignKeys): readonly ForeignKey[] =>
    [...existing, ...sequenceArray(additions.items)];

const sameTable = (left: TableName, right: TableName): boolean => relationEqual(left.value.value, right.value.value);

const createState = (operation: Extract<MigrationOperation, { kind: 'create_table' }>, migration: MigrationAst): TableState => ({
    table: operation.table,
    columns: sequenceArray(operation.columns.items),
    indexes: sequenceArray(operation.indexes.items),
    foreignKeys: sequenceArray(operation.foreignKeys.items),
    sourceMigrations: [migration],
    source: migration.source,
});

const alterState = (state: TableState, operation: Extract<MigrationOperation, { kind: 'alter_table' }>, migration: MigrationAst): TableState => ({
    ...state,
    columns: addColumns(state.columns, operation.additions),
    indexes: addIndexes(state.indexes, operation.indexes),
    foreignKeys: addForeignKeys(state.foreignKeys, operation.foreignKeys),
    sourceMigrations: [...state.sourceMigrations, migration],
});

const applyOperation = (states: readonly TableState[], operation: MigrationOperation, migration: MigrationAst): readonly TableState[] => {
    const createCandidate: RelationOption<readonly TableState[]> = relationGate(
        relationEqual(operation.kind, 'create_table'),
        () => relationSome([...states, createState(operation, migration)]),
        () => ({ kind: 'none' }),
    );
    const alterCandidate: RelationOption<readonly TableState[]> = relationGate(
        relationEqual(operation.kind, 'alter_table'),
        () => relationSome(relationProject(states, state => relationGate(sameTable(state.table, operation.table), () => alterState(state, operation, migration), () => state))),
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

const applyMigrations = (migrations: readonly MigrationAst[]): readonly TableState[] => relationFold(
    migrations,
    [],
    (states, migration) => relationFold(
        sequenceArray(migration.definition.operations.items),
        states,
        (current, operation) => applyOperation(current, operation, migration),
    ),
);



const toSchemaTable = (state: TableState): SchemaTable => ({
    kind: 'schema_table',
    table: state.table,
    columns: { kind: 'columns', items: sequence(state.columns) },
    indexes: { kind: 'indexes', items: sequence(state.indexes) },
    foreignKeys: { kind: 'foreign_keys', items: sequence(state.foreignKeys) },
    sourceMigrations: sequence(state.sourceMigrations),
    source: state.source,
});

const toSchemaDefinition = (tables: readonly TableState[], source: SourceSpan): SchemaDefinition => ({
    kind: 'schema_definition',
    tables: { kind: 'schema_tables', items: sequence(relationProject(tables, toSchemaTable)) },
    source,
});

const produceSchema = (input: SchemaProducerInput): SchemaAst => {
    const migrations = migrationsFromInput(input.migrations);
    const tables = applyMigrations(migrations);
    return {
        kind: 'schema_ast',
        definition: toSchemaDefinition(tables, input.projectSource),
        source: input.projectSource,
    };
};

export const schemaProducer: SchemaProducer = Object.freeze({ produce: produceSchema });
