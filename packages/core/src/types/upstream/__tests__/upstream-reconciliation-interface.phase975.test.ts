import { describe, expect, it } from 'vitest';
import type { SchemaInterface } from '../schema';
import type { EloquentRelationAst } from '../eloquent';
import { createTableName, createModelName, createRelationName, createClassName } from '../names';
import { schemaRelationIndexFrom } from '../schemaRelation';
import { reconcileSemanticRelation } from '../semanticReconciliation';

describe('phase975 upstream reconciliation interface', () => {
  it('matches belongsTo against the source table foreign key', () => {
    const schema = {
      kind: 'schema_ast',
      definition: {
        kind: 'schema_definition',
        tables: {
          kind: 'schema_tables',
          items: {
            kind: 'cons',
            head: {
              kind: 'schema_table',
              table: createTableName('order_details'),
              columns: { kind: 'columns', items: { kind: 'empty' } },
              indexes: { kind: 'indexes', items: { kind: 'empty' } },
              foreignKeys: {
                kind: 'foreign_keys',
                items: {
                  kind: 'cons',
                  head: {
                    kind: 'foreign_key',
                    column: { kind: 'column_name', value: { kind: 'string_value', value: 'order_id' } },
                    referencesModel: { kind: 'domain_type_name', value: { kind: 'string_value', value: 'orders' } },
                    referencesColumn: { kind: 'column_name', value: { kind: 'string_value', value: 'id' } },
                    onDelete: { kind: 'cascade' },
                    onUpdate: { kind: 'no_action' },
                    source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 1 },
                  },
                  tail: { kind: 'empty' },
                },
              },
              migrationProvenance: { kind: 'empty' },
              source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 1 },
            },
            tail: { kind: 'empty' },
          },
        },
        source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 1 },
      },
      source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 1 },
    } as SchemaInterface;
    const relation = {
      kind: 'eloquent_relation_ast',
      name: createRelationName('order'),
      sourceModel: createModelName('OrderDetail'),
      relation: { kind: 'belongs_to' },
      eloquentType: 'belongs_to',
      descriptor: { cardinality: 'one', multiplicity: 'single' },
      targetModel: createModelName('Order'),
      targetClass: createClassName('Order'),
      invocation: { kind: 'expression_literal', value: { kind: 'string_value', value: 'fixture' } },
      source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 1 },
      semanticType: { kind: 'unknown' },
      targetShape: { kind: 'single', model: createModelName('Order') },
      traversalTarget: { kind: 'model', model: createModelName('Order') },
      key: { kind: 'convention' },
    } as unknown as EloquentRelationAst;
    const semantic = { foreignKey: relation.key } as never;
    const result = reconcileSemanticRelation(relation, schemaRelationIndexFrom(schema), semantic);
    expect(result.status).toBe('matched');
    expect(result.key.kind).toBe('explicit');
  });
});
