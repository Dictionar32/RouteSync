import type { ForeignKey } from './databaseVocabulary';
import type { SchemaInterface, SchemaTable } from './schema';
import type { ColumnName, DomainTypeName, TableName } from './names';
import type { Sequence } from './collections';
import type { MigrationProvenance, SourceSpan } from './provenance';

export type SchemaForeignKeyEvidence = Readonly<{
  readonly kind: 'schema_foreign_key_evidence';
  readonly foreignKey: ForeignKey;
  readonly tableSource: SourceSpan;
  readonly migrationProvenance: readonly MigrationProvenance[];
}>;

export interface SchemaRelationInterface {
  readonly kind: 'schema_relation_interface';
  readonly table: TableName;
  readonly source: SourceSpan;
  readonly foreignKeys: Sequence<ForeignKey>;
  readonly migrationProvenance: Sequence<MigrationProvenance>;
  readonly findByColumn: (column: ColumnName) => Sequence<ForeignKey>;
  readonly findToTable: (table: TableName) => Sequence<ForeignKey>;
  readonly closed: true;
}

export interface SchemaRelationIndexInterface {
  readonly kind: 'schema_relation_index_interface';
  readonly tables: Sequence<SchemaRelationInterface>;
  readonly table: (table: TableName) => SchemaRelationInterface | undefined;
  readonly incoming: (table: TableName) => Sequence<ForeignKey>;
  readonly closed: true;
}

const items = <T>(value: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  value.kind === 'empty' ? output : items(value.tail, [...output, value.head]);

const sequence = <T>(values: readonly T[], index = 0): Sequence<T> =>
  index < values.length ? { kind: 'cons', head: values[index], tail: sequence(values, index + 1) } : { kind: 'empty' };

export const schemaRelationIndexFrom = (schema: SchemaInterface): SchemaRelationIndexInterface => {
  const tables = items(schema.definition.tables.items).map((table: SchemaTable): SchemaRelationInterface => Object.freeze({
    kind: 'schema_relation_interface' as const,
    table: table.table,
    source: table.source,
    foreignKeys: table.foreignKeys,
    migrationProvenance: table.migrationProvenance,
    findByColumn: column => sequence(items(table.foreignKeys).filter(foreignKey => foreignKey.column.value.value === column.value.value)),
    findToTable: target => sequence(items(table.foreignKeys).filter(foreignKey => foreignKey.referencesModel.value.value === target.value.value)),
    closed: true as const,
  }));
  const incoming = (target: TableName): Sequence<ForeignKey> => sequence(tables.flatMap(table => items(table.findToTable(target))));
  return Object.freeze({
    kind: 'schema_relation_index_interface' as const,
    tables: sequence(tables),
    table: table => tables.find(candidate => candidate.table.value.value === table.value.value),
    incoming,
    closed: true as const,
  });
};

export const schemaForeignKeyEvidence = (relation: SchemaRelationInterface, foreignKey: ForeignKey): SchemaForeignKeyEvidence => Object.freeze({
  kind: 'schema_foreign_key_evidence',
  foreignKey,
  tableSource: relation.source,
  migrationProvenance: Object.freeze(foreignKey.migrationProvenance === undefined ? items(relation.migrationProvenance) : [foreignKey.migrationProvenance]),
});

export type SchemaRelationTarget = { readonly table: TableName; readonly model: DomainTypeName };
