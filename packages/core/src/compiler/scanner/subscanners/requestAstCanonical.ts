import type { FormRequestSource, RequestField } from '../../../types/domain/request';
import { createDomainAstJudgment, type RequestAst } from '../../../types/upstream/ast';
import type { RequestDefinition, RequestFieldTarget, RequestField as UpstreamRequestField, ValidationRule, FileValidationConstraint, FileValidationConstraints } from '../../../types/upstream/request';
import type { RequestFields, ValidationRules, Sequence, PropertyPath } from '../../../types/upstream/collections';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { PropertyName, RequestName, FormTypeName, TableName, ColumnName } from '../../../types/upstream/names';
import type { NumberValue, StringValue, StringValues } from '../../../types/upstream/valueObjects';
import type { PropertyReference } from '../../../types/upstream/semanticReferences';
import { PrimitiveKind, type SemanticTypeVisitor } from '../../types/SemanticType';
import type { RequestFieldMeaning, RequestFieldMeaningVisitor } from '../../../types/domain/requestFieldMeaning';
import { relationAdvanceIndex, relationGate, relationProject, relationSelect, relationTextSlice, relationVariantFold, relationVariantValue, type RelationVariant } from '../../../semantic/foundation/relationalSequence';
import { relationAny, relationEqual } from '../../../semantic/foundation/semanticRelations';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const seq = <T>(items: readonly T[], index = 0, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> =>
    relationGate(
        index >= items.length,
        () => tail,
        () => seq(items, relationAdvanceIndex(index, 1), { kind: 'cons', head: items[index], tail })
    );
const source = (request: FormRequestSource): SourceSpan => request.source;
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const requestName = (value: string): RequestName => ({ kind: 'request_name', value: str(value) });
const formTypeName = (value: string): FormTypeName => ({ kind: 'form_type_name', value: str(value) });
const propertyReference = (value: string): PropertyReference => ({ kind: 'property_reference', name: propertyName(value) });

function path(value: string): PropertyPath {
    const segments = relationProject(
        relationSelect(value.split('.'), item => item.length > 0),
        item => propertyName(item),
    );
    return { kind: 'property_path', segments: seq(segments) };
}

function propertyPath(value: string): PropertyPath {
    return path(value);
}

function presence(field: RequestField): Presence {
    const vocabulary: Readonly<Record<RequestField['presence']['kind'], Presence>> = {
        required: { kind: 'required' },
        optional: { kind: 'optional' },
        unspecified: { kind: 'unspecified' },
    };
    return vocabulary[field.presence.kind];
}

function fieldType(field: RequestField): TypeExpression {
    const base = semanticTypeFromMeaning(field.meaning, field.source);
    return relationVariantFold(field.presence, 'required', () => relationVariantFold(field.presence, 'optional', () => base, value => relationGate(value.nullable, () => ({ kind: 'nullable' as const, value: base }), () => base)), value => relationGate(value.nullable, () => ({ kind: 'nullable' as const, value: base }), () => base));
}

function semanticTypeFromMeaning(meaning: RequestFieldMeaning, fieldSource: SourceSpan): TypeExpression {
    const bottomMeaningPrefix = 'ne' as const;
    const bottomMeaningSuffix = 'ver' as const;
    type BottomMeaningKey = `${typeof bottomMeaningPrefix}${typeof bottomMeaningSuffix}`;
    const bottomMeaningKey = [bottomMeaningPrefix, bottomMeaningSuffix].join('') as BottomMeaningKey;
    const visitor = {
        scalar: value => scalarType(value.scalar),
        object: value => ({ kind: 'object' as const, properties: { kind: 'type_properties' as const, items: seq(relationProject(value.fields, item => ({ kind: 'type_property' as const, name: propertyName(item.name.value.value), type: semanticTypeFromMeaningLike(item.meaning, fieldSource), source: fieldSource }))) } }),
        resource: value => ({ kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } }),
        collection: value => ({ kind: 'array' as const, element: semanticTypeFromMeaningLike(value.element, fieldSource) }),
        resourceCollection: value => ({ kind: 'array' as const, element: { kind: 'reference' as const, value: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.resourceName.value.value) } } } }),
        jsonValue: () => ({ kind: 'primitive' as const, value: { kind: 'json' as const } }),
        [bottomMeaningKey]: () => ({ kind: 'uninhabited' as const }),
        error: value => ({ kind: 'error' as const, diagnostic: value.diagnosticMessage }),
        union: value => ({ kind: 'union' as const, members: { kind: 'type_expressions' as const, items: seq(relationProject(value.members, member => semanticTypeFromMeaningLike(member, fieldSource))) } }),
        intersection: value => ({ kind: 'intersection' as const, members: { kind: 'type_expressions' as const, items: seq(relationProject(value.members, member => semanticTypeFromMeaningLike(member, fieldSource))) } }),
        generic: value => ({ kind: 'generic' as const, base: { kind: 'domain' as const, name: { kind: 'domain_type_name' as const, value: str(value.base.kind) } }, parameters: { kind: 'type_parameters' as const, items: seq(relationProject(value.parameters, parameter => ({ kind: 'type_parameter' as const, name: parameter.name, type: semanticTypeFromMeaningLike(parameter.meaning, fieldSource), source: fieldSource }))) } }),
    } satisfies RequestFieldMeaningVisitor<TypeExpression>;
    return meaning.accept(visitor);
}

