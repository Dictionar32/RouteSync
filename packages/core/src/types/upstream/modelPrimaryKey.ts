import type { ColumnName, TableName } from './names';
import type { ModelKeyOrigin } from './model';
import type { SchemaRelationIndexInterface } from './schemaRelation';

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

const sequenceItems = (value: Sequence<ColumnName>): readonly ColumnName[] => {
  switch (value.kind) {
    case 'empty': return Object.freeze([]);
    case 'cons': return Object.freeze([value.head, ...sequenceItems(value.tail)]);
    default: return value satisfies never;
  }
};

const primaryKeysOf = (
  schema: SchemaRelationIndexInterface,
  table: TableName,
): readonly ColumnName[] => {
  const relation = schema.table(table);
  if (relation === undefined) return Object.freeze([]);
  return sequenceItems(relation.primaryColumns);
};

const statusOf = (
  schemaPrimaryKeys: readonly ColumnName[],
  modelPrimaryKey: ColumnName,
): ModelPrimaryKeyReconciliationStatus => {
  if (schemaPrimaryKeys.length === 0) return 'unresolved';
  if (schemaPrimaryKeys.length > 1) return 'ambiguous';
  const schemaPrimaryKey = schemaPrimaryKeys[0];
  if (schemaPrimaryKey === undefined) return 'unresolved';
  if (schemaPrimaryKey.value.value === modelPrimaryKey.value.value) return 'matched';
  return 'conflict';
};

/**
 * Reconcile against the canonical schema-relation index. Table identity and
 * primary-column selection are already established by SchemaRelationIndex;
 * this judgment consumes that contract instead of repeating table/column
 * classification over the raw SchemaInterface.
 */
export interface ModelPrimaryKeyReconciliationOperationInterface {
  (
    schema: SchemaRelationIndexInterface,
    table: TableName,
    modelPrimaryKey: ColumnName,
    modelPrimaryKeyOrigin: ModelKeyOrigin,
  ): ModelPrimaryKeyReconciliationInterface;
}

export const reconcileModelPrimaryKey: ModelPrimaryKeyReconciliationOperationInterface = (
  schema,
  table,
  modelPrimaryKey,
  modelPrimaryKeyOrigin,
) => {
  const schemaPrimaryKeys = primaryKeysOf(schema, table);
  return Object.freeze({
    kind: 'model_primary_key_reconciliation',
    table,
    modelPrimaryKey,
    modelPrimaryKeyOrigin,
    schemaPrimaryKeys,
    status: statusOf(schemaPrimaryKeys, modelPrimaryKey),
    closed: true,
  });
};
