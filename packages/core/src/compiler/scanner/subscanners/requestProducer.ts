import type { RequestAst } from '../../../types/upstream/ast';
import type { RequestDefinition, RequestAuthorization, RequestValidationLifecycle } from '../../../types/upstream/request';
import type { RequestFields, Sequence } from '../../../types/upstream/collections';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { RequestName, FormTypeName } from '../../../types/upstream/names';
import type { PhpArrayEntry } from '../lexer/PhpAst';
import type { PhpMethodAst } from '../lexer/phpMethodAstTypes';
import type { PhpClassPropertyAst } from '../lexer/phpAstDeclarationTypes';
import type { TypeInterner } from '../../types/TypeInterner';
import { parseCanonicalValidationRuleEntries } from './form-request';
import { assembleCanonicalValidationFields } from './form-request/validationFieldAssembler';
import { requestFieldFromSource } from './requestAstCanonical';
import { mapResourcePhpStatementsToSourceStatements } from './resource/resourceUpstreamExpressionCanonical';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';

export type RequestProducerInput = {
    readonly requestName: RequestName;
    readonly formType: FormTypeName;
    readonly source: SourceSpan;
    readonly rules: readonly PhpArrayEntry[];
    readonly authorize: PhpMethodAst;
    readonly methods: readonly PhpMethodAst[];
    readonly properties: readonly PhpClassPropertyAst[];
    readonly sourceFile: string;
    readonly interner: TypeInterner;
};

export interface RequestProducer {
    readonly produce: (input: RequestProducerInput) => RequestAst;
}

const seq = <T>(items: readonly T[]): Sequence<T> =>
    items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

function authorization(method: PhpMethodAst, file: string): RequestAuthorization {
    const returned = method.body.find(statement => statement.kind === 'return_with_value');
    if (returned === undefined) {
        throw new Error('FormRequest authorize() must return an expression at the AST boundary');
    }
    const expression = mapResourcePhpAstToUpstream(returned.expression, file);
    if (returned.expression.kind === 'literal' && returned.expression.value.kind === 'boolean') {
        if (returned.expression.value.value) return { kind: 'authorized', origin: { kind: 'source_explicit' } };
        return { kind: 'denied', origin: { kind: 'source_explicit' } };
    }
    return { kind: 'expression', expression, origin: { kind: 'source_explicit' } };
}

function lifecycle(methods: readonly PhpMethodAst[], file: string): RequestValidationLifecycle[] {
    const result: RequestValidationLifecycle[] = [];
    const statements = (name: string) => {
        const method = methods.find(item => item.name.value === name);
        return method === undefined ? undefined : mapResourcePhpStatementsToSourceStatements(method.body, file);
    };
    const prepare = statements('prepareForValidation');
    if (prepare !== undefined) result.push({ kind: 'prepare_for_validation', statements: prepare });
    const passed = statements('passedValidation');
    if (passed !== undefined) result.push({ kind: 'passed_validation', statements: passed });
    const failedAuthorization = statements('failedAuthorization');
    if (failedAuthorization !== undefined) result.push({ kind: 'failed_authorization', statements: failedAuthorization });
    const failedValidation = methods.find(item => item.name.value === 'failedValidation');
    if (failedValidation !== undefined) {
        const parameter = failedValidation.parameters[0];
        if (parameter !== undefined) {
            result.push({ kind: 'failed_validation', callback: { kind: 'request_validation_callback', validator: { kind: 'validator_parameter', name: { kind: 'string_value', value: parameter.name.value } }, statements: mapResourcePhpStatementsToSourceStatements(failedValidation.body, file), source: sourceSpan(file, failedValidation) } });
        }
    }
    const after = statements('after');
    if (after !== undefined) result.push({ kind: 'after_validation_source', statements: after });
    const withValidator = statements('withValidator');
    if (withValidator !== undefined) result.push({ kind: 'with_validator_source', statements: withValidator });
    return result;
}

function sourceSpan(file: string, method: PhpMethodAst): SourceSpan {
    return { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: file } }, start: { kind: 'number_value', value: method.source.start }, end: { kind: 'number_value', value: method.source.end } };
}

function literalString(value: import('../lexer/PhpAst').PhpAstValue | undefined): string | undefined {
    return value?.kind === 'literal' && value.literalType === 'string' ? value.value : undefined;
}

function literalBoolean(value: import('../lexer/PhpAst').PhpAstValue | undefined): boolean | undefined {
    return value?.kind === 'literal' && value.literalType === 'boolean' ? value.value : undefined;
}

function methodReturnArray(method: PhpMethodAst | undefined): readonly import('../lexer/PhpAst').PhpArrayEntry[] {
    const returned = method?.body.find(statement => statement.kind === 'return_with_value');
    return returned?.expression.kind === 'nested_array' ? returned.expression.entries : [];
}

