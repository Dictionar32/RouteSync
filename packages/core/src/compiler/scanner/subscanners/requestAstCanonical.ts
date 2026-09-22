import type { FormRequestSource, RequestField } from '../../../types/domain/request';
import type { RequestAst } from '../../../types/upstream/ast';
import type { RequestDefinition, RequestFieldTarget, RequestField as UpstreamRequestField, ValidationRule } from '../../../types/upstream/request';
import type { RequestFields, ValidationRules, Sequence, PropertyPath } from '../../../types/upstream/collections';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { PropertyName, RequestName, FormTypeName, TableName, ColumnName } from '../../../types/upstream/names';
import type { NumberValue, StringValue, StringValues } from '../../../types/upstream/valueObjects';
import type { PropertyReference } from '../../../types/upstream/semanticReferences';
import { PrimitiveKind } from '../../types/SemanticType';
import type { RequestFieldMeaning, RequestFieldMeaningVisitor } from '../../../types/domain/requestFieldMeaning';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const source = (request: FormRequestSource): SourceSpan => request.source;
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const requestName = (value: string): RequestName => ({ kind: 'request_name', value: str(value) });
const formTypeName = (value: string): FormTypeName => ({ kind: 'form_type_name', value: str(value) });
const propertyReference = (value: string): PropertyReference => ({ kind: 'property_reference', name: propertyName(value) });

function path(value: string): PropertyPath {
    return { kind: 'property_path', segments: seq(value.split('.').filter(Boolean).map(propertyName)) };
}

function presence(field: RequestField): Presence {
    switch (field.presence.kind) {
        case 'required': return { kind: 'required' };
        case 'optional': return { kind: 'optional' };
        case 'unspecified': return { kind: 'unspecified' };
    }
}

function fieldType(field: RequestField): TypeExpression {
    const base = semanticTypeFromMeaning(field.meaning, field.source);
    return field.presence.kind === 'required' || field.presence.kind === 'optional'
        ? field.presence.nullable ? { kind: 'nullable' as const, value: base } : base
        : base;
}

function semanticTypeFromMeaning(meaning: RequestFieldMeaning, fieldSource: SourceSpan): TypeExpression {
    const visitor: RequestFieldMeaningVisitor<TypeExpression> = {
        scalar: value => scalarType(value.scalar),
        object: value => ({ kind: 'object' as const, properties: { kind: 'type_properties' as const, items: seq(value.fields.map(item => ({ kind: 'type_property' as const, name: propertyName(item.name.value.value), type: semanticTypeFromMeaningLike(item.meaning, fieldSource), source: fieldSource }))) } }),
        resource: value => ({ kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } }),
        collection: value => ({ kind: 'array' as const, element: semanticTypeFromMeaningLike(value.element, fieldSource) }),
        resourceCollection: value => ({ kind: 'array' as const, element: { kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } } }),
        jsonValue: () => ({ kind: 'primitive' as const, value: { kind: 'json' as const } }),
        never: () => ({ kind: 'never' as const }),
        error: value => ({ kind: 'error' as const, diagnostic: value.diagnosticMessage }),
        union: value => ({ kind: 'union' as const, members: { kind: 'type_expressions' as const, items: seq(value.members.map(member => semanticTypeFromMeaningLike(member, fieldSource))) } }),
        intersection: value => ({ kind: 'intersection' as const, members: { kind: 'type_expressions' as const, items: seq(value.members.map(member => semanticTypeFromMeaningLike(member, fieldSource))) } }),
        generic: value => ({ kind: 'generic' as const, base: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.base.kind) } }, parameters: { kind: 'type_parameters' as const, items: seq(value.parameters.map(parameter => ({ kind: 'type_parameter' as const, name: parameter.name, type: semanticTypeFromMeaningLike(parameter.meaning, fieldSource), source: fieldSource }))) } }),
    };
    return meaning.accept(visitor);
}

