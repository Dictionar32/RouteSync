import type { ClassName, ColumnName, MethodName, ModelName, PropertyName, RelationName } from './names';
import type { NumberValue, StringValue } from './valueObjects';
import type { Presence } from './primitiveVocabulary';
import type { Properties, Sequence } from './collections';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { Expression } from './expression';

export type PropertyOrigin =
  | { readonly kind: 'database_attribute'; readonly column: ColumnName }
  | { readonly kind: 'relation_attribute'; readonly relation: RelationName }
  | { readonly kind: 'cast_attribute'; readonly column: ColumnName }
  | {
      readonly kind: 'accessor';
      readonly method: MethodName;
      readonly backing: AccessorBacking;
    }
  | { readonly kind: 'computed'; readonly method: MethodName };

export type AccessorBacking =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly column: ColumnName };

export type PropertyVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' }
  | { readonly kind: 'implicit' };

/**
 * Valid PHP property storage combinations only.
 * PHP does not permit readonly static properties, so the interface must not
 * represent that impossible state as two independent fields.
 */
export type PropertyStorage =
  | { readonly kind: 'instance_mutable' }
  | { readonly kind: 'instance_readonly' }
  | { readonly kind: 'static_mutable' }
  | { readonly kind: 'dynamic' };

export type PropertyType =
  | { readonly kind: 'typed'; readonly value: TypeExpression }
  | { readonly kind: 'untyped' };

export type PropertyInitialization =
  | { readonly kind: 'not_applicable' }
  | { readonly kind: 'uninitialized' }
  | { readonly kind: 'default_value'; readonly value: Expression };

export type PropertyPromotion =
  | { readonly kind: 'declared' }
  | {
      readonly kind: 'constructor_promoted';
      readonly constructor: MethodName;
      /** Default belongs to the promoted constructor parameter, not the property declaration. */
      readonly parameterDefault:
        | { readonly kind: 'absent' }
        | { readonly kind: 'present'; readonly value: Expression };
    };

export type PropertyAccess =
  | { readonly kind: 'readable' }
  | { readonly kind: 'writable' }
  | { readonly kind: 'read_write' };

export type PropertyInputOrigin =
  | { readonly kind: 'validated_input' };

export type CastBuiltin =
  | { readonly kind: 'array' }
  | { readonly kind: 'as_fluent' }
  | { readonly kind: 'as_stringable' }
  | { readonly kind: 'as_uri' }
  | { readonly kind: 'as_vector' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'date' }
  | { readonly kind: 'datetime' }
  | { readonly kind: 'immutable_date' }
  | { readonly kind: 'immutable_datetime' }
  | { readonly kind: 'decimal' }
  | { readonly kind: 'double' }
  | { readonly kind: 'encrypted' }
  | { readonly kind: 'encrypted_array' }
  | { readonly kind: 'encrypted_collection' }
  | { readonly kind: 'encrypted_object' }
  | { readonly kind: 'float' }
  | { readonly kind: 'hashed' }
  | { readonly kind: 'integer' }
  | { readonly kind: 'object' }
  | { readonly kind: 'real' }
  | { readonly kind: 'string' }
  | { readonly kind: 'timestamp' };

export type CastClassRole =
  | { readonly kind: 'framework_cast' }
  | { readonly kind: 'custom_cast' };

export type CastParameterValue =
  | { readonly kind: 'text'; readonly value: StringValue }
  | { readonly kind: 'number'; readonly value: NumberValue }
  | { readonly kind: 'class'; readonly value: ClassName };

export type CastParameter = {
  readonly kind: 'cast_parameter';
  readonly value: CastParameterValue;
};

export type CastParameters = {
  readonly kind: 'cast_parameters';
  readonly items: Sequence<CastParameter>;
};

export type CastSpecification =
  | { readonly kind: 'builtin'; readonly type: CastBuiltin; readonly parameters: CastParameters }
  | { readonly kind: 'enum'; readonly name: ClassName; readonly parameters: CastParameters }
  | { readonly kind: 'class'; readonly name: ClassName; readonly role: CastClassRole; readonly parameters: CastParameters }
  | { readonly kind: 'value_object'; readonly name: ClassName; readonly parameters: CastParameters }
  | { readonly kind: 'inbound'; readonly name: ClassName; readonly parameters: CastParameters }
  | { readonly kind: 'castable'; readonly name: ClassName; readonly parameters: CastParameters };

export type CastDefinition = {
  readonly kind: 'cast_definition';
  readonly property: PropertyName;
  readonly specification: CastSpecification;
  readonly source: SourceSpan;
};

export type PropertyCasting =
  | { readonly kind: 'not_casted' }
  | { readonly kind: 'casted'; readonly definition: CastDefinition };

export type ModelConfigurationProperty =
  | { readonly kind: 'table' }
  | { readonly kind: 'fillable' }
  | { readonly kind: 'hidden' }
  | { readonly kind: 'visible' }
  | { readonly kind: 'guarded' }
  | { readonly kind: 'casts' }
  | { readonly kind: 'appends' };

export type ClassPropertyRole =
  | { readonly kind: 'ordinary' }
  | { readonly kind: 'dto_field' }
  | { readonly kind: 'attribute_constructor_parameter' }
  | { readonly kind: 'resource_configuration' }
  | { readonly kind: 'model_configuration'; readonly setting: ModelConfigurationProperty };

export type PropertyDocumentation =
  | { readonly kind: 'absent' }
  | { readonly kind: 'phpdoc'; readonly declaredType: TypeExpression; readonly model: ModelName };

export type PropertyDeclaration =
  | { readonly kind: 'model_attribute'; readonly model: ModelName; readonly origin: PropertyOrigin }
  | { readonly kind: 'documented_model_property'; readonly model: ModelName }
  | { readonly kind: 'relation_property'; readonly model: ModelName; readonly relation: RelationName }
  | { readonly kind: 'resource_projection' }
  | { readonly kind: 'request_input'; readonly origin: PropertyInputOrigin }
  | { readonly kind: 'class_property'; readonly owner: ClassName; readonly role: ClassPropertyRole };

export type PropertyDefinition = {
  readonly kind: 'property';
  readonly name: PropertyName;
  readonly type: PropertyType;
  readonly presence: Presence;
  readonly declaration: PropertyDeclaration;
  readonly documentation: PropertyDocumentation;
  readonly visibility: PropertyVisibility;
  readonly storage: PropertyStorage;
  readonly initialization: PropertyInitialization;
  readonly promotion: PropertyPromotion;
  readonly access: PropertyAccess;
  readonly casting: PropertyCasting;
  readonly source: SourceSpan;
};

export type PropertyAst = {
  readonly kind: 'property_ast';
  readonly definition: PropertyDefinition;
  readonly source: SourceSpan;
};

export type PropertySurface = {
  readonly kind: 'property_surface';
  readonly properties: Properties;
};