function messages(method: PhpMethodAst | undefined, file: string): import('../../../types/upstream/request').RequestValidationMessages {
    if (method === undefined) return { kind: 'validation_messages', items: seq([]) };
    const items: import('../../../types/upstream/request').RequestValidationMessage[] = methodReturnArray(method).flatMap(entry => {
        const field = entry.key.kind === 'string' ? entry.key.value : undefined;
        const message = literalString(entry.value);
        if (field === undefined || message === undefined) return [];
        const separator = field.lastIndexOf('.');
        const fieldPath = separator > 0 ? field.slice(0, separator) : field;
        const rule = separator > 0 ? field.slice(separator + 1) : '';
        return [{ kind: 'validation_message', field: { kind: 'property_path', segments: seq(fieldPath.split('.').filter(Boolean).map(value => ({ kind: 'property_name', value: { kind: 'string_value', value } }))) }, rule: { kind: 'validation_rule_name', value: { kind: 'string_value', value: rule } }, message: { kind: 'string_value', value: message }, source: sourceSpan(file, method) }];
    });
    return { kind: 'validation_messages', items: seq(items) };
}

function attributes(method: PhpMethodAst | undefined, file: string): import('../../../types/upstream/request').RequestValidationAttributes {
    if (method === undefined) return { kind: 'validation_attributes', items: seq([]) };
    const items: import('../../../types/upstream/request').RequestValidationAttribute[] = methodReturnArray(method).flatMap(entry => {
        const field = entry.key.kind === 'string' ? entry.key.value : undefined;
        const label = literalString(entry.value);
        if (field === undefined || label === undefined) return [];
        return [{ kind: 'validation_attribute', field: { kind: 'property_path', segments: seq(field.split('.').filter(Boolean).map(value => ({ kind: 'property_name', value: { kind: 'string_value', value } }))) }, label: { kind: 'string_value', value: label }, source: sourceSpan(file, method) }];
    });
    return { kind: 'validation_attributes', items: seq(items) };
}

function propertyValue(properties: readonly PhpClassPropertyAst[], name: string): import('../lexer/PhpAst').PhpAstValue | undefined {
    const property = properties.find(item => item.name.value === name);
    return property?.initialization.kind === 'present' ? property.initialization.value : undefined;
}

function validationPolicy(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestValidationPolicy {
    const stop = literalBoolean(propertyValue(properties, 'stopOnFirstFailure'));
    const unknown = literalBoolean(propertyValue(properties, 'failOnUnknownFields'));
    return {
        kind: 'request_validation_policy',
        failure: stop === true ? { kind: 'stop_on_first_failure' } : { kind: 'continue' },
        unknownFields: unknown === true ? { kind: 'rejected', origin: { kind: 'source_explicit' } } : { kind: 'accepted', origin: unknown === false ? { kind: 'source_explicit' } : { kind: 'laravel_default' } }
    };
}

function failureResponse(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestFailureResponseConfiguration {
    const redirect = literalString(propertyValue(properties, 'redirect'));
    const redirectRoute = literalString(propertyValue(properties, 'redirectRoute'));
    const redirectAction = literalString(propertyValue(properties, 'redirectAction'));
    const errorBag = literalString(propertyValue(properties, 'errorBag'));
    return {
        kind: 'request_failure_response_configuration',
        redirect: redirect !== undefined ? { kind: 'url', value: { kind: 'string_value', value: redirect } } : redirectRoute !== undefined ? { kind: 'route', name: { kind: 'string_value', value: redirectRoute } } : redirectAction !== undefined ? { kind: 'action', name: { kind: 'string_value', value: redirectAction } } : { kind: 'default' },
        errorBag: errorBag !== undefined ? { kind: 'error_bag', name: { kind: 'string_value', value: errorBag } } : { kind: 'default' }
    };
}

export const requestProducer: RequestProducer = {
    produce(input): RequestAst {
        const validationEntries = parseCanonicalValidationRuleEntries(input.rules, input.sourceFile);
        const sourceFields = assembleCanonicalValidationFields(validationEntries, input.interner).fields;
        const fields: RequestFields = {
            kind: 'request_fields',
            items: seq(sourceFields.map(requestFieldFromSource))
        };
        const validation = {
            kind: 'form_request_validation',
            authorization: authorization(input.authorize, input.sourceFile),
            schema: {
                kind: 'request_schema',
                fields,
                policy: validationPolicy(input.properties),
                messages: messages(input.methods.find(method => method.name.value === 'messages'), input.sourceFile),
                attributes: attributes(input.methods.find(method => method.name.value === 'attributes'), input.sourceFile)
            },
            lifecycle: { kind: 'request_validation_lifecycles', items: seq(lifecycle(input.methods, input.sourceFile)) },
            failureResponse: failureResponse(input.properties),
            validatedInput: seq([])
        };
        const http = {
            kind: 'request_http_context',
            method: { kind: 'unspecified' },
            routeMethod: { kind: 'unspecified' },
            path: { kind: 'unspecified' },
            url: { kind: 'unspecified' },
            host: { kind: 'unspecified' },
            httpHost: { kind: 'unspecified' },
            schemeAndHttpHost: { kind: 'unspecified' },
            inputAccesses: { kind: 'request_input_accesses', items: seq([]) }
        };
        const definition: RequestDefinition = {
            kind: 'request',
            identity: { kind: 'form_request_identity', request: input.requestName, formType: input.formType },
            http,
            validation,
            source: input.source
        };
        return { kind: 'request_ast', definition, source: input.source };
    }
};