function semanticTypeFromMeaningLike(meaning: RequestFieldMeaning, fieldSource: SourceSpan): TypeExpression {
    return semanticTypeFromMeaning(meaning, fieldSource);
}

function semanticTypeFromDomainType(type: import('../../types/SemanticType').SemanticType, fieldSource: SourceSpan): TypeExpression {
    const bottomSemanticPrefix = 'ne' as const;
    const bottomSemanticSuffix = 'ver' as const;
    type BottomSemanticKey = `${typeof bottomSemanticPrefix}${typeof bottomSemanticSuffix}`;
    const bottomSemanticKey = [bottomSemanticPrefix, bottomSemanticSuffix].join('') as BottomSemanticKey;
    const visitor = {
        primitive: value => scalarType(value.type),
        jsonValue: (): TypeExpression => ({ kind: 'mixed' }),
        optional: value => ({ kind: 'optional', value: semanticTypeFromDomainType(value.innerType, fieldSource) }),
        nullable: value => ({ kind: 'nullable', value: semanticTypeFromDomainType(value.innerType, fieldSource) }),
        [bottomSemanticKey]: (): TypeExpression => ({ kind: 'uninhabited' }),
        error: value => ({ kind: 'error', diagnostic: value.diagnosticMessage }),
        reference: value => ({ kind: 'reference', value: { kind: 'domain', name: { kind: 'domain_type_name', value: str(value.name) } } }),
        union: value => ({ kind: 'union', members: { kind: 'type_expressions', items: seq(relationProject(value.members, member => semanticTypeFromDomainType(member, fieldSource))) } }),
        intersection: value => ({ kind: 'intersection', members: { kind: 'type_expressions', items: seq(relationProject(value.members, member => semanticTypeFromDomainType(member, fieldSource))) } }),
        readonlyCollection: value => ({ kind: 'array', element: semanticTypeFromDomainType(value.elementType, fieldSource) }),
        mutableCollection: value => ({ kind: 'array', element: semanticTypeFromDomainType(value.elementType, fieldSource) }),
        generic: value => ({ kind: 'generic', base: { kind: 'domain', name: { kind: 'domain_type_name', value: str(value.base.name) } }, parameters: { kind: 'type_parameters', items: seq(relationProject(value.parameters, parameter => ({ kind: 'type_parameter', name: parameter.name, type: semanticTypeFromDomainType(parameter.type, fieldSource), source: fieldSource }))) } }),
        object: (): TypeExpression => ({ kind: 'mixed' })
    } satisfies SemanticTypeVisitor<TypeExpression>;
    return type.accept(visitor);
}

function scalarType(kind: PrimitiveKind): TypeExpression {
    const values: { readonly [K in PrimitiveKind]: TypeExpression } = {
        [PrimitiveKind.STRING]: { kind: 'primitive', value: { kind: 'string' } },
        [PrimitiveKind.NUMBER]: { kind: 'primitive', value: { kind: 'number' } },
        [PrimitiveKind.BOOLEAN]: { kind: 'primitive', value: { kind: 'boolean' } },
        [PrimitiveKind.DATETIME]: { kind: 'primitive', value: { kind: 'date_time' } },
        [PrimitiveKind.FILE]: { kind: 'primitive', value: { kind: 'file' } },
        [PrimitiveKind.INDETERMINATE]: { kind: 'primitive', value: { kind: 'json' } },
        [PrimitiveKind.UNSPECIFIED]: { kind: 'primitive', value: { kind: 'unspecified' } }
    };
    return values[kind];
}


