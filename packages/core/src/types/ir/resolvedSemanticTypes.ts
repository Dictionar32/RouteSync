/**
 * Compatibility barrel only.
 * Canonical semantic type vocabulary is types/domain/semanticType.
 */
export type {
  SemanticType as ResolvedSemanticType,
  SemanticTypeVisitor as ResolvedSemanticTypeVisitor,
  PrimitiveType as PrimitiveSemanticTypeIR,
  ReferenceType as ReferenceSemanticTypeIR,
  OptionalType as OptionalSemanticTypeIR,
  NullableType as NullableSemanticTypeIR,
  UnionType as UnionSemanticTypeIR,
  IntersectionType as IntersectionSemanticTypeIR,
  ReadonlyCollectionType as ReadonlyCollectionSemanticTypeIR,
  MutableCollectionType as MutableCollectionSemanticTypeIR,
  GenericType as GenericSemanticTypeIR,
  ObjectType as ObjectSemanticTypeIR,
  JsonValueType as JsonValueSemanticTypeIR,
  NeverType as NeverSemanticTypeIR,
  ErrorType as ErrorSemanticTypeIR,
} from '../domain/semanticType';
