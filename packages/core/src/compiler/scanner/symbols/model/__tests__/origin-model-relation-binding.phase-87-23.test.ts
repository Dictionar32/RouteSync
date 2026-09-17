import { describe, expect, it } from 'vitest';
import { OriginModelSymbol } from '../originModelSymbol';
import { ReferenceType, ReadonlyCollectionType, CollectionKind } from '../../../../types/SemanticType';

describe('OriginModelSymbol relation binding phase 87.23', () => {
  it('carries canonical relation type and cardinality without isCollection', () => {
    const symbol = new OriginModelSymbol({
      name: 'Product',
      shortName: 'Product',
      columns: [],
      casts: [],
      accessors: [],
      relations: [
        {
          name: 'reviews',
          type: 'hasMany',
          targetModel: 'ProductReview',
          cardinality: 'many',
          foreignKey: { kind: 'convention' },
        },
      ],
    } as never);

    const binding = symbol.resolveProperty('reviews');

    expect(binding?.kind).toBe('relation');
    expect(binding?.propertyName).toBe('reviews');
    expect(binding?.source.targetModel).toBe('ProductReview');
    expect(binding?.source.cardinality).toBe('many');
    expect(binding?.semanticType).toEqual(
      new ReadonlyCollectionType(
        CollectionKind.ARRAY,
        new ReferenceType('', 'ProductReview')
      )
    );
    expect(binding && 'type' in binding).toBe(false);
    expect(binding && 'nullable' in binding).toBe(false);
    expect(binding && 'cast' in binding).toBe(false);
  });
});
