import type { CollectionKind, ObjectProperty, PrimitiveKind, SemanticType } from '../domain/semanticType';

/** Existing domain semantic-type constructors exposed as one typed operation contract. */
export interface SemanticTypeConstructionInterface {
  readonly primitive: (kind: PrimitiveKind) => SemanticType;
  readonly unspecified: () => SemanticType;
  readonly string: () => SemanticType;
  readonly number: () => SemanticType;
  readonly boolean: () => SemanticType;
  readonly datetime: () => SemanticType;
  readonly file: () => SemanticType;
  readonly json: () => SemanticType;
  readonly nullable: (inner: SemanticType) => SemanticType;
  readonly collection: (kind: CollectionKind, element: SemanticType) => SemanticType;
  readonly resource: (namespace: string, name: string) => SemanticType;
  readonly object: (params: { readonly name: string; readonly baseName: string; readonly properties: readonly ObjectProperty[]; readonly role: 'plain' }) => SemanticType;
  readonly error: (message: string) => SemanticType;
}
