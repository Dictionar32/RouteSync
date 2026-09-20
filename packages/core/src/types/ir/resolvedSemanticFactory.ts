/** Compatibility constructors backed by the canonical SemanticType ADT. */
import {
  PrimitiveType,
  PrimitiveKind,
  ReferenceType,
  ObjectType,
  NullableType,
  ReadonlyCollectionType,
  CollectionKind,
  UnionType,
  type SemanticType,
} from '../../compiler/types/SemanticType';

export class ResolvedSemanticTypeFactory {
  static primitive(type: PrimitiveKind): PrimitiveType {
    return new PrimitiveType(type);
  }

  static resource(resource: string, cardinality: 'single' | 'collection' = 'single'): SemanticType {
    const reference = ReferenceType.resource('', resource);
    return cardinality === 'collection'
      ? new ReadonlyCollectionType(CollectionKind.ARRAY, reference)
      : reference;
  }

  static model(model: string): ReferenceType {
    return ReferenceType.model('', model);
  }

  static object(properties: ConstructorParameters<typeof ObjectType>[0]['properties']): ObjectType {
    return ObjectType.create({
      name: 'InlineObject',
      baseName: 'InlineObject',
      properties,
      role: 'plain',
    });
  }

  static nullable(innerType: SemanticType): NullableType {
    return new NullableType(innerType);
  }

  static array(items: SemanticType): ReadonlyCollectionType {
    return new ReadonlyCollectionType(CollectionKind.ARRAY, items);
  }

  static union(types: readonly SemanticType[]): UnionType {
    return UnionType.of(types);
  }
}
