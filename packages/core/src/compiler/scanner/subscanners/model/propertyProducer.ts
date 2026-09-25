import type { PhpClassPropertyAst, PhpPropertyTypeAst } from '../../lexer';
import type { ClassName, ColumnName, ModelName, RelationName } from '../../../../types/upstream/names';
import type { PropertyAst, PropertyDeclaration, PropertyDefinition, PropertyType, PropertyVisibility, PropertyStorage, PropertyInitialization, PropertyPromotion, PropertyAccess, PropertyCasting, PropertyDocumentation } from '../../../../types/upstream/property';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { PrimitiveVocabulary } from '../../../../types/upstream/primitiveVocabulary';
import type { Expression } from '../../../../types/upstream/expression';
import { createPropertyName } from '../../../../types/upstream/names';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';

export type PropertyProducerContext =
    | { readonly kind: 'model_attribute'; readonly model: ModelName; readonly column: ColumnName }
    | { readonly kind: 'relation_attribute'; readonly model: ModelName; readonly relation: RelationName }
    | { readonly kind: 'class_property'; readonly owner: ClassName; readonly declaration: PropertyDeclaration };

export type PropertyProducerInput = {
    readonly property: PhpClassPropertyAst;
    readonly context: PropertyProducerContext;
    readonly source: SourceSpan;
};

export interface PropertyProducer {
    produce(input: PropertyProducerInput): PropertyAst;
}

const primitiveType = (name: string): TypeExpression => {
    switch (name) {
        case 'string': return { kind: 'primitive', value: { kind: 'string' } };
        case 'int':
        case 'integer':
        case 'float': return { kind: 'primitive', value: { kind: 'number' } };
        case 'bool':
        case 'boolean': return { kind: 'primitive', value: { kind: 'boolean' } };
        case 'array': return { kind: 'primitive', value: { kind: 'json' } };
        case 'mixed': return { kind: 'primitive', value: { kind: 'unspecified' } };
        default: return { kind: 'error', diagnostic: { kind: 'string_value', value: `unsupported_php_property_type:${name}` } };
    }
};

const propertyType = (type: PhpPropertyTypeAst): PropertyType => {
    if (type.kind === 'untyped') return { kind: 'untyped' };
    return { kind: 'typed', value: primitiveType(type.value) };
};

const visibility = (value: PhpClassPropertyAst['visibility']): PropertyVisibility => ({ kind: value });

const storage = (value: PhpClassPropertyAst['storage'], mutability: PhpClassPropertyAst['mutability']): PropertyStorage => {
    if (value === 'static') return { kind: 'static_mutable' };
    if (mutability === 'readonly') return { kind: 'instance_readonly' };
    return { kind: 'instance_mutable' };
};

const expression = (value: import('../../lexer').PhpAstValue, source: SourceSpan): Expression =>
    mapResourcePhpAstToUpstream(value, source.file.value.value);

const initialization = (value: PhpClassPropertyAst['initialization'], source: SourceSpan): PropertyInitialization => {
    if (value.kind === 'absent') return { kind: 'uninitialized' };
    return { kind: 'default_value', value: expression(value.value, source) };
};

const promotion = (value: PhpClassPropertyAst['promotion'], source: SourceSpan): PropertyPromotion => {
    if (value.kind === 'declared') return { kind: 'declared' };
    if (value.parameterDefault.kind === 'absent') {
        return { kind: 'constructor_promoted', constructor: { kind: 'method_name', value: value.constructorName.value }, parameterDefault: { kind: 'absent' } };
    }
    return { kind: 'constructor_promoted', constructor: { kind: 'method_name', value: value.constructorName.value }, parameterDefault: { kind: 'present', value: expression(value.parameterDefault.value, source) } };
};

const declaration = (context: PropertyProducerContext): PropertyDeclaration => {
    switch (context.kind) {
        case 'model_attribute': return { kind: 'model_attribute', model: context.model, origin: { kind: 'database_attribute', column: context.column } };
        case 'relation_attribute': return { kind: 'relation_property', model: context.model, relation: context.relation };
        case 'class_property': return context.declaration;
    }
};

const absentDocumentation: PropertyDocumentation = { kind: 'absent' };
const readWriteAccess: PropertyAccess = { kind: 'read_write' };
const notCasted: PropertyCasting = { kind: 'not_casted' };

export const propertyProducer: PropertyProducer = {
    produce(input): PropertyAst {
        const definition: PropertyDefinition = {
            kind: 'property',
            name: createPropertyName(input.property.name.value),
            type: propertyType(input.property.type),
            presence: { kind: 'required' },
            declaration: declaration(input.context),
            documentation: absentDocumentation,
            visibility: visibility(input.property.visibility),
            storage: storage(input.property.storage, input.property.mutability),
            initialization: initialization(input.property.initialization, input.source),
            promotion: promotion(input.property.promotion, input.source),
            access: readWriteAccess,
            casting: notCasted,
            source: input.source,
        };
        return { kind: 'property_ast', definition, source: input.source };
    },
};
