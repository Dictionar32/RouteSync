import { createSourceFile } from '../../../types/upstream/names';
import type { PropertyName } from '../../../types/upstream/names';
import { createDomainAstJudgment, type RequestAst } from '../../../types/upstream/ast';
import type { RequestDefinition, RequestAuthorization, RequestValidationLifecycle } from '../../../types/upstream/request';
import type { RequestFields, Sequence } from '../../../types/upstream/collections';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { PhpArrayEntry, PhpAstValue } from '../lexer/PhpAst';
import type { PhpMethodAst } from '../lexer/phpMethodAstTypes';
import type { PhpClassPropertyAst } from '../lexer/phpAstDeclarationTypes';
import type { RequestProducerInput, RequestProducerInterface, RequestProducerResult } from '../../../types/upstream/requestProducerInterface';
import type { TypeInternerInterface } from '../../../types/upstream/typeInternerInterface';
import { parseCanonicalValidationRuleEntries } from './form-request';
import { RouteSemanticFlowValidationRuleSet } from '../descriptors/validation/validationRuleSet';
import { requestFieldFromSource } from './requestAstCanonical';
import { projectPhpStatementsToSourceStatements } from '../lexer/routeAst/phpAstExpressionSemanticAuthority';
import { expressionFromPhpAst } from './expressionProducer';

function seq<T>(items: readonly T[]): Sequence<T> {
    return items.reduceRight<Sequence<T>>(
        (tail, head) => ({ kind: 'cons', head, tail }),
        { kind: 'empty' },
    );
}

function authorization(method: PhpMethodAst, file: string): RequestAuthorization {
    const returned = method.body.find(statement => statement.kind === 'return_with_value');
    if (returned === undefined) {
        throw Error('FormRequest authorize() must return an expression at the AST boundary');
    }
    const expression = expressionFromPhpAst.project({ syntax: returned.expression, sourceFile: createSourceFile(file) });
    if (returned.expression.kind === 'literal' && returned.expression.literalType === 'boolean') {
        return returned.expression.value
            ? { kind: 'authorized', origin: { kind: 'source_explicit' } }
            : { kind: 'denied', origin: { kind: 'source_explicit' } };
    }
    return { kind: 'expression', expression, origin: { kind: 'source_explicit' } };
}

function lifecycle(methods: readonly PhpMethodAst[], file: string): RequestValidationLifecycle[] {
    const beforeFailedValidation = [
        { methodName: 'prepareForValidation', kind: 'prepare_for_validation' },
        { methodName: 'passedValidation', kind: 'passed_validation' },
        { methodName: 'failedAuthorization', kind: 'failed_authorization' },
    ] as const;
    const afterFailedValidation = [
        { methodName: 'after', kind: 'after_validation_source' },
        { methodName: 'withValidator', kind: 'with_validator_source' },
    ] as const;
    const entries: RequestValidationLifecycle[] = beforeFailedValidation.flatMap(entry => {
        const method = methods.find(candidate => candidate.name === entry.methodName);
        return method === undefined ? [] : [{ kind: entry.kind, statements: projectPhpStatementsToSourceStatements(method.body, file) }];
    });
    const failedValidation = methods.find(method => method.name === 'failedValidation');
    if (failedValidation !== undefined) {
        const validatorParameter = failedValidation.parameters.find(parameter => {
            const type = parameter.type.kind === 'nullable' ? parameter.type.inner : parameter.type;
            return type.kind === 'named' && /(^|\\)Validator$/.test(type.name);
        });
        if (validatorParameter !== undefined) {
            entries.push({
                kind: 'failed_validation',
                callback: {
                    kind: 'request_validation_callback',
                    validator: { kind: 'validator_parameter', name: { kind: 'string_value', value: validatorParameter.name } },
                    statements: projectPhpStatementsToSourceStatements(failedValidation.body, file),
                    source: sourceSpan(file, failedValidation),
                },
            });
        }
    }
    entries.push(...afterFailedValidation.flatMap(entry => {
        const method = methods.find(candidate => candidate.name === entry.methodName);
        return method === undefined ? [] : [{ kind: entry.kind, statements: projectPhpStatementsToSourceStatements(method.body, file) }];
    }));
    return entries;
}

