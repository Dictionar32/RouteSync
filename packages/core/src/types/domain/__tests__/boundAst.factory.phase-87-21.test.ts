import { describe, expect, it } from 'vitest';
import {
  BoundSemanticFactory,
  matchBoundSemanticNode,
  type BoundSemanticNode,
} from '../boundAst';
import { PrimitiveKind, PrimitiveType } from '../../../compiler/types/SemanticType';

describe('BoundSemanticFactory contract phase 87.24', () => {
  it('creates a semantic primitive node without raw semantic payloads', () => {
    const node = BoundSemanticFactory.primitive(
      new PrimitiveType(PrimitiveKind.NUMBER),
      { kind: 'number', value: 7 },
    );

    expect(node.kind).toBe('bound_primitive');
    expect(node.semanticType.kind).toBe('primitive');
    expect(node.value).toEqual({ kind: 'number', value: 7 });
  });

  it('creates a relation with explicit cardinality and nullability ADTs', () => {
    const node = BoundSemanticFactory.relation({
      sourceModel: 'Product',
      relationName: 'reviews',
      relationType: 'hasMany',
      targetModel: 'ProductReview',
      cardinality: { kind: 'collection' },
      nullable: false,
    });

    expect(node.cardinality).toEqual({ kind: 'collection' });
    expect(node.nullability).toEqual({ kind: 'non_nullable' });
    expect(node.targetModel).toEqual({ kind: 'model_name', value: 'ProductReview' });
  });

  it('keeps the public matcher alias pointed at the exhaustive matcher', () => {
    const node: BoundSemanticNode = BoundSemanticFactory.unsupported('unresolved_property');
    const result = matchBoundSemanticNode(node, {
      bound_primitive: () => 'primitive',
      bound_model_column: () => 'column',
      bound_relation: () => 'relation',
      bound_property_chain: () => 'chain',
      bound_conditional: () => 'conditional',
      bound_binary: () => 'binary',
      bound_ternary: () => 'ternary',
      bound_method_call: () => 'method',
      bound_query_projection: () => 'projection',
      bound_projection_field: () => 'projection-field',
      bound_unsupported: () => 'unsupported',
    });

    expect(result).toBe('unsupported');
  });
});
