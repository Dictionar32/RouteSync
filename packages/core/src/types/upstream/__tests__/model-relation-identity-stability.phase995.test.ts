import { describe, expect, it } from 'vitest';
import { createClassName, createModelName, createRelationName, createTableName } from '../names';
import type { EloquentRelationAst } from '../eloquent';
import type { SchemaInterface } from '../schema';
import { schemaRelationIndexFrom } from '../schemaRelation';
import { reconcileSemanticRelation } from '../semanticReconciliation';
import { modelSemanticRelationIdentityKey } from '../model';

const span = { kind: 'source_span' as const, file: { kind: 'source_file' as const, value: 'fixture' }, start: 0, end: 1 };
const stringValue = (value: string) => ({ kind: 'string_value' as const, value });

const relation = (key: EloquentRelationAst['key']): EloquentRelationAst => ({
  kind: 'eloquent_relation_ast',
  name: createRelationName('order'),
  sourceModel: createModelName('OrderDetail'),
  relation: { kind: 'belongs_to' },
  eloquentType: { kind: 'belongs_to' },
  descriptor: { type: { kind: 'belongs_to' }, relation: { kind: 'belongs_to' }, cardinality: { kind: 'one' }, polymorphism: { kind: 'non_polymorphic' } },
  targetModel: createModelName('Order'),
  targetClass: createClassName('Order'),
  invocation: { kind: 'literal', value: stringValue('Order') } as never,
  source: span,
  semanticType: { kind: 'primitive', type: 'string' } as never,
  targetShape: { kind: 'model' } as never,
  traversalTarget: { kind: 'model', model: createModelName('Order') } as never,
  key,
});

const semantic = (key: EloquentRelationAst['key']) => ({
  kind: 'relation' as const,
  identity: {
    kind: 'model_semantic_relation_identity' as const,
    sourceModel: createModelName('OrderDetail'),
    property: createRelationName('order') as never,
    relation: createRelationName('order'),
    targetModel: createModelName('Order'),
    eloquentType: { kind: 'belongs_to' as const },
    foreignKey: key,
  },
  property: createRelationName('order') as never,
  relation: createRelationName('order'),
  sourceModel: createModelName('OrderDetail'),
  eloquentType: { kind: 'belongs_to' as const },
  targetModel: createModelName('Order'),
  cardinality: { kind: 'one' as const },
  multiplicity: { kind: 'single' as const },
  targetShape: { kind: 'model' } as never,
  traversalTarget: { kind: 'model', model: createModelName('Order') } as never,
  boundCardinality: { kind: 'single' as const },
  resourceCardinality: { kind: 'single' as const },
  foreignKey: key,
  semanticType: { kind: 'primitive', type: 'string' } as never,
  source: span,
  traversal: { kind: 'relation' as const, targetModel: createModelName('Order'), eloquentType: { kind: 'belongs_to' as const }, cardinality: { kind: 'one' as const }, multiplicity: { kind: 'single' as const }, targetShape: { kind: 'model' } as never, traversalTarget: { kind: 'model', model: createModelName('Order') } as never, semanticType: { kind: 'primitive', type: 'string' } as never },
});


const reverseRelation = (
  relationKind: 'has_many' | 'has_one',
  eloquentType: 'has_many' | 'has_one',
  name: string,
  key: EloquentRelationAst['key'],
): EloquentRelationAst => ({
  kind: 'eloquent_relation_ast',
  name: createRelationName(name),
  sourceModel: createModelName('Order'),
  relation: { kind: relationKind },
  eloquentType: { kind: eloquentType },
  descriptor: { type: { kind: eloquentType }, relation: { kind: relationKind }, cardinality: { kind: eloquentType === 'has_many' ? 'many' : 'one' }, polymorphism: { kind: 'non_polymorphic' } },
  targetModel: createModelName('OrderDetail'),
  targetClass: createClassName('OrderDetail'),
  invocation: { kind: 'literal', value: stringValue('OrderDetail') } as never,
  source: span,
  semanticType: { kind: 'primitive', type: 'string' } as never,
  targetShape: { kind: eloquentType === 'has_many' ? 'collection' : 'model' } as never,
  traversalTarget: { kind: eloquentType === 'has_many' ? 'collection' : 'model', model: createModelName('OrderDetail') } as never,
  key,
});

const reverseSemantic = (
  relationKind: 'has_many' | 'has_one',
  eloquentType: 'has_many' | 'has_one',
  name: string,
  key: EloquentRelationAst['key'],
) => ({
  kind: 'relation' as const,
  identity: {
    kind: 'model_semantic_relation_identity' as const,
    sourceModel: createModelName('Order'),
    property: createRelationName(name) as never,
    relation: createRelationName(name),
    targetModel: createModelName('OrderDetail'),
    eloquentType: { kind: eloquentType },
    foreignKey: key,
  },
  property: createRelationName(name) as never,
  relation: createRelationName(name),
  sourceModel: createModelName('Order'),
  eloquentType: { kind: eloquentType },
  targetModel: createModelName('OrderDetail'),
  cardinality: { kind: eloquentType === 'has_many' ? 'many' : 'one' },
  multiplicity: { kind: eloquentType === 'has_many' ? 'collection' : 'single' },
  targetShape: { kind: eloquentType === 'has_many' ? 'collection' : 'model', model: createModelName('OrderDetail') } as never,
  traversalTarget: { kind: eloquentType === 'has_many' ? 'collection' : 'model', model: createModelName('OrderDetail') } as never,
  boundCardinality: { kind: eloquentType === 'has_many' ? 'collection' : 'single' },
  resourceCardinality: { kind: eloquentType === 'has_many' ? 'collection' : 'single' },
  foreignKey: key,
  semanticType: { kind: 'primitive', type: 'string' } as never,
  source: span,
  traversal: { kind: 'relation' as const, targetModel: createModelName('OrderDetail'), eloquentType: { kind: eloquentType }, cardinality: { kind: eloquentType === 'has_many' ? 'many' : 'one' }, multiplicity: { kind: eloquentType === 'has_many' ? 'collection' : 'single' }, targetShape: { kind: eloquentType === 'has_many' ? 'collection' : 'model', model: createModelName('OrderDetail') } as never, traversalTarget: { kind: eloquentType === 'has_many' ? 'collection' : 'model', model: createModelName('OrderDetail') } as never, semanticType: { kind: 'primitive', type: 'string' } as never },
});

