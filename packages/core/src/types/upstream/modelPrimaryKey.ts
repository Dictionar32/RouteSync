import type { ColumnName, TableName } from './names';
import type { ModelKeyOrigin } from './model';
import type { SchemaInterface, SchemaTable } from './schema';

export type ModelPrimaryKeyReconciliationStatus =
  | 'matched'
  | 'conflict'
  | 'unresolved'
  | 'ambiguous';

/**
 * Closed semantic judgment connecting the model's declared/default primary key
 * to structural schema primary-key evidence. This is not runtime dataflow.
 */
export interface ModelPrimaryKeyReconciliationInterface {
  readonly kind: 'model_primary_key_reconciliation';
  readonly table: TableName;
  readonly modelPrimaryKey: ColumnName;
  readonly modelPrimaryKeyOrigin: ModelKeyOrigin;
  readonly schemaPrimaryKeys: readonly ColumnName[];
  readonly status: ModelPrimaryKeyReconciliationStatus;
  readonly closed: true;
}

const items = <T>(value: import('./collections').Sequence<T>, output: readonly T[] = []): readonly T[] =>
  value.kind === 'empty' ? output : items(value.tail, [...output, value.head]);

const tableFor = (schema: SchemaInterface, table: TableName): SchemaTable | undefined =>
  items(schema.definition.tables.items).find(candidate => candidate.table.value.value === table.value.value);

const primaryKeysOf = (table: SchemaTable | undefined): readonly ColumnName[] =>
  table === undefined
    ? []
    : items(table.columns.items)
      .filter(column => column.primary.value)
      .map(column => column.name);

export const reconcileModelPrimaryKey = (
  schema: SchemaInterface,
  table: TableName,
  modelPrimaryKey: ColumnName,
  modelPrimaryKeyOrigin: ModelKeyOrigin,
): ModelPrimaryKeyReconciliationInterface => {
  const schemaPrimaryKeys = primaryKeysOf(tableFor(schema, table));
  const status: ModelPrimaryKeyReconciliationStatus =
    schemaPrimaryKeys.length === 0
      ? 'unresolved'
      : schemaPrimaryKeys.length > 1
        ? 'ambiguous'
        : schemaPrimaryKeys[0].value.value === modelPrimaryKey.value.value
          ? 'matched'
          : 'conflict';
  return Object.freeze({
    kind: 'model_primary_key_reconciliation',
    table,
    modelPrimaryKey,
    modelPrimaryKeyOrigin,
    schemaPrimaryKeys: Object.freeze([...schemaPrimaryKeys]),
    status,
    closed: true,
  });
};
