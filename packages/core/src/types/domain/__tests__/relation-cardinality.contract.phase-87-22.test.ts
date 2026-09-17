import { describe, expect, it } from 'vitest';
import { EloquentRelationClassifier } from '../eloquentTypes';
import { ScannedModelRelationDescriptor } from '../../../compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass';

describe('relation cardinality contract phase 87.22', () => {
  it('derives collection state from canonical relation cardinality', () => {
    const relation = ScannedModelRelationDescriptor.hasMany({
      name: 'reviews',
      modelName: 'Product',
      targetModel: 'Review',
    });

    expect(relation.cardinality).toBe('many');
    expect(EloquentRelationClassifier.getDescriptor(relation.type).cardinality).toBe('many');
    expect('isCollection' in relation).toBe(false);
    expect(relation.cardinality).toBeDefined();
  });

  it('keeps target model as the relation source of semantic identity', () => {
    const relation = ScannedModelRelationDescriptor.belongsTo({
      name: 'user',
      modelName: 'Review',
      targetModel: 'User',
    });

    expect(relation.targetModel).toBe('User');
    expect(relation.cardinality).toBe('one');
  });
});