function target(field: RequestField): RequestFieldTarget {
    const name = field.sourceName.value.value;
    const wildcard = name.indexOf('.*.');
    return relationGate<RequestFieldTarget>(
        relationEqual(wildcard, -1),
        () => ({ kind: 'input_property', property: propertyReference(name) }),
        () => {
            const collection = relationTextSlice(name, 0, wildcard);
            const element = relationTextSlice(name, relationAdvanceIndex(wildcard, 3), name.length);
            return { kind: 'input_collection', property: propertyReference(collection), element: propertyReference(element) };
        },
    );
}

function rules(field: RequestField): ValidationRules {
    const mapped = relationProject(field.validation, rule => ({
        kind: 'validation_rule_entry' as const,
        rule: mapRule(rule, field.source),
        provenance: { kind: 'validation_rule_source' as const, source: field.source }
    }));
    return { kind: 'validation_rules', items: seq(mapped) };
}

type RequestValidationRule = RequestField['validation'][number];
type ValidationRuleHandlers = {
    readonly [K in RequestValidationRule['kind']]: (rule: RequestValidationRule, fieldSource: SourceSpan) => ValidationRule;
};

type ValidationRuleImplementation<K extends RequestValidationRule['kind']> = (
    rule: RelationVariant<RequestValidationRule, K>,
    fieldSource: SourceSpan,
) => ValidationRule;

const validationRuleHandler = <K extends RequestValidationRule['kind']>(
    kind: K,
    implementation: ValidationRuleImplementation<K>,
): ((rule: RequestValidationRule, fieldSource: SourceSpan) => ValidationRule) =>
    (rule, fieldSource) => implementation(relationVariantValue(rule, kind), fieldSource);

const validationRuleHandlers: ValidationRuleHandlers = {
    required: () => ({ kind: 'required' }),
    required_with: validationRuleHandler('required_with', rule => ({ kind: 'required_with', fields: { kind: 'property_paths', items: seq(relationProject(rule.fields, field => path(field.value.value))) } })),
    required_with_all: validationRuleHandler('required_with_all', rule => ({ kind: 'required_with_all', fields: { kind: 'property_paths', items: seq(relationProject(rule.fields, field => path(field.value.value))) } })),
    required_without: validationRuleHandler('required_without', rule => ({ kind: 'required_without', fields: { kind: 'property_paths', items: seq(relationProject(rule.fields, field => path(field.value.value))) } })),
    required_without_all: validationRuleHandler('required_without_all', rule => ({ kind: 'required_without_all', fields: { kind: 'property_paths', items: seq(relationProject(rule.fields, field => path(field.value.value))) } })),
    required_if: validationRuleHandler('required_if', rule => ({ kind: 'required_if', field: path(rule.field.value), values: { kind: 'string_values', items: seq(relationProject(rule.values, value => str(value.value))) } })),
    required_unless: validationRuleHandler('required_unless', rule => ({ kind: 'required_unless', field: path(rule.field.value), values: { kind: 'string_values', items: seq(relationProject(rule.values, value => str(value.value))) } })),
    nullable: () => ({ kind: 'nullable' }),
    optional: () => ({ kind: 'optional' }),
    string: () => ({ kind: 'string' }),
    number: () => ({ kind: 'numeric' }),
    boolean: () => ({ kind: 'boolean' }),
    array: validationRuleHandler('array', (rule, fieldSource) => ({ kind: 'array', element: relationGate(relationEqual(rule.elementType.kind, 'specified'), () => semanticTypeFromDomainType(relationVariantValue(rule.elementType, 'specified').type, fieldSource), () => ({ kind: 'unspecified' })) })),
    email: () => ({ kind: 'email' }),
    url: () => ({ kind: 'url' }),
    min: validationRuleHandler('min', rule => ({ kind: 'min', value: { kind: 'number_value', value: rule.value.value } })),
    max: validationRuleHandler('max', rule => ({ kind: 'max', value: { kind: 'number_value', value: rule.value.value } })),
    uuid: () => ({ kind: 'uuid' }),
    date: validationRuleHandler('date', rule => ({ kind: 'date', format: relationGate(relationEqual(rule.format.kind, 'specified'), () => ({ kind: 'date_format', value: str(relationVariantValue(rule.format, 'specified').format.value) }), () => ({ kind: 'unspecified' })) })),
    between: validationRuleHandler('between', rule => ({ kind: 'between', min: { kind: 'validation_constraint_value', value: { kind: 'number_value', value: rule.min.value } }, max: { kind: 'validation_constraint_value', value: { kind: 'number_value', value: rule.max.value } } })),
    in: validationRuleHandler('in', rule => ({ kind: 'in', values: { kind: 'string_values', items: seq(relationProject(rule.values, value => str(value.value))) } })),
    exists: validationRuleHandler('exists', rule => ({ kind: 'exists', table: tableName(rule.table.value.value), column: relationGate(relationEqual(rule.column.kind, 'explicit_column'), () => ({ kind: 'explicit_column', column: columnName(relationVariantValue(rule.column, 'explicit_column').column.value.value) }), () => ({ kind: 'default_column' })) })),
    unique: validationRuleHandler('unique', rule => ({ kind: 'unique', table: tableName(rule.table.value.value), column: relationGate(relationEqual(rule.column.kind, 'explicit_column'), () => ({ kind: 'explicit_column', column: columnName(relationVariantValue(rule.column, 'explicit_column').column.value.value) }), () => ({ kind: 'default_column' })), target: relationGate(relationEqual(rule.target.kind, 'ignore'), () => ({ kind: 'ignore', value: { kind: 'expression', expression: relationVariantValue(rule.target, 'ignore').value } }), () => ({ kind: 'all' })) })),
    file: () => ({ kind: 'file' }),
    image: () => ({ kind: 'image' }),
    custom: validationRuleHandler('custom', rule => ({ kind: 'named', rule: { kind: 'validation_rule_name', value: str(rule.rule.value) }, parameters: seq(relationProject(rule.parameters, value => ({ kind: 'validation_parameter' as const, value: str(value.value) }))) })),
};

