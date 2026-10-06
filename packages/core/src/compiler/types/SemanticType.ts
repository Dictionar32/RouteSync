/**
 * Downstream compatibility facade for the canonical domain SemanticType algebra.
 * Semantic vocabulary is owned by types/domain; compiler-specific lowering remains downstream.
 */
import type { ResourceFieldSemanticBinding } from '../../types/domain/resourceFieldSemanticBinding';
import { toCamelCase } from '../../utils/resource-naming';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';
import type { SemanticType as DomainSemanticType, ObjectProperty as DomainObjectProperty } from '../../types/domain/semanticType';
import { ScannedObjectProperty } from '../../types/domain/semanticType';

export {
  PrimitiveKind, CollectionKind, SemanticTypeKind,
  ObjectType, ReferenceType, UnionType, IntersectionType, ReadonlyCollectionType,
  MutableCollectionType, GenericType, OptionalType, NullableType, JsonValueType, NeverType,
  ErrorType, primitiveType, ScannedObjectProperty, SemanticTypeFactory
} from '../../types/domain/semanticType';
export type {
  SemanticTypeBase, PrimitiveType, GenericParameter, ScannedObjectPropertyParams,
  ObjectTypeDescriptorParams, SemanticTypeVisitor, ObjectTypeRole, GenericVariance
} from '../../types/domain/semanticType';
/** Compatibility helper retained only at the compiler boundary. */
export const ObjectProperty = Object.freeze({
  create: (params: import('../../types/domain/semanticType').ScannedObjectPropertyParams): DomainObjectProperty => ScannedObjectProperty.create(params),
  fromResourceField(field: ResourceFieldSemanticBinding): DomainObjectProperty {
    const type = SemanticTypeResolver.resolveField(field);
    return ScannedObjectProperty({
      name: SemanticValueFactory.propertyName(toCamelCase(field.name.value)),
      type,
      description: '',
      origin: { kind: 'bound_expression', bound: field.semantic.bound },
    });
  },
});

export type SemanticType = DomainSemanticType;
export type ObjectProperty = DomainObjectProperty;
