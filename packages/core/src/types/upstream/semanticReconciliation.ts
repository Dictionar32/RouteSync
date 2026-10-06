import type { EloquentRelationAst } from './eloquent';
import { modelSemanticRelationIdentityOf, type ModelSemanticRelation, type RelationKey } from './model';
import { schemaForeignKeyEvidence, type SchemaRelationIndexInterface, type SchemaForeignKeyEvidence } from './schemaRelation';
import type { ForeignKey } from './databaseVocabulary';
import type { TableName } from './names';
import { createTableName } from './names';
import { inferLaravelTableName } from '../../utils/resource-naming';
import { relationSelect } from '../../semantic/foundation/relationalSequence';

export type RelationReconciliationStatus =
  | 'matched'
  | 'schema_only'
  | 'eloquent_only'
  | 'ambiguous'
  | 'conflict'
  | 'not_applicable';

export interface SemanticRelationReconciliationInterface {
  readonly kind: 'semantic_relation_reconciliation';
  readonly relation: EloquentRelationAst;
  readonly status: RelationReconciliationStatus;
  readonly key: RelationKey;
  readonly semantic: ModelSemanticRelation;
  readonly schemaEvidence: readonly SchemaForeignKeyEvidence[];
  readonly closed: true;
}

export type SemanticRelationReconciler = (
  relation: EloquentRelationAst,
  schema: SchemaRelationIndexInterface,
  semantic: ModelSemanticRelation,
) => SemanticRelationReconciliationInterface;

const items = <T>(value: import('./collections').Sequence<T>, output: readonly T[] = []): readonly T[] =>
  value.kind === 'empty' ? output : items(value.tail, [...output, value.head]);

const modelTable = (model: string): TableName => createTableName(inferLaravelTableName(model));

const primaryColumns = (table: import('./schema').SchemaTable | undefined): readonly string[] =>
  table === undefined ? [] : items(table.columns.items).filter(column => column.primary.value).map(column => column.name.value.value);

const conventionForeignColumn = (model: string): string =>
  model.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() + '_id';

const candidatesFor = (
  relation: EloquentRelationAst,
  schema: SchemaRelationIndexInterface,
): readonly ForeignKey[] => {
  const sourceTable = modelTable(relation.sourceModel.value.value);
  const targetTable = modelTable(relation.targetModel.value.value);
  if (relation.relation.kind === 'belongs_to') {
    const table = schema.table(sourceTable);
    const foreignKeys = table ? items(table.foreignKeys) : [];
    const foreign = relation.key.kind === 'explicit' || relation.key.kind === 'explicit_foreign'
      ? relation.key.foreign.value.value
      : conventionForeignColumn(relation.targetModel.value.value);
    const local = relation.key.kind === 'explicit'
      ? relation.key.local.value.value
      : undefined;
    const targetPrimaryColumns = primaryColumns(schema.table(targetTable));
    return relationSelect(foreignKeys, fk =>
      fk.referencesModel.value.value === targetTable.value.value &&
      fk.column.value.value === foreign &&
      (local === undefined
        ? targetPrimaryColumns.includes(fk.referencesColumn.value.value)
        : fk.referencesColumn.value.value === local)
    );
  }
  if (relation.relation.kind === 'has_many' || relation.relation.kind === 'has_one') {
    const table = schema.table(targetTable);
    const foreignKeys = table ? items(table.foreignKeys) : [];
    const foreign = relation.key.kind === 'explicit' || relation.key.kind === 'explicit_foreign'
      ? relation.key.foreign.value.value
      : conventionForeignColumn(relation.sourceModel.value.value);
    const local = relation.key.kind === 'explicit'
      ? relation.key.local.value.value
      : undefined;
    const sourcePrimaryColumns = primaryColumns(schema.table(sourceTable));
    return relationSelect(foreignKeys, fk =>
      fk.referencesModel.value.value === sourceTable.value.value &&
      fk.column.value.value === foreign &&
      (local === undefined
        ? sourcePrimaryColumns.includes(fk.referencesColumn.value.value)
        : fk.referencesColumn.value.value === local)
    );
  }
  return [];
};

const canonicalKey = (relation: EloquentRelationAst, matches: readonly ForeignKey[]): RelationKey => {
  if (matches.length !== 1) return relation.key;
  return { kind: 'explicit', foreign: matches[0].column, local: matches[0].referencesColumn };
};

export const reconcileSemanticRelation: SemanticRelationReconciler = (relation, schema, semantic) => {
  const matches = candidatesFor(relation, schema);
  const key = canonicalKey(relation, matches);
  const sourceTable = modelTable(relation.sourceModel.value.value);
  const targetTable = modelTable(relation.targetModel.value.value);
  const evidenceTable = relation.relation.kind === 'belongs_to' ? schema.table(sourceTable) : schema.table(targetTable);
  const schemaEvidence = matches.map(match => evidenceTable === undefined ? undefined : schemaForeignKeyEvidence(evidenceTable, match)).filter((value): value is SchemaForeignKeyEvidence => value !== undefined);
  const supportedDirectForeignKeyRelation =
    relation.relation.kind === 'belongs_to' ||
    relation.relation.kind === 'has_many' ||
    relation.relation.kind === 'has_one';
  const status: RelationReconciliationStatus =
    !supportedDirectForeignKeyRelation ? 'not_applicable' :
    matches.length === 1 ? 'matched' :
    matches.length > 1 ? 'ambiguous' :
    relation.key.kind === 'explicit' || relation.key.kind === 'explicit_foreign' ? 'conflict' :
    'eloquent_only';
  const semanticKey = status === 'matched' ? key : relation.key;
  return Object.freeze({
    kind: 'semantic_relation_reconciliation' as const,
    relation,
    status,
    key: semanticKey,
    semantic: Object.freeze({
      ...semantic,
      foreignKey: semanticKey,
      identity: modelSemanticRelationIdentityOf({
        ...semantic,
        foreignKey: semanticKey,
      }),
      ...(schemaEvidence.length === 1 ? { provenance: Object.freeze({
        kind: 'model_relation_provenance' as const,
        relationSource: relation.source,
        schema: schemaEvidence[0],
      }) } : {}),
    }),
    schemaEvidence: Object.freeze(schemaEvidence),
    closed: true as const,
  });
};
