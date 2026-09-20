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

    expect(binding.kind).toBe('found');
    if (binding.kind !== 'found') throw new Error('expected found property binding');
    expect(binding.value.kind).toBe('relation');
    expect(binding.value.propertyName).toBe('reviews');
    expect(binding.value.source.targetModel).toBe('ProductReview');
    expect(binding.value.source.cardinality).toBe('many');
    expect(binding.value.semanticType).toEqual(
      new ReadonlyCollectionType(
        CollectionKind.ARRAY,
        new ReferenceType('', 'ProductReview')
      )
    );
    expect('type' in binding.value).toBe(false);
    expect('nullable' in binding.value).toBe(false);
    expect('cast' in binding.value).toBe(false);
  });
});
