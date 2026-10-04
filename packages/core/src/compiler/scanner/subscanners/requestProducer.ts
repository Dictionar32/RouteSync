import { createDomainAstJudgment, type RequestAst } from '../../../types/upstream/ast';
import type { RequestDefinition, RequestAuthorization, RequestValidationLifecycle } from '../../../types/upstream/request';
import type { RequestFields, Sequence } from '../../../types/upstream/collections';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { RequestName, FormTypeName } from '../../../types/upstream/names';
import type { PhpArrayEntry } from '../lexer/PhpAst';
import type { PhpAstValue, PhpMethodAst } from '../lexer/phpMethodAstTypes';
import type { PhpClassPropertyAst } from '../lexer/phpAstDeclarationTypes';
import type { TypeInterner } from '../../types/TypeInterner';
import { parseCanonicalValidationRuleEntries } from './form-request';
import { RouteSemanticFlowValidationRuleSet } from '../descriptors/validation/validationRuleSet';
import { requestFieldFromSource } from './requestAstCanonical';
import { mapResourcePhpStatementsToSourceStatements } from './resource/resourceUpstreamExpressionCanonical';
import { expressionFromPhpAst } from './expressionProducer';
import { relationAll, relationEqual, relationSome, relationNone } from '../../../semantic/kernel/semanticRelations';
import { relationExpand, relationFirst, relationGate, relationAdvanceIndex, relationOptionFold, relationProject, relationSelect, relationSlice } from '../../../semantic/kernel/relationalSequence';

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

const seq = <T>(items: readonly T[], index = 0, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> =>
    relationGate(index < items.length, () => seq(items, relationAdvanceIndex(index, 1), { kind: 'cons', head: items[items.length - index - 1], tail }), () => tail);

function authorization(method: PhpMethodAst, file: string): RequestAuthorization {
    const returned = relationFirst(method.body, statement => relationEqual(statement.kind, 'return_with_value'));
    return relationOptionFold(
        returned,
        () => { throw Error('FormRequest authorize() must return an expression at the AST boundary'); },
        statement => {
            const expression = expressionFromPhpAst(statement.expression, file);
            return relationGate(
                relationAll([relationEqual(statement.expression.kind, 'literal'), relationEqual(statement.expression.value.kind, 'boolean')]),
                () => relationGate(statement.expression.value.value, () => ({ kind: 'authorized', origin: { kind: 'source_explicit' } }), () => ({ kind: 'denied', origin: { kind: 'source_explicit' }})),
                () => ({ kind: 'expression', expression, origin: { kind: 'source_explicit' } }),
            );
        },
    );
}

function lifecycleEntry<T>(entry: import('../../../semantic/kernel/relationalSequence').RelationOption<T>, index: number, file: string): readonly RequestValidationLifecycle[] {
    return relationGate(relationEqual(index, 0),
        () => relationOptionFold(entry, () => [], statements => [{ kind: 'prepare_for_validation', statements }]),
        () => relationGate(relationEqual(index, 1),
            () => relationOptionFold(entry, () => [], statements => [{ kind: 'passed_validation', statements }]),
            () => relationGate(relationEqual(index, 2),
                () => relationOptionFold(entry, () => [], statements => [{ kind: 'failed_authorization', statements }]),
                () => relationGate(relationEqual(index, 4),
                    () => relationOptionFold(entry, () => [], statements => [{ kind: 'after_validation_source', statements }]),
                    () => relationGate(relationEqual(index, 5),
                        () => relationOptionFold(entry, () => [], statements => [{ kind: 'with_validator_source', statements }]),
                        () => relationOptionFold(entry, () => [], method => {
                            const validatorParameter = relationFirst(method.parameters, parameter => {
                                const type = relationGate(relationEqual(parameter.type.kind, 'nullable'), () => parameter.type.inner, () => parameter.type);
                                return relationAll([relationEqual(type.kind, 'named'), /(^|\\)Validator$/.test(type.name.value)]);
                            });
                            return relationOptionFold(validatorParameter, () => [], parameter => [{
                                kind: 'failed_validation',
                                callback: {
                                    kind: 'request_validation_callback',
                                    validator: { kind: 'validator_parameter', name: { kind: 'string_value', value: parameter.name.value } },
                                    statements: mapResourcePhpStatementsToSourceStatements(method.body, file),
                                    source: sourceSpan(file, method),
                                },
                            }]);
                        }),
                    ),
                ),
            ),
        ),
    );
}

function lifecycle(methods: readonly PhpMethodAst[], file: string): RequestValidationLifecycle[] {
    const statements = (name: string) => relationOptionFold(
        relationFirst(methods, method => relationEqual(method.name.value, name)),
        () => relationNone<ReturnType<typeof mapResourcePhpStatementsToSourceStatements>>(),
        method => relationSome(mapResourcePhpStatementsToSourceStatements(method.body, file)),
    );
    const entries = [
        statements('prepareForValidation'),
        statements('passedValidation'),
        statements('failedAuthorization'),
        relationFirst(methods, method => relationEqual(method.name.value, 'failedValidation')),
        statements('after'),
        statements('withValidator'),
    ] as const;
    return [...relationExpand(entries, (entry, index) => lifecycleEntry(entry, index, file))];
}

function sourceSpan(file: string, method: PhpMethodAst): SourceSpan {
    return { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: file } }, start: { kind: 'number_value', value: method.source.start }, end: { kind: 'number_value', value: method.source.end } };
}