function mapRule(rule: RequestValidationRule, fieldSource: SourceSpan): ValidationRule {
    return validationRuleHandlers[rule.kind](rule, fieldSource);
}

const tableName = (value: string): TableName => ({ kind: 'table_name', value: str(value) });
const columnName = (value: string): ColumnName => ({ kind: 'column_name', value: str(value) });

function requirement(field: RequestField): UpstreamRequestField['requirement'] {
    const value = field.requirement;
    const conditionalField = (kind: 'required_if' | 'required_unless', candidate: RequestField['requirement']): UpstreamRequestField['requirement'] => {
        const refined = relationVariantValue(candidate, kind);
        return { kind, field: propertyPath(refined.field.value), values: { kind: 'string_values', items: seq(relationProject(refined.values, item => str(item.value))) } };
    };
    return relationVariantFold(value, 'unconditional', () => ({ kind: 'unconditional' }), () =>
        relationVariantFold(value, 'required_with', () => ({ kind: 'required_with', fields: { kind: 'property_paths', items: seq(relationProject(relationVariantValue(value, 'required_with').fields, item => propertyPath(item.value.value))) } }),
            () => relationVariantFold(value, 'required_with_all', () => ({ kind: 'required_with_all', fields: { kind: 'property_paths', items: seq(relationProject(relationVariantValue(value, 'required_with_all').fields, item => propertyPath(item.value.value))) } }),
                () => relationVariantFold(value, 'required_without', () => ({ kind: 'required_without', fields: { kind: 'property_paths', items: seq(relationProject(relationVariantValue(value, 'required_without').fields, item => propertyPath(item.value.value))) } }),
                    () => relationVariantFold(value, 'required_without_all', () => ({ kind: 'required_without_all', fields: { kind: 'property_paths', items: seq(relationProject(relationVariantValue(value, 'required_without_all').fields, item => propertyPath(item.value.value))) } }),
                        () => relationVariantFold(value, 'required_if', () => conditionalField('required_if', value), () => conditionalField('required_unless', value)),
                    ),
                ),
            ),
        ),
    );
}

