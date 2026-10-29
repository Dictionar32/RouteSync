/** Compatibility constructors backed by the canonical SemanticType ADT. */
import { responseCardinalityOperations, type ResponseCardinality } from '../upstream/response';

import {
  primitiveType,
  PrimitiveKind,
  type PrimitiveType,
  ReferenceType,
  ObjectType,
  NullableType,
  ReadonlyCollectionType,
  CollectionKind,
  UnionType,
  type SemanticType,
  type ObjectTypeDescriptorParams,
} from '../domain/semanticType';

export interface ResolvedSemanticTypeFactoryInterface {
  readonly primitive: (type: PrimitiveKind) => PrimitiveType;
  readonly resource: (resource: string, cardinality?: ResponseCardinality) => SemanticType;
  readonly model: (model: string) => ReferenceType;
  readonly object: (properties: ObjectTypeDescriptorParams['properties']) => ObjectType;
  readonly nullable: (innerType: SemanticType) => NullableType;
  readonly array: (items: SemanticType) => ReadonlyCollectionType;
  readonly union: (types: readonly SemanticType[]) => UnionType;
}

export const ResolvedSemanticTypeFactory: ResolvedSemanticTypeFactoryInterface = Object.freeze({
  primitive: (type: PrimitiveKind): PrimitiveType => primitiveType(type),
  resource: (resource: string, cardinality: ResponseCardinality = { kind: 'single' }): SemanticType => {
    const reference = ReferenceType.resource('', resource);
    return responseCardinalityOperations.continueWith(cardinality, {
      single: () => reference,
      collection: () => ReadonlyCollectionType(CollectionKind.ARRAY, reference),
    });
  },
  model: (model: string): ReferenceType => ReferenceType.model('', model),
  object: (properties: ObjectTypeDescriptorParams['properties']): ObjectType => ObjectType.create({
    name: 'InlineObject', baseName: 'InlineObject', properties, role: 'plain',
  }),
  nullable: (innerType: SemanticType): NullableType => NullableType(innerType),
  array: (items: SemanticType): ReadonlyCollectionType => ReadonlyCollectionType(CollectionKind.ARRAY, items),
  union: (types: readonly SemanticType[]): UnionType => UnionType(types),
});
