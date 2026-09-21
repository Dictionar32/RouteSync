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
import type { RequestFieldMeaning, RequestFieldMeaningVisitor } from '../../../types/domain/requestFieldMeaning';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const source = (file: string): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: str(file) }, start: num(0), end: num(0) });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const requestName = (value: string): RequestName => ({ kind: 'request_name', value: str(value) });
const formTypeName = (value: string): FormTypeName => ({ kind: 'form_type_name', value: str(value) });
const propertyReference = (value: string): PropertyReference => ({ kind: 'property_reference', name: propertyName(value) });

function path(value: string): PropertyPath {
    return { kind: 'property_path', segments: seq(value.split('.').filter(Boolean).map(propertyName)) };
}

function presence(field: RequestField): Presence {
    return field.presence.kind === 'required' ? { kind: 'required' } : { kind: 'optional' };
}

function fieldType(field: RequestField): TypeExpression {
    const base = semanticTypeFromMeaning(field.meaning);
    return field.presence.kind === 'required' || field.presence.kind === 'optional'
        ? field.presence.nullable ? { kind: 'nullable' as const, value: base } : base
        : base;
}

function semanticTypeFromMeaning(meaning: RequestFieldMeaning): TypeExpression {
    const visitor: RequestFieldMeaningVisitor<TypeExpression> = {
        scalar: value => scalarType(value.scalar),
        object: value => ({ kind: 'object' as const, properties: { kind: 'type_properties' as const, items: seq(value.fields.map(item => ({ kind: 'type_property' as const, name: propertyName(item.name.value.value), type: semanticTypeFromMeaningLike(item.meaning), source: source('') }))) } }),
        resource: value => ({ kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } }),
        collection: value => ({ kind: 'array' as const, element: semanticTypeFromMeaningLike(value.element) }),
        resourceCollection: value => ({ kind: 'array' as const, element: { kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } } }),
        jsonValue: () => ({ kind: 'primitive' as const, value: { kind: 'json' as const } }),
        never: () => ({ kind: 'never' as const }),
        error: value => ({ kind: 'error' as const, diagnostic: str(value.diagnosticMessage) }),
        union: value => ({ kind: 'union' as const, members: { kind: 'type_expressions' as const, items: seq(value.members.map(semanticTypeFromMeaningLike)) } }),
        intersection: value => ({ kind: 'intersection' as const, members: { kind: 'type_expressions' as const, items: seq(value.members.map(semanticTypeFromMeaningLike)) } }),
        generic: value => ({ kind: 'generic' as const, base: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.base.kind) } }, parameters: { kind: 'type_parameters' as const, items: seq(value.parameters.map(parameter => ({ kind: 'type_parameter' as const, name: { kind: 'variable_name' as const, value: str(parameter.name) }, type: semanticTypeFromMeaningLike(parameter.meaning), source: source('') }))) } }),
    };
    return meaning.accept(visitor);
}

function semanticTypeFromMeaningLike(meaning: RequestFieldMeaning): TypeExpression {
    return semanticTypeFromMeaning(meaning);
}

function scalarType(kind: 'string' | 'number' | 'boolean' | 'file' | 'unknown'): TypeExpression {
    const value = kind === 'number' ? { kind: 'number' as const } : kind === 'boolean' ? { kind: 'boolean' as const } : kind === 'file' ? { kind: 'file' as const } : kind === 'string' ? { kind: 'string' as const } : { kind: 'json' as const };
    return { kind: 'primitive' as const, value };
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
    const mapped = field.validation.map(rule => mapRule(rule));
    return { kind: 'validation_rules', items: seq(mapped) };
}

function mapRule(rule: RequestField['validation'][number]): ValidationRule {
    switch (rule.kind) {
        case 'required': return { kind: 'required' };
        case 'nullable': return { kind: 'nullable' };
        case 'optional': return { kind: 'optional' };
        case 'string': return { kind: 'string' };
        case 'number': return { kind: 'numeric' };
        case 'boolean': return { kind: 'boolean' };
        case 'array': return { kind: 'array' };
        case 'email': return { kind: 'email' };
        case 'url': return { kind: 'url' };
        case 'min': return { kind: 'min', value: { kind: 'number_value', value: rule.value.value } };
        case 'max': return { kind: 'max', value: { kind: 'number_value', value: rule.value.value } };
        case 'in': return { kind: 'in', values: { kind: 'string_values', items: seq(rule.values.map(value => str(value.value))) } };
        case 'exists': return { kind: 'exists', table: tableName(rule.table.value.value), column: columnName(rule.column.kind === 'explicit_column' ? rule.column.column.value.value : '') };
        case 'unique': return { kind: 'unique', table: tableName(rule.table.value.value), column: columnName(rule.column.kind === 'explicit_column' ? rule.column.column.value.value : ''), target: { kind: 'all' } };
        default: throw new Error(`Request AST validation rule '${rule.kind}' has no upstream vocabulary mapping`);
    }
}

const tableName = (value: string): TableName => ({ kind: 'table_name', value: str(value) });
const columnName = (value: string): ColumnName => ({ kind: 'column_name', value: str(value) });

function field(field: RequestField, file: string): UpstreamRequestField {
    const fieldSource = source(file);
    return { kind: 'request_field', name: path(field.name.value), target: target(field), type: fieldType(field), presence: presence(field), rules: rules(field), default: { kind: 'none' }, source: fieldSource };
}

export function requestAstFromSource(request: FormRequestSource): RequestAst {
    const file = request.sourceFile.value.value;
    const sourceSpan = source(file);
    const definition: RequestDefinition = {
        kind: 'request',
        identity: { kind: 'request_identity', request: requestName(request.identity.requestClass.value.value), formType: formTypeName(request.identity.formType.value.value) },
        authorization: request.authorization,
        schema: { kind: 'request_schema', fields: { kind: 'request_fields', items: seq(request.fields.map(item => field(item, file))) } as RequestFields },
        source: sourceSpan,
    };
    return { kind: 'request_ast', definition, source: sourceSpan };
}
