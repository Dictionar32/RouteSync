/** Compatibility constructors backed by the canonical SemanticType ADT. */
import type { ResponseCardinality } from '../upstream/response';

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
import { relationResolve } from '../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../semantic/foundation/semanticRelations';

export const ResolvedSemanticTypeFactory = Object.freeze({
  primitive: (type: PrimitiveKind): PrimitiveType => primitiveType(type),
  resource: (resource: string, cardinality: ResponseCardinality = { kind: 'single' }): SemanticType => {
    const reference = ReferenceType.resource('', resource);
    return relationResolve(relationEqual(cardinality.kind, 'collection'),
      () => ReadonlyCollectionType(CollectionKind.ARRAY, reference),
      () => reference);
  },
  model: (model: string): ReferenceType => ReferenceType.model('', model),
  object: (properties: ObjectTypeDescriptorParams['properties']): ObjectType => ObjectType.create({
    name: 'InlineObject', baseName: 'InlineObject', properties, role: 'plain',
  }),
  nullable: (innerType: SemanticType): NullableType => NullableType(innerType),
  array: (items: SemanticType): ReadonlyCollectionType => ReadonlyCollectionType(CollectionKind.ARRAY, items),
  union: (types: readonly SemanticType[]): UnionType => UnionType(types),
});
