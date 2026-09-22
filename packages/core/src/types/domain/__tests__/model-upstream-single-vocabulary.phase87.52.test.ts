import { describe, expect, it } from 'vitest';
import type { ModelSemanticDefinition } from '../models';
import type { ServiceModelNode } from '../../semantic/modelGraphTypes';
import { SemanticValueFactory } from '../semanticValues';
import { buildModelSemanticDefinition } from '../../../compiler/scanner/descriptors/model/entity/modelDescriptorClass';

describe('model vocabulary boundary', () => {
  it('keeps the semantic model as the only rich model representation', () => {
    const keys: readonly (keyof ModelSemanticDefinition)[] = [
      'identity', 'key', 'behavior', 'exposure', 'surface'
    ];
    expect(keys).toHaveLength(5);
  });

  it('keeps service graph model nodes topology-only', () => {
    const model = buildModelSemanticDefinition({ identity: { name: { kind: 'model_name', value: { kind: 'string_value', value: 'User' } }, shortName: { kind: 'model_name', value: { kind: 'string_value', value: 'User' } }, table: { kind: 'table_name', value: { kind: 'string_value', value: 'users' } }, primaryKey: { kind: 'column_name', value: { kind: 'string_value', value: 'id' } } }, key: { type: { kind: 'integer' }, semanticType: { kind: 'number' } }, behavior: { incrementing: true, softDeletes: false, timestamps: true }, exposure: { fillable: [], guarded: [], hidden: [], appends: [] }, columns: [], columnFacts: [], casts: [], accessors: [], relations: [] });
    const node: ServiceModelNode = { kind: 'model_node', model, layer: 'model' };
    expect(node.model.identity.name.value).toBe('User');
  });
});

import { buildModelSemanticDefinition } from '../../../compiler/scanner/descriptors/model/entity/modelDescriptorClass';
import { ScannedModelRelationDescriptor } from '../../../compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass';
import { EloquentRelationType } from '../eloquentTypes';

const productParams = {
  name: SemanticValueFactory.modelName('Product'),
  shortName: SemanticValueFactory.modelName('Product'),
  table: SemanticValueFactory.tableName('products'),
  primaryKey: SemanticValueFactory.columnName('id'),
  keyType: 'int' as const,
  keySemanticType: { kind: 'number' as const },
  incrementing: true, softDeletes: false, timestamps: true,
  columns: [], columnFacts: [], fillable: [], guarded: [], hidden: [], appends: [], casts: [], accessors: [], relations: []
};

describe('high model semantic surface', () => {
  it('publishes a complete indexed semantic surface instead of requiring downstream reclassification', () => {
    const relation = ScannedModelRelationDescriptor.hasMany({
      name: 'reviews',
      modelName: 'Product',
      targetModel: 'ProductReview'
    });
    const model = buildModelSemanticDefinition({ ...productParams, relations: [relation] });

    const property = model.surface.byName.get(SemanticValueFactory.propertyName('reviews'));
    expect(property?.kind).toBe('relation');
    if (property?.kind !== 'relation') return;
    expect(property.semanticType).toBe(relation.semanticType);
    expect(property.targetModel.value).toBe('ProductReview');
    expect(property.multiplicity).toEqual({ kind: 'collection' });
    expect(model.surface.properties).toHaveLength(1);
    expect(EloquentRelationType.HasMany).toBe(relation.type);
  });
});