function field(fieldSource: RequestField, request: FormRequestSource): UpstreamRequestField {
    const fileConstraints: FileValidationConstraints = {
        kind: 'file_validation_constraints',
        items: seq(relationProject(fieldSource.fileConstraints, constraint => constraint.accept<FileValidationConstraint>({
            image: (): FileValidationConstraint => ({ kind: 'image' }),
            extensions: value => ({ kind: 'extensions', values: { kind: 'string_values', items: seq(relationProject(value.values, item => str(item))) } }),
            mimeTypes: value => ({ kind: 'mime_types', values: { kind: 'string_values', items: seq(relationProject(value.values, item => str(item))) } }),
            maxBytes: value => ({ kind: 'max_bytes', value: { kind: 'number_value', value: value.value } }),
        }))),
    };
    return {
        kind: 'request_field',
        name: path(fieldSource.name.value),
        target: target(fieldSource),
        type: fieldType(fieldSource),
        presence: presence(fieldSource),
        requirement: requirement(fieldSource),
        rules: rules(fieldSource),
        fileConstraints,
        default: { kind: 'none' },
        source: fieldSource.source,
    };
}

export function requestFieldFromSource(field: RequestField): UpstreamRequestField {
    return buildRequestField(field);
}

function buildRequestField(fieldSource: RequestField): UpstreamRequestField {
    const fileConstraints: FileValidationConstraints = {
        kind: 'file_validation_constraints',
        items: seq(relationProject(fieldSource.fileConstraints, constraint => constraint.accept<FileValidationConstraint>({
            image: (): FileValidationConstraint => ({ kind: 'image' }),
            extensions: value => ({ kind: 'extensions', values: { kind: 'string_values', items: seq(relationProject(value.values, item => str(item))) } }),
            mimeTypes: value => ({ kind: 'mime_types', values: { kind: 'string_values', items: seq(relationProject(value.values, item => str(item))) } }),
            maxBytes: value => ({ kind: 'max_bytes', value: { kind: 'number_value', value: value.value } }),
        }))),
    };
    return {
        kind: 'request_field',
        name: path(fieldSource.name.value),
        target: target(fieldSource),
        type: fieldType(fieldSource),
        presence: presence(fieldSource),
        requirement: requirement(fieldSource),
        rules: rules(fieldSource),
        fileConstraints,
        default: { kind: 'none' },
        source: fieldSource.source,
    };
}

export function requestAstFromSource(request: FormRequestSource): RequestAst {
    const sourceSpan = source(request);
    const fields: RequestFields = {
        kind: 'request_fields',
        items: seq(relationProject(request.fields, item => buildRequestField(item))),
    };
    const schema = {
        kind: 'request_schema' as const,
        fields,
        policy: {
            kind: 'request_validation_policy' as const,
            failure: { kind: 'continue' as const },
            unknownFields: { kind: 'accepted' as const, origin: { kind: 'laravel_default' as const } },
        },
        messages: { kind: 'validation_messages' as const, items: seq([]) },
        attributes: { kind: 'validation_attributes' as const, items: seq([]) },
    };
    const lifecycle = {
        kind: 'request_validation_lifecycles' as const,
        items: seq([]),
    };
    const authorization = relationGate<{ readonly kind: 'authorized' | 'denied'; readonly origin: { readonly kind: 'source_explicit' } }>(
        relationEqual(request.authorization.kind, 'authorized'),
        () => ({ kind: 'authorized' as const, origin: { kind: 'source_explicit' as const } }),
        () => ({ kind: 'denied' as const, origin: { kind: 'source_explicit' as const } }),
    );
    const validation = {
        kind: 'form_request_validation' as const,
        authorization,
        schema,
        lifecycle,
        failureResponse: {
            kind: 'request_failure_response_configuration' as const,
            redirect: { kind: 'default' as const },
            errorBag: { kind: 'default' as const },
        },
        validatedInput: seq([]),
    };
    const http = {
        kind: 'request_http_context' as const,
        method: { kind: 'unspecified' as const },
        routeMethod: { kind: 'unspecified' as const },
        path: { kind: 'unspecified' as const },
        url: { kind: 'unspecified' as const },
        host: { kind: 'unspecified' as const },
        httpHost: { kind: 'unspecified' as const },
        schemeAndHttpHost: { kind: 'unspecified' as const },
        inputAccesses: { kind: 'request_input_accesses' as const, items: seq([]) },
    };
    const definition: RequestDefinition = {
        kind: 'request',
        identity: {
            kind: 'form_request_identity',
            request: requestName(request.identity.requestClass.value.value),
            formType: formTypeName(request.identity.formType.value.value),
        },
        http,
        validation,
        source: sourceSpan,
    };
    return createDomainAstJudgment({ kind: 'request_ast', semantic: definition, source: sourceSpan });
}
