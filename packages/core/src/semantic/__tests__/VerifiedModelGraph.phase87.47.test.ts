import { describe, expect, it } from 'vitest';
import { PrimitiveKind, PrimitiveType } from '../../compiler/types/SemanticType';
import { verifyModelGraph } from '../VerifiedModelGraph';
import type { ParsedModel } from '../../types/domain/models';
import { createColumnName, createModelName, createPropertyName, createTableName } from '../../types/domain/modelValueFactories';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import type { ModelNodeInput } from '../modelNodes';

function model(): ParsedModel {
  return {
    name: createModelName('User'),
    shortName: createModelName('User'),
    table: createTableName('users'),
    primaryKey: createColumnName('id'),
    keyType: 'int',
    keySemanticType: { kind: 'number' },
    incrementing: true,
    softDeletes: false,
    timestamps: true,
    properties: [],
    columns: [{
      name: SemanticValueFactory.columnName('id'),
      propertyName: SemanticValueFactory.propertyName('id'),
      type: { kind: 'integer' },
      nullability: { kind: 'non_nullable' },
      semanticType: new PrimitiveType(PrimitiveKind.NUMBER),
    }],
    fillable: [createPropertyName('name')],
    guarded: [],
    hidden: [],
    appends: [],
    casts: [],
    accessors: [],
    relations: [],
  };
}

describe('Phase 87.47 high-model boundary', () => {
  it('accepts only a typed ParsedModel plus explicit resolution state', () => {
    const input: ModelNodeInput = { model: model(), assignments: [] };
    const graph = verifyModelGraph({ models: [input] });

    expect(graph.models[0].name.value).toBe('User');
    expect(graph.models[0].columns).toHaveLength(1);
    expect(graph.models[0].assignments).toHaveLength(0);
  });

  it('freezes the verified graph container', () => {
    const graph = verifyModelGraph({ models: [{ model: model(), assignments: [] }] });
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.models)).toBe(true);
    expect(Object.isFrozen(graph.models[0].assignments)).toBe(true);
  });
});