function literalString(value: PhpAstValue): import('../../../semantic/kernel/relationalSequence').RelationOption<string> {
    return relationGate(
        relationAll([relationEqual(value.kind, 'literal'), relationEqual(value.literalType, 'string')]),
        () => relationSome(value.value),
        () => relationNone(),
    );
}

function literalBoolean(value: PhpAstValue): import('../../../semantic/kernel/relationalSequence').RelationOption<boolean> {
    return relationGate(
        relationAll([relationEqual(value.kind, 'literal'), relationEqual(value.literalType, 'boolean')]),
        () => relationSome(value.value),
        () => relationNone(),
    );
}

function methodReturnArray(method: PhpMethodAst): readonly PhpArrayEntry[] {
    const returned = relationFirst(method.body, statement => relationEqual(statement.kind, 'return_with_value'));
    return relationOptionFold(returned, () => [], statement => relationGate(relationEqual(statement.expression.kind, 'nested_array'), () => statement.expression.entries, () => []));
}

function messages(method: PhpMethodAst, file: string): import('../../../types/upstream/request').RequestValidationMessages {
    const items = relationExpand(methodReturnArray(method), entry => {
        const field = relationGate(relationEqual(entry.key.kind, 'string'), () => relationSome(entry.key.value), () => relationNone<string>());
        const message = literalString(entry.value);
        return relationOptionFold(field, () => [], fieldValue => relationOptionFold(message, () => [], messageValue => {
            const separator = fieldValue.lastIndexOf('.');
            const fieldPath = relationGate(separator > 0, () => relationSlice(Array.from(fieldValue), 0, separator).join(''), () => fieldValue);
            const rule = relationGate(separator > 0, () => relationSlice(Array.from(fieldValue), separator + 1, fieldValue.length).join(''), () => '');
            const segments = relationProject(relationSelect(fieldPath.split('.'), value => value.length > 0), value => ({ kind: 'property_name', value: { kind: 'string_value', value } }));
            return [{ kind: 'validation_message', field: { kind: 'property_path', segments: seq(segments) }, rule: { kind: 'validation_rule_name', value: { kind: 'string_value', value: rule } }, message: { kind: 'string_value', value: messageValue }, source: sourceSpan(file, method) }];
        }));
    });
    return { kind: 'validation_messages', items: seq(items) };
}

function attributes(method: PhpMethodAst, file: string): import('../../../types/upstream/request').RequestValidationAttributes {
    const items = relationExpand(methodReturnArray(method), entry => {
        const field = relationGate(relationEqual(entry.key.kind, 'string'), () => relationSome(entry.key.value), () => relationNone<string>());
        const label = literalString(entry.value);
        return relationOptionFold(field, () => [], fieldValue => relationOptionFold(label, () => [], labelValue => {
            const segments = relationProject(relationSelect(fieldValue.split('.'), value => value.length > 0), value => ({ kind: 'property_name', value: { kind: 'string_value', value } }));
            return [{ kind: 'validation_attribute', field: { kind: 'property_path', segments: seq(segments) }, label: { kind: 'string_value', value: labelValue }, source: sourceSpan(file, method) }];
        }));
    });
    return { kind: 'validation_attributes', items: seq(items) };
}

function propertyValue(properties: readonly PhpClassPropertyAst[], name: string): import('../../../semantic/kernel/relationalSequence').RelationOption<PhpAstValue> {
    return relationOptionFold(
        relationFirst(properties, item => relationEqual(item.name.value, name)),
        () => relationNone(),
        property => relationGate(relationEqual(property.initialization.kind, 'present'), () => relationSome(property.initialization.value), () => relationNone()),
    );
}