function semanticTypeFromMeaningLike(meaning: RequestFieldMeaning, fieldSource: SourceSpan): TypeExpression {
    return semanticTypeFromMeaning(meaning, fieldSource);
}

function semanticTypeFromDomainType(type: import('../../types/SemanticType').SemanticType, fieldSource: SourceSpan): TypeExpression {
    return type.accept({
        primitive: value => scalarType(value.type),
        jsonValue: () => ({ kind: 'mixed' }),
        optional: value => ({ kind: 'optional', value: semanticTypeFromDomainType(value.innerType, fieldSource) }),
        nullable: value => ({ kind: 'nullable', value: semanticTypeFromDomainType(value.innerType, fieldSource) }),
        never: () => ({ kind: 'never' }),
        error: value => ({ kind: 'error', diagnostic: value.diagnosticMessage }),
        reference: value => ({ kind: 'reference', value: { kind: 'domain', name: { kind: 'domain_type_name', value: str(value.name) } } }),
        union: value => ({ kind: 'union', members: { kind: 'type_expressions', items: seq(value.members.map(member => semanticTypeFromDomainType(member, fieldSource))) } }),
        intersection: value => ({ kind: 'intersection', members: { kind: 'type_expressions', items: seq(value.members.map(member => semanticTypeFromDomainType(member, fieldSource))) } }),
        readonlyCollection: value => ({ kind: 'array', element: semanticTypeFromDomainType(value.elementType, fieldSource) }),
        mutableCollection: value => ({ kind: 'array', element: semanticTypeFromDomainType(value.elementType, fieldSource) }),
        generic: value => ({ kind: 'generic', base: { kind: 'domain', name: { kind: 'domain_type_name', value: str(value.base.name) } }, parameters: { kind: 'type_parameters', items: seq(value.parameters.map(parameter => ({ kind: 'type_parameter', name: parameter.name, type: semanticTypeFromDomainType(parameter.type, fieldSource), source: fieldSource }))) } }),
        object: () => ({ kind: 'mixed' })
    });
}

function scalarType(kind: PrimitiveKind): TypeExpression {
    const values: { readonly [K in PrimitiveKind]: TypeExpression } = {
        [PrimitiveKind.STRING]: { kind: 'primitive', value: { kind: 'string' } },
        [PrimitiveKind.NUMBER]: { kind: 'primitive', value: { kind: 'number' } },
        [PrimitiveKind.BOOLEAN]: { kind: 'primitive', value: { kind: 'boolean' } },
        [PrimitiveKind.DATETIME]: { kind: 'primitive', value: { kind: 'date_time' } },
        [PrimitiveKind.FILE]: { kind: 'primitive', value: { kind: 'file' } },
        [PrimitiveKind.UNKNOWN]: { kind: 'primitive', value: { kind: 'json' } },
        [PrimitiveKind.UNSPECIFIED]: { kind: 'primitive', value: { kind: 'unspecified' } }
    };
    return values[kind];
}


function target(field: RequestField): RequestFieldTarget {
    const name = field.sourceName.value.value;
    const wildcard = name.indexOf('.*.');
    if (wildcard === -1) return { kind: 'input_property', property: propertyReference(name) };
    const collection = name.slice(0, wildcard);
    const element = name.slice(wildcard + 3);
    return { kind: 'input_collection', property: propertyReference(collection), element: propertyReference(element) };
}

function rules(field: RequestField): ValidationRules {
    const mapped = field.validation.map(rule => mapRule(rule, field.source));
    return { kind: 'validation_rules', items: seq(mapped) };
}

