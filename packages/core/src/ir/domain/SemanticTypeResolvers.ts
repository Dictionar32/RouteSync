/** Pure projection from the canonical SemanticType ADT to TypeIR. */
import type {
  SemanticType,
  PrimitiveType,
  JsonValueType,
  OptionalType,
  NullableType,
  NeverType,
  ErrorType,
  ReferenceType,
  UnionType,
  IntersectionType,
  ReadonlyCollectionType,
  MutableCollectionType,
  GenericType,
  ObjectType,
  ObjectProperty,
} from '../../compiler/types/SemanticType';
import type { TypeIR, PrimitiveTypeIR, ReferenceTypeIR, TypePropertyIR } from '../../types/ir';
import { TypeIRUtils } from '../../types/ir';

export const SemanticTypeResolvers = Object.freeze({
  primitive(type: PrimitiveType): TypeIR {
    return { kind: 'primitive', type: type.type, format: { kind: 'none' } };
  },
  jsonValue(_type: JsonValueType): TypeIR {
    return { kind: 'json' };
  },
  optional(type: OptionalType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return { kind: 'optional', inner: lower(type.innerType) };
  },
  nullable(type: NullableType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return { kind: 'nullable', inner: lower(type.innerType) };
  },
  never(_type: NeverType): TypeIR {
    return { kind: 'never' };
  },
  error(type: ErrorType): TypeIR {
    return { kind: 'error', diagnostic: type.diagnosticMessage };
  },
  reference(type: ReferenceType): TypeIR {
    const reference: ReferenceTypeIR = {
      kind: 'reference',
      target: type.emittedName as import('../../types/ir').CodeExpression,
      module: { kind: type.namespace.length === 0 ? 'none' : 'module', value: type.namespace as import('../../types/ir').CodeExpression },
      role: type.role,
    };
    return reference;
  },
  union(type: UnionType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return { kind: 'union', types: type.members.map(lower) };
  },
  intersection(type: IntersectionType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return { kind: 'intersection', types: type.members.map(lower) };
  },
  readonlyCollection(type: ReadonlyCollectionType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return TypeIRUtils.makeArray(lower(type.elementType));
  },
  mutableCollection(type: MutableCollectionType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return { kind: 'collection', element: lower(type.elementType) };
  },
  generic(type: GenericType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return {
      kind: 'generic',
      base: SemanticTypeResolvers.reference(type.base),
      parameters: type.parameters.map(parameter => ({
        name: parameter.name.value.value,
        variance: parameter.variance,
        type: lower(parameter.type),
      })),
    };
  },
  object(type: ObjectType, lower: (value: SemanticType) => TypeIR): TypeIR {
    return {
      kind: 'inline_object',
      properties: type.properties.map((property: ObjectProperty): TypePropertyIR => ({
        name: property.name,
        type: lower(property.type),
      })),
      additionalProperties: { kind: 'forbidden' },
    };
  },
});