function validationPolicy(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestValidationPolicy {
    const stop = relationOptionFold(propertyValue(properties, 'stopOnFirstFailure'), () => relationNone<boolean>(), literalBoolean);
    const unknown = relationOptionFold(propertyValue(properties, 'failOnUnknownFields'), () => relationNone<boolean>(), literalBoolean);
    const failure = relationOptionFold(stop, () => ({ kind: 'continue' }), value => relationGate(value, () => ({ kind: 'stop_on_first_failure' }), () => ({ kind: 'continue' })));
    const unknownFields = relationOptionFold(unknown,
        () => ({ kind: 'accepted', origin: { kind: 'laravel_default' } }),
        value => relationGate(value, () => ({ kind: 'rejected', origin: { kind: 'source_explicit' } }), () => ({ kind: 'accepted', origin: { kind: 'source_explicit' } })),
    );
    return { kind: 'request_validation_policy', failure, unknownFields };
}

function failureResponse(properties: readonly PhpClassPropertyAst[]): import('../../../types/upstream/request').RequestFailureResponseConfiguration {
    const redirect = relationOptionFold(propertyValue(properties, 'redirect'), () => relationNone<string>(), literalString);
    const redirectRoute = relationOptionFold(propertyValue(properties, 'redirectRoute'), () => relationNone<string>(), literalString);
    const redirectAction = relationOptionFold(propertyValue(properties, 'redirectAction'), () => relationNone<string>(), literalString);
    const errorBag = relationOptionFold(propertyValue(properties, 'errorBag'), () => relationNone<string>(), literalString);
    const redirectValue = relationOptionFold(redirect,
        () => relationOptionFold(redirectRoute, () => relationOptionFold(redirectAction, () => ({ kind: 'default' }), name => ({ kind: 'action', name: { kind: 'string_value', value: name } })), name => ({ kind: 'route', name: { kind: 'string_value', value: name } })),
        value => ({ kind: 'url', value: { kind: 'string_value', value } }),
    );
    const errorBagValue = relationOptionFold(errorBag, () => ({ kind: 'default' }), name => ({ kind: 'error_bag', name: { kind: 'string_value', value: name } }));
    return { kind: 'request_failure_response_configuration', redirect: redirectValue, errorBag: errorBagValue };
}

export const requestProducer: RequestProducer = {
    produce(input): RequestAst {
        const validationEntries = parseCanonicalValidationRuleEntries(input.rules, input.sourceFile);
        const sourceFields = RouteSemanticFlowValidationRuleSet.create(validationEntries, input.interner).fields;
        const fields: RequestFields = { kind: 'request_fields', items: seq(relationProject(sourceFields, requestFieldFromSource)) };
        const messagesMethod = relationOptionFold(relationFirst(input.methods, method => relationEqual(method.name.value, 'messages')), () => relationNone<PhpMethodAst>(), relationSome);
        const attributesMethod = relationOptionFold(relationFirst(input.methods, method => relationEqual(method.name.value, 'attributes')), () => relationNone<PhpMethodAst>(), relationSome);
        const validation = {
            kind: 'form_request_validation',
            authorization: authorization(input.authorize, input.sourceFile),
            schema: {
                kind: 'request_schema',
                fields,
                policy: validationPolicy(input.properties),
                messages: relationOptionFold(messagesMethod, () => ({ kind: 'validation_messages', items: seq([]) }), method => messages(method, input.sourceFile)),
                attributes: relationOptionFold(attributesMethod, () => ({ kind: 'validation_attributes', items: seq([]) }), method => attributes(method, input.sourceFile)),
            },
            lifecycle: { kind: 'request_validation_lifecycles', items: seq(lifecycle(input.methods, input.sourceFile)) },
            failureResponse: failureResponse(input.properties),
            validatedInput: seq([]),
        };
        const http = {
            kind: 'request_http_context',
            method: { kind: 'unspecified' }, routeMethod: { kind: 'unspecified' }, path: { kind: 'unspecified' }, url: { kind: 'unspecified' }, host: { kind: 'unspecified' }, httpHost: { kind: 'unspecified' }, schemeAndHttpHost: { kind: 'unspecified' },
            inputAccesses: { kind: 'request_input_accesses', items: seq([]) },
        };
        const definition: RequestDefinition = { kind: 'request', identity: { kind: 'form_request_identity', request: input.requestName, formType: input.formType }, http, validation, source: input.source };
        return createDomainAstJudgment({ kind: 'request_ast', semantic: definition, source: input.source });
    },
};
