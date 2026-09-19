/** Frozen constructors for the closed ResolvedSemanticType ADT. */
import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { ModelName, PropertyName, ResourceName, TypeExpression } from './nominalVocabulary';
import type {
  PrimitiveSemanticTypeIR, ResourceSemanticTypeIR, ModelSemanticTypeIR,
  ObjectSemanticTypeIR, ArraySemanticTypeIR, NullableSemanticTypeIR,
  UnionSemanticTypeIR, LiteralSemanticTypeIR, ObjectSemanticProperty,
  ResolvedSemanticType, SemanticBinding, SemanticFormat
} from './resolvedSemanticTypes';

const unbound: SemanticBinding = Object.freeze({ kind: 'unbound' });
const formatNone: SemanticFormat = Object.freeze({ kind: 'none' });

const formatOf = (value: TypeExpression | undefined): SemanticFormat =>
  value === undefined ? formatNone : Object.freeze({ kind: 'type_expression', value });

export class ResolvedSemanticTypeFactory {
  static primitive(type: PrimitiveKind, format?: TypeExpression): PrimitiveSemanticTypeIR {
    return Object.freeze({ kind: 'primitive', type, format: formatOf(format), binding: unbound });
  }

  static resource(resource: ResourceName, cardinality: 'single' | 'collection' = 'single'): ResourceSemanticTypeIR {
    return Object.freeze({ kind: 'resource', resource, cardinality, binding: unbound });
  }

  static model(model: ModelName): ModelSemanticTypeIR {
    return Object.freeze({ kind: 'model', model, binding: unbound });
  }

  static object(properties: readonly ObjectSemanticProperty[]): ObjectSemanticTypeIR {
    return Object.freeze({ kind: 'object', properties: Object.freeze([...properties]), binding: unbound });
  }

  static nullable(innerType: ResolvedSemanticType): NullableSemanticTypeIR {
    return Object.freeze({ kind: 'nullable', innerType, binding: unbound });
  }

  static array(items: ResolvedSemanticType): ArraySemanticTypeIR {
    return Object.freeze({ kind: 'array', items, binding: unbound });
  }

  static union(types: readonly ResolvedSemanticType[]): UnionSemanticTypeIR {
    return Object.freeze({ kind: 'union', types: Object.freeze([...types]), binding: unbound });
  }

  static literal(value: string | number | boolean): LiteralSemanticTypeIR {
    return Object.freeze({ kind: 'literal', value, binding: unbound });
  }
}