function mapRule(rule: RequestField['validation'][number], fieldSource: SourceSpan): ValidationRule {
    switch (rule.kind) {
        case 'required': return { kind: 'required' };
        case 'required_with': return { kind: 'required_with', fields: { kind: 'property_paths', items: seq(rule.fields.map(field => path(field.value))) } };
        case 'nullable': return { kind: 'nullable' };
        case 'optional': return { kind: 'optional' };
        case 'string': return { kind: 'string' };
        case 'number': return { kind: 'numeric' };
        case 'boolean': return { kind: 'boolean' };
        case 'array': return { kind: 'array', element: rule.elementType.kind === 'specified' ? semanticTypeFromDomainType(rule.elementType.type, fieldSource) : { kind: 'unspecified' } };
        case 'email': return { kind: 'email' };
        case 'url': return { kind: 'url' };
        case 'min': return { kind: 'min', value: { kind: 'number_value', value: rule.value.value } };
        case 'max': return { kind: 'max', value: { kind: 'number_value', value: rule.value.value } };
        case 'uuid': return { kind: 'uuid' };
        case 'date': return { kind: 'date', format: rule.format.kind === 'specified' ? { kind: 'date_format', value: str(rule.format.format.value) } : { kind: 'unspecified' } };
        case 'between': return { kind: 'between', min: { kind: 'validation_constraint_value', value: { kind: 'number_value', value: rule.min.value } }, max: { kind: 'validation_constraint_value', value: { kind: 'number_value', value: rule.max.value } } };
        case 'in': return { kind: 'in', values: { kind: 'string_values', items: seq(rule.values.map(value => str(value.value))) } };
        case 'exists': return { kind: 'exists', table: tableName(rule.table.value.value), column: rule.column.kind === 'explicit_column' ? { kind: 'explicit_column', column: columnName(rule.column.column.value.value) } : { kind: 'default_column' } };
        case 'unique': return { kind: 'unique', table: tableName(rule.table.value.value), column: rule.column.kind === 'explicit_column' ? { kind: 'explicit_column', column: columnName(rule.column.column.value.value) } : { kind: 'default_column' }, target: rule.target.kind === 'ignore' ? { kind: 'ignore', value: rule.target.value } : { kind: 'all' } };
        case 'file': return { kind: 'file' };
        case 'image': return { kind: 'image' };
        case 'custom': return { kind: 'custom', rule: { kind: 'validation_rule_name', value: str(rule.rule.value) }, parameters: seq(rule.parameters.map(value => ({ kind: 'validation_parameter' as const, value: str(value.value) }))) };
    }
}

const tableName = (value: string): TableName => ({ kind: 'table_name', value: str(value) });
const columnName = (value: string): ColumnName => ({ kind: 'column_name', value: str(value) });

function field(field: RequestField, request: FormRequestSource): UpstreamRequestField {
    const fieldSource = field.source;
    const fileConstraints = {
        kind: 'file_validation_constraints' as const,
        items: seq(field.fileConstraints.map(constraint => constraint.accept({
            image: () => ({ kind: 'image' as const }),
            extensions: value => ({
                kind: 'extensions' as const,
                values: { kind: 'string_values' as const, items: seq(value.values.map(item => str(item))) }
            }),
            mimeTypes: value => ({
                kind: 'mime_types' as const,
                values: { kind: 'string_values' as const, items: seq(value.values.map(item => str(item))) }
            }),
            maxBytes: value => ({
                kind: 'max_bytes' as const,
                value: { kind: 'number_value' as const, value: value.value }
            })
        })))
    };
    return {
        kind: 'request_field',
        name: path(field.name.value),
        target: target(field),
        type: fieldType(field),
        presence: presence(field),
        rules: rules(field),
        fileConstraints,
        default: { kind: 'none' },
        source: fieldSource
    };
}

export function requestAstFromSource(request: FormRequestSource): RequestAst {
    const sourceSpan = source(request);
    const definition: RequestDefinition = {
        kind: 'request',
        identity: { kind: 'request_identity', request: requestName(request.identity.requestClass.value.value), formType: formTypeName(request.identity.formType.value.value) },
        authorization: request.authorization,
        schema: { kind: 'request_schema', fields: { kind: 'request_fields', items: seq(request.fields.map(item => field(item, request))) } as RequestFields },
        source: sourceSpan,
    };
    return { kind: 'request_ast', definition, source: sourceSpan };
}