function sourceSpan(file: string, method: PhpMethodAst): SourceSpan {
    return {
        kind: 'source_span',
        file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
        start: { kind: 'number_value', value: method.source.startOffset },
        end: { kind: 'number_value', value: method.source.endOffset },
    };
}

function literalString(value: PhpAstValue | undefined): string | undefined {
    return value !== undefined && value.kind === 'literal' && value.literalType === 'string' ? value.value : undefined;
}

function literalBoolean(value: PhpAstValue | undefined): boolean | undefined {
    return value !== undefined && value.kind === 'literal' && value.literalType === 'boolean' ? value.value : undefined;
}

function methodReturnArray(method: PhpMethodAst): readonly PhpArrayEntry[] {
    const returned = method.body.find(statement => statement.kind === 'return_with_value');
    return returned?.expression.kind === 'nested_array' ? returned.expression.entries : [];
}

function messages(method: PhpMethodAst, file: string): import('../../../types/upstream/request').RequestValidationMessages {
    const items: import('../../../types/upstream/request').RequestValidationMessage[] = methodReturnArray(method).flatMap(entry => {
        if (entry.kind !== 'keyed' || entry.key.kind !== 'string') {
            return [];
        }
        const field = entry.key.value;
        const message = literalString(entry.value);
        if (message === undefined) {
            return [];
        }
        const separator = field.lastIndexOf('.');
        const fieldPath = separator > 0 ? field.slice(0, separator) : field;
        const rule = separator > 0 ? field.slice(separator + 1) : '';
        const segments: PropertyName[] = fieldPath.split('.').filter(value => value.length > 0).map(value => ({
            kind: 'property_name',
            value: { kind: 'string_value', value },
        }));
        const item: import('../../../types/upstream/request').RequestValidationMessage = {
            kind: 'validation_message',
            field: { kind: 'property_path', segments: seq(segments) },
            rule: { kind: 'validation_rule_name', value: { kind: 'string_value', value: rule } },
            message: { kind: 'string_value', value: message },
            source: sourceSpan(file, method),
        };
        return [item];
    });
    return { kind: 'validation_messages', items: seq(items) };
}

function attributes(method: PhpMethodAst, file: string): import('../../../types/upstream/request').RequestValidationAttributes {
    const items: import('../../../types/upstream/request').RequestValidationAttribute[] = methodReturnArray(method).flatMap(entry => {
        if (entry.kind !== 'keyed' || entry.key.kind !== 'string') {
            return [];
        }
        const label = literalString(entry.value);
        if (label === undefined) {
            return [];
        }
        const segments: PropertyName[] = entry.key.value.split('.').filter(value => value.length > 0).map(value => ({
            kind: 'property_name',
            value: { kind: 'string_value', value },
        }));
        const item: import('../../../types/upstream/request').RequestValidationAttribute = {
            kind: 'validation_attribute',
            field: { kind: 'property_path', segments: seq(segments) },
            label: { kind: 'string_value', value: label },
            source: sourceSpan(file, method),
        };
        return [item];
    });
    return { kind: 'validation_attributes', items: seq(items) };
}

function propertyValue(properties: readonly PhpClassPropertyAst[], name: string): PhpAstValue | undefined {
    const property = properties.find(candidate => candidate.name === name);
    return property?.initialization.kind === 'present' ? property.initialization.value : undefined;
}

