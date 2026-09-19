import { describe, expect, it } from 'vitest';
import type { ParsedModel } from '../models';
import type { ServiceModelNode } from '../../semantic/modelGraphTypes';
import { SemanticValueFactory } from '../semanticValues';
import { ScannedModelDescriptor } from '../../../compiler/scanner/descriptors/model/entity/modelDescriptorClass';

describe('model vocabulary boundary', () => {
  it('keeps the semantic model as the only rich model representation', () => {
    const keys: readonly (keyof ParsedModel)[] = [
      'name', 'shortName', 'table', 'primaryKey', 'keyType', 'keySemanticType',
      'incrementing', 'softDeletes', 'timestamps', 'columns', 'fillable',
      'guarded', 'hidden', 'appends', 'casts', 'accessors', 'relations', 'semantic'
    ];
    expect(keys).toHaveLength(17);
  });

  it('keeps service graph model nodes topology-only', () => {
    const model = ScannedModelDescriptor.create({ name: 'User', table: 'users' }).semantic;
    const node: ServiceModelNode = { kind: 'model_node', model, layer: 'model' };
    expect(node.model.identity.name.value).toBe('User');
  });
});

import { ScannedModelDescriptor } from '../../../compiler/scanner/descriptors/model/entity/modelDescriptorClass';
import { ScannedModelRelationDescriptor } from '../../../compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass';
import { EloquentRelationType } from '../eloquentTypes';

describe('high model semantic surface', () => {
  it('publishes a complete indexed semantic surface instead of requiring downstream reclassification', () => {
    const relation = ScannedModelRelationDescriptor.hasMany({
      name: 'reviews',
      modelName: 'Product',
      targetModel: 'ProductReview'
    });
    const model = ScannedModelDescriptor.create({
      name: 'Product',
      table: 'products',
      relations: [relation]
    });

    const property = model.semantic.surface.byName.get(SemanticValueFactory.propertyName('reviews'));
    expect(property?.kind).toBe('relation');
    if (property?.kind !== 'relation') return;
    expect(property.semanticType).toBe(relation.semanticType);
    expect(property.targetModel.value).toBe('ProductReview');
    expect(property.multiplicity).toEqual({ kind: 'collection' });
    expect(model.semantic.surface.properties).toHaveLength(1);
    expect(EloquentRelationType.HasMany).toBe(relation.type);
  });
});
