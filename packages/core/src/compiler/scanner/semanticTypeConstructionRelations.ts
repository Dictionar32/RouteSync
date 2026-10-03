/**
 * Scanner semantic-type construction catalog.
 *
 * Scanner code asks for semantic type facts through this relation boundary.
 * The legacy class representation is kept behind the projection boundary so
 * scanner syntax interpretation does not own semantic constructors.
 */
import {
  CollectionKind,
  SemanticTypeFactory,
  PrimitiveKind,
  ReferenceType,
  type SemanticType,
} from '../types/SemanticType';
import type { ObjectProperty } from '../types/SemanticType';

export const scannerSemanticType = Object.freeze({
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
