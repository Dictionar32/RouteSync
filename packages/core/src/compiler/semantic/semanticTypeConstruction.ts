/**
 * Semantic type construction operations.
 *
 * Compiler semantic operations construct domain semantic types through the existing domain factories.
 */
import {
  CollectionKind,
  SemanticTypeFactory,
  PrimitiveKind,
  ReferenceType,
  type SemanticType,
} from '../../types/domain/semanticType';
import type { ObjectProperty } from '../../types/domain/semanticType';
import type { SemanticTypeConstructionInterface } from '../../types/upstream/semanticTypeConstructionInterface';

export const semanticTypeConstruction: SemanticTypeConstructionInterface = Object.freeze({
  primitive: (kind: PrimitiveKind): SemanticType => SemanticTypeFactory.primitive(kind),
  unspecified: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.UNSPECIFIED),
  string: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.STRING),
  number: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.NUMBER),
  boolean: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.BOOLEAN),
  datetime: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.DATETIME),
  file: (): SemanticType => SemanticTypeFactory.primitive(PrimitiveKind.FILE),
  json: (): SemanticType => SemanticTypeFactory.json(),
  nullable: (inner: SemanticType): SemanticType => SemanticTypeFactory.nullable(inner),
  collection: (kind: CollectionKind, element: SemanticType): SemanticType => SemanticTypeFactory.collection(kind, element),
  resource: (namespace: string, name: string): SemanticType => ReferenceType.resource(namespace, name),
  object: (params: { readonly name: string; readonly baseName: string; readonly properties: readonly ObjectProperty[]; readonly role: 'plain' }): SemanticType => SemanticTypeFactory.object(params),
  error: (message: string): SemanticType => SemanticTypeFactory.error(message),
});