const schema = (): SchemaInterface => ({
  kind: 'schema_interface',
  definition: {
    kind: 'schema_definition',
    tables: {
      kind: 'schema_tables',
      items: {
        kind: 'cons',
        head: {
          kind: 'schema_table',
          table: createTableName('order_details'),
          columns: { kind: 'columns', items: { kind: 'cons', head: { kind: 'column', name: { kind: 'column_name', value: stringValue('id') }, databaseType: { kind: 'integer', width: { kind: 'big' }, signed: { kind: 'truth_value', value: false } }, semanticType: { kind: 'number' }, presence: { kind: 'required' }, nullability: { kind: 'non_nullable' }, default: { kind: 'none' }, primary: { kind: 'truth_value', value: true }, autoGenerated: { kind: 'truth_value', value: true }, source: span }, tail: { kind: 'empty' } } },
          indexes: { kind: 'indexes', items: { kind: 'empty' } },
          foreignKeys: {
            kind: 'foreign_keys',
            items: {
              kind: 'cons',
              head: {
                kind: 'foreign_key',
                column: { kind: 'column_name', value: stringValue('order_id') },
                referencesModel: { kind: 'domain_type_name', value: stringValue('orders') },
                referencesColumn: { kind: 'column_name', value: stringValue('id') },
                onDelete: { kind: 'cascade' },
                onUpdate: { kind: 'no_action' },
                source: span,
              },
              tail: { kind: 'empty' },
            },
          },
          migrationProvenance: { kind: 'empty' },
          source: span,
        },
        tail: {
          kind: 'cons',
          head: {
            kind: 'schema_table',
            table: createTableName('orders'),
            columns: { kind: 'columns', items: { kind: 'cons', head: { kind: 'column', name: { kind: 'column_name', value: stringValue('id') }, databaseType: { kind: 'integer', width: { kind: 'big' }, signed: { kind: 'truth_value', value: false } }, semanticType: { kind: 'number' }, presence: { kind: 'required' }, nullability: { kind: 'non_nullable' }, default: { kind: 'none' }, primary: { kind: 'truth_value', value: true }, autoGenerated: { kind: 'truth_value', value: true }, source: span }, tail: { kind: 'empty' } } },
            indexes: { kind: 'indexes', items: { kind: 'empty' } },
            foreignKeys: { kind: 'foreign_keys', items: { kind: 'empty' } },
            migrationProvenance: { kind: 'empty' },
            source: span,
          },
          tail: { kind: 'empty' },
        },
      },
    },
    source: span,
  },
  source: span,
  closed: true,
});

describe('phase995 model relation identity stability', () => {
  it('canonicalizes convention and explicit foreign keys to the same semantic identity', () => {
    const index = schemaRelationIndexFrom(schema());
    const convention = relation({ kind: 'convention' });
    const explicit = relation({
      kind: 'explicit',
      foreign: { kind: 'column_name', value: stringValue('order_id') },
      local: { kind: 'column_name', value: stringValue('id') },
    });

    const conventionResult = reconcileSemanticRelation(convention, index, semantic(convention.key));
    const explicitResult = reconcileSemanticRelation(explicit, index, semantic(explicit.key));

    expect(conventionResult.status).toBe('matched');
    expect(explicitResult.status).toBe('matched');
    expect(conventionResult.semantic.foreignKey).toEqual(explicitResult.semantic.foreignKey);
    expect(modelSemanticRelationIdentityKey(conventionResult.semantic.identity))
      .toBe(modelSemanticRelationIdentityKey(explicitResult.semantic.identity));
    expect(conventionResult.semantic.identity.foreignKey.kind).toBe('explicit');
  });


  it('reconciles both hasMany and hasOne convention keys through the same schema FK', () => {
    const index = schemaRelationIndexFrom(schema());
    const convention = { kind: 'convention' } as const;
    for (const [relationKind, eloquentType, name] of [
      ['has_many', 'has_many', 'details'],
      ['has_one', 'has_one', 'detail'],
    ] as const) {
      const result = reconcileSemanticRelation(
        reverseRelation(relationKind, eloquentType, name, convention),
        index,
        reverseSemantic(relationKind, eloquentType, name, convention),
      );
      expect(result.status).toBe('matched');
      expect(result.semantic.foreignKey.kind).toBe('explicit');
      expect(result.semantic.identity.foreignKey.kind).toBe('explicit');
      expect(modelSemanticRelationIdentityKey(result.semantic.identity)).toContain('order_id:id');
    }
  });
});
