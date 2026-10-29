import type { EloquentRelationAst } from './eloquent';
import type {
  RelationApplicability,
  RelationReconciliationStatus,
  SemanticReconciliationAlgebraInterface,
  SemanticReconciliationEvidence,
} from './semanticReconciliation';
import type { RelationKey } from './model';
import type { ForeignKey } from './databaseVocabulary';
import type { TableName } from './names';
import { createTableName } from './names';
import { inferLaravelTableName } from '../../utils/resource-naming';
import { schemaForeignKeyEvidence, type SchemaForeignKeyEvidence, type SchemaRelationInterface } from './schemaRelation';

const items = <T>(value: import('./collections').Sequence<T>, output: readonly T[] = []): readonly T[] =>
  value.kind === 'empty' ? output : items(value.tail, [...output, value.head]);

const modelTable = (model: string): TableName => createTableName(inferLaravelTableName(model));

const primaryColumns = (table: SchemaRelationInterface | undefined): readonly string[] =>
  table === undefined ? [] : items(table.primaryColumns).map(column => column.value.value);

const conventionForeignColumn = (model: string): string =>
  model.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() + '_id';

const relationApplicability = (relation: EloquentRelationAst): RelationApplicability => {
  switch (relation.relation.kind) {
    case 'belongs_to':
    case 'has_many':
    case 'has_one':
      return { kind: 'direct_foreign_key', relationKind: relation.relation.kind };
    default:
      return { kind: 'unsupported_relation', relationKind: relation.relation.kind };
  }
};

const keyColumns = (relation: EloquentRelationAst): { readonly foreign: string; readonly local?: string } => {
  switch (relation.key.kind) {
    case 'explicit':
      return { foreign: relation.key.foreign.value.value, local: relation.key.local.value.value };
    case 'explicit_foreign':
      return { foreign: relation.key.foreign.value.value };
    case 'convention':
    case 'not_applicable':
      return { foreign: conventionForeignColumn(relation.relation.kind === 'belongs_to'
        ? relation.targetModel.value.value
        : relation.sourceModel.value.value) };
  }
};

const candidates = (evidence: SemanticReconciliationEvidence): readonly ForeignKey[] => {
  const { relation, schema, applicability } = evidence;
  if (applicability.kind === 'unsupported_relation') return [];
  const sourceTable = modelTable(relation.sourceModel.value.value);
  const targetTable = modelTable(relation.targetModel.value.value);
  const belongsTo = applicability.relationKind === 'belongs_to';
  const foreignKeyTable = schema.table(belongsTo ? sourceTable : targetTable);
  const foreignKeys = foreignKeyTable === undefined ? [] : items(foreignKeyTable.foreignKeys);
  const key = keyColumns(relation);
  const referencedTable = belongsTo ? targetTable : sourceTable;
  const referencedPrimaryColumns = primaryColumns(schema.table(referencedTable));
  return relationSelect(foreignKeys, foreignKey =>
    foreignKey.referencesModel.value.value === referencedTable.value.value &&
    foreignKey.column.value.value === key.foreign &&
    (key.local === undefined
      ? referencedPrimaryColumns.includes(foreignKey.referencesColumn.value.value)
      : foreignKey.referencesColumn.value.value === key.local)
  );
};

const canonicalKey = (evidence: SemanticReconciliationEvidence, matches: readonly ForeignKey[]): RelationKey => {
  const match = matches.length === 1 ? matches[0] : undefined;
  return match === undefined
    ? evidence.relation.key
    : { kind: 'explicit', foreign: match.column, local: match.referencesColumn };
};

const status = (
  evidence: SemanticReconciliationEvidence,
  matches: readonly ForeignKey[],
): RelationReconciliationStatus => {
  const { applicability, relation } = evidence;
  if (applicability.kind === 'unsupported_relation') return 'not_applicable';
  if (matches.length === 1) return 'matched';
  if (matches.length > 1) return 'ambiguous';
  return relation.key.kind === 'explicit' || relation.key.kind === 'explicit_foreign'
    ? 'conflict'
    : 'eloquent_only';
};

const effectiveKey = (
  evidence: SemanticReconciliationEvidence,
  resultStatus: RelationReconciliationStatus,
  resolvedKey: RelationKey,
): RelationKey => resultStatus === 'matched' ? resolvedKey : evidence.relation.key;

const evidenceFor = (
  evidence: SemanticReconciliationEvidence,
  matches: readonly ForeignKey[],
): readonly SchemaForeignKeyEvidence[] => {
  const { applicability } = evidence;
  if (applicability.kind === 'unsupported_relation') return [];
  const sourceTable = modelTable(evidence.relation.sourceModel.value.value);
  const targetTable = modelTable(evidence.relation.targetModel.value.value);
  const table = evidence.schema.table(applicability.relationKind === 'belongs_to' ? sourceTable : targetTable);
  return matches.flatMap(match => table === undefined ? [] : [schemaForeignKeyEvidence(table, match)]);
};

export const semanticReconciliationAlgebra: SemanticReconciliationAlgebraInterface = Object.freeze({
  applicability: relationApplicability,
  candidates,
  canonicalKey,
  status,
  effectiveKey,
  schemaEvidence: evidenceFor,
});
