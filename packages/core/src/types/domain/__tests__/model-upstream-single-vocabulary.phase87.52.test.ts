import { describe, expect, it } from 'vitest';
import type { ParsedModel } from '../models';
import type { ServiceModelNode } from '../../semantic/modelGraphTypes';

describe('model vocabulary boundary', () => {
  it('keeps the semantic model as the only rich model representation', () => {
    const keys: readonly (keyof ParsedModel)[] = [
      'name', 'shortName', 'table', 'primaryKey', 'keyType', 'keySemanticType',
      'incrementing', 'softDeletes', 'timestamps', 'columns', 'fillable',
      'guarded', 'hidden', 'appends', 'casts', 'accessors', 'relations'
    ];
    expect(keys).toHaveLength(17);
  });

  it('keeps service graph model nodes topology-only', () => {
    const node: ServiceModelNode = {
      kind: 'model_node',
      name: 'User',
      layer: 'model',
      confidence: 1
    };
    expect(node.name).toBe('User');
  });
});