function validationPolicy(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestValidationPolicy {
    const stop = propertyValue(properties, 'stopOnFirstFailure');
    const unknown = propertyValue(properties, 'failOnUnknownFields');
    const stopValue = literalBoolean(stop);
    const unknownValue = literalBoolean(unknown);
    const failure = stopValue === true ? { kind: 'stop_on_first_failure' as const } : { kind: 'continue' as const };
    const unknownFields = unknownValue === undefined
        ? { kind: 'accepted' as const, origin: { kind: 'laravel_default' as const } }
        : unknownValue
            ? { kind: 'rejected' as const, origin: { kind: 'source_explicit' as const } }
            : { kind: 'accepted' as const, origin: { kind: 'source_explicit' as const } };
    return { kind: 'request_validation_policy', failure, unknownFields };
}

function failureResponse(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestFailureResponseConfiguration {
    const redirect = literalString(propertyValue(properties, 'redirect'));
    const redirectRoute = literalString(propertyValue(properties, 'redirectRoute'));
    const redirectAction = literalString(propertyValue(properties, 'redirectAction'));
    const errorBag = literalString(propertyValue(properties, 'errorBag'));
    const redirectValue = redirect !== undefined
        ? { kind: 'url' as const, value: { kind: 'string_value' as const, value: redirect } }
        : redirectRoute !== undefined
            ? { kind: 'route' as const, name: { kind: 'string_value' as const, value: redirectRoute } }
            : redirectAction !== undefined
                ? { kind: 'action' as const, name: { kind: 'string_value' as const, value: redirectAction } }
                : { kind: 'default' as const };
    const errorBagValue = errorBag === undefined
        ? { kind: 'default' as const }
        : { kind: 'error_bag' as const, name: { kind: 'string_value' as const, value: errorBag } };
    return { kind: 'request_failure_response_configuration', redirect: redirectValue, errorBag: errorBagValue };
}

type RequestProducerContract = RequestProducerInterface<readonly PhpArrayEntry[], PhpMethodAst, PhpClassPropertyAst>;
type RequestProducerContractInput = RequestProducerInput<readonly PhpArrayEntry[], PhpMethodAst, PhpClassPropertyAst>;

export const requestProducer: RequestProducerContract = Object.freeze({
    produce(input: RequestProducerContractInput): RequestAst {
        return requestProducer.produceResult(input).ast;
    },
    produceResult(input: RequestProducerContractInput): RequestProducerResult {
        const sourcePath = input.sourceFile.value.value;
        const validationEntries = parseCanonicalValidationRuleEntries(input.rules, sourcePath);
        const sourceFields = RouteSemanticFlowValidationRuleSet.create(validationEntries, input.interner).fields;
        const fields: RequestFields = { kind: 'request_fields', items: seq(sourceFields.map(requestFieldFromSource)) };
        const messagesMethod = input.methods.find(method => method.name === 'messages');
        const attributesMethod = input.methods.find(method => method.name === 'attributes');
        const validation: RequestDefinition['validation'] = {
            kind: 'form_request_validation',
            authorization: authorization(input.authorize, sourcePath),
            schema: {
                kind: 'request_schema',
                fields,
                policy: validationPolicy(input.properties),
                messages: messagesMethod === undefined
                    ? { kind: 'validation_messages', items: seq([]) }
                    : messages(messagesMethod, sourcePath),
                attributes: attributesMethod === undefined
                    ? { kind: 'validation_attributes', items: seq([]) }
                    : attributes(attributesMethod, sourcePath),
            },
            lifecycle: { kind: 'request_validation_lifecycles', items: seq(lifecycle(input.methods, sourcePath)) },
            failureResponse: failureResponse(input.properties),
            validatedInput: seq([]),
        };
        const http: RequestDefinition['http'] = {
            kind: 'request_http_context',
            method: { kind: 'unspecified' }, routeMethod: { kind: 'unspecified' }, path: { kind: 'unspecified' }, url: { kind: 'unspecified' }, host: { kind: 'unspecified' }, httpHost: { kind: 'unspecified' }, schemeAndHttpHost: { kind: 'unspecified' },
            inputAccesses: { kind: 'request_input_accesses', items: seq([]) },
        };
        const definition: RequestDefinition = { kind: 'request', identity: { kind: 'form_request_identity', request: input.requestName, formType: input.formType }, http, validation, source: input.source };
        const ast = createDomainAstJudgment({ kind: 'request_ast', semantic: definition, source: input.source });
        return { definition, ast };
    },
});
