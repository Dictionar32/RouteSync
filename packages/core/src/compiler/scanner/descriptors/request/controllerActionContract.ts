import { type RelationIndex, relationIndexLookup } from '../../../../semantic/foundation/relationMembership';
import type { FormRequestSource } from '../../../../types/domain/request';
import type { SourceProjectIdentity } from '../../../../types/upstream/highLevelSourceModel';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { createActionName, createClassName, type ActionName, type ControllerName, type SourceFile, type VariableName } from '../../../../types/upstream/names';
import type { RouteSchemaPayload } from '../../../../types/route';
import { ScannedFormRequestDescriptor, type ResponseDescriptor } from '../../../../types/route';
import type { ControllerMethodAst, ControllerParameterAst, PhpParameterTypeAst } from '../../lexer/controllerAstTypes';
import type { ControllerRuntimeReturn } from '../../../../types/domain/controllerExpression';
import type { ControllerContextualAttributeName, ControllerDependency, ControllerDependencyInjection, ControllerDependencyResolution, ControllerVariableSemantic } from '../../../../types/upstream/controller';
import { mapResourcePhpAstToUpstream } from '../../subscanners/resource/resourceUpstreamExpressionCanonical';
import { resolveResponseAttributeAst } from '../../subscanners/controller/responseAttributeScanner';
import { VoidResponseDescriptor } from '../../../../types/route';
import { resolveControllerBody, type ControllerBodyResolution } from '../../subscanners/controller/controllerBodyResolver';
import { resolveActionSchema } from '../../subscanners/controller/actionValidationExtractor';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerDataflowContract, type ControllerReturnSet, type ControllerResourceResponseEvidence } from '../../subscanners/controller/controllerDataflowContract';
import { controllerReturnSemanticFromMethod } from '../../subscanners/controller/controllerAstCanonical';
import { expressionFromPhpAst } from '../../subscanners/expressionProducer';
import type { ExpressionArgument, ExpressionArguments } from '../../../../types/upstream/expression';
import { sequence } from '../../subscanners/resource/resourceUpstreamExpressionMappings';

export interface ControllerActionIdentity {
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
}

export type ControllerRequestBinding =
    | { readonly kind: 'no_request' }
    | { readonly kind: 'form_request'; readonly source: FormRequestSource }
    | { readonly kind: 'framework_request'; readonly type: import('../../../../types/upstream/names').ClassName }
    | { readonly kind: 'typed'; readonly type: PhpParameterTypeAst };

/**
 * Controller-level request fact. It intentionally does not masquerade as the
 * route-level binding, because resource identity is not known at this origin.
 */
export type RequestContract = ControllerRequestBinding;

export type RuntimeReturnContract = ControllerRuntimeReturn;

export interface ControllerActionContract {
    readonly identity: ControllerActionIdentity;
    readonly parameters: readonly ControllerParameterAst[];
    /** All container-resolved controller dependencies attached to this action, including constructor injection. */
    readonly dependencies: readonly ControllerDependency[];
    readonly request: RequestContract;
    readonly response: ResponseDescriptor;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly semanticReturn: import('../../../../types/upstream/controller').ControllerReturnSemantic;
    readonly body: ControllerBodyResolution;
    readonly dataflow: ControllerDataflowContract;
    readonly schema: RouteSchemaPayload;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
}

export interface ControllerActionContractResolverContext {
    readonly formRequestIndex: RelationIndex<string, FormRequestSource>;
    readonly sourceProject: SourceProjectIdentity;
    /** Controller constructor parameters are resolved by the container across each action on the controller. */
    readonly constructorParameters?: readonly ControllerParameterAst[];
    readonly customContextualAttributeNames?: RelationMembership<string>;
}

import { relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationContains, type RelationMembership } from '../../../../semantic/foundation/relationMembership';
import { relationFirstOption, relationGate, relationIsNone, relationIsPresent, relationNone, relationOptionFold, relationProject, relationSelect, relationSome, relationVariantValue, type RelationOption, type RelationVariant } from '../../../../semantic/foundation/relationalSequence';
export function resolveControllerActionContract(
    method: ControllerMethodAst,
    controllerName: ControllerName,
    sourceFile: SourceFile,
    context: ControllerActionContractResolverContext
): ControllerActionContract {
    const body = resolveControllerBody(method.body);
    const returned = createControllerReturnSet(relationProject(method.returns, item => item.expression));
    const response = resolveResponse(method, context.sourceProject, returned);
    const semanticReturn = relationGate(
        relationEqual(response.kind, 'resource'),
        () => controllerReturnSemanticFromMethod(method, sourceFile.value.value, {
            kind: 'response_present',
            response: { kind: 'response_reference', name: response.responseTypeName() },
        }) as import('../../../../types/upstream/controller').ControllerReturnSemantic,
        () => controllerReturnSemanticFromMethod(method, sourceFile.value.value, { kind: 'response_absent' }) as import('../../../../types/upstream/controller').ControllerReturnSemantic,
    );
    const resourceResponse: ControllerResourceResponseEvidence = relationGate(
        relationEqual(response.kind, 'resource'),
        () => ({ kind: 'present', response: { kind: 'response_reference', name: response.responseTypeName() } }),
        () => ({ kind: 'absent' }) as ControllerResourceResponseEvidence,
    );
    const dataflow = createControllerDataflowContract(body.dataflow, method.parameters, returned, resourceResponse, sourceFile.value.value);
    const request = resolveRequest(method.parameters, context.formRequestIndex);
    const constructorParameters = relationOptionFold(
        relationFirstOption([context.constructorParameters], (candidate): candidate is readonly ControllerParameterAst[] => Object.is(typeof candidate, 'object')),
        () => [] as readonly ControllerParameterAst[],
        value => value,
    );
    const contextualNames = relationOptionFold(
        relationFirstOption([context.customContextualAttributeNames], (candidate): candidate is RelationMembership<string> => Object.is(typeof candidate, 'object')),
        () => Object.freeze([] as string[]),
        value => value,
    );
    const constructorDependencies = resolveConstructorDependencies(constructorParameters, contextualNames);
    const methodDependencies = resolveMethodDependencies(method.parameters, contextualNames);
    const dependencies = Object.freeze([...constructorDependencies, ...methodDependencies]);
    return Object.freeze({
        identity: Object.freeze({ controllerName, actionName: createActionName(method.name) }),
        parameters: Object.freeze([...method.parameters]),
        request,
        response,
        dependencies,
        runtimeReturn: resolveRuntimeReturn(method),
        semanticReturn,
        body,
        dataflow,
        schema: resolveSchema(request, body),
        sourceFile,
        sourceLine: method.source.line,
    });
}

function controllerParameterClassName(semantic: ControllerVariableSemantic): RelationOption<string> {
    return relationGate(
        relationEqual(semantic.kind, 'model_origin'),
        () => {
            const origin = semantic.origin;
            return relationGate(
                relationEqual(origin.kind, 'model_class'),
                () => relationSome(origin.name.value.value),
                () => relationNone<string>(),
            );
        },
        () => relationGate(
            relationEqual(semantic.kind, 'request_origin'),
            () => relationSome(semantic.name.value.value),
            () => relationNone<string>(),
        ),
    );
}

function resolveConstructorDependencies(
    parameters: readonly ControllerParameterAst[],
    customContextualAttributeNames: RelationMembership<string>
): readonly ControllerDependency[] {
    const candidates = relationProject(parameters, parameter => {
        const type = controllerParameterClassName(parameter.semantic);
        return relationOptionFold(type, () => relationNone<ControllerDependency>(), typeName => relationSome<ControllerDependency>({
            kind: 'controller_dependency',
            injection: { kind: 'constructor' } satisfies ControllerDependencyInjection,
            resolution: resolveDependencyResolution(parameter, customContextualAttributeNames),
            parameter: createVariableName(parameter.name),
            type: createClassName(typeName),
        }));
    });
    return Object.freeze(relationProject(relationSelect(candidates, relationIsPresent), candidate => relationOptionFold(candidate, () => { throw Error('unreachable relation absence'); }, value => value)));
}

function resolveMethodDependencies(
    parameters: readonly ControllerParameterAst[],
    customContextualAttributeNames: RelationMembership<string>
): readonly ControllerDependency[] {
    const candidates = relationProject(parameters, parameter => {
        const type = controllerParameterClassName(parameter.semantic);
        return relationOptionFold(type, () => relationNone<ControllerDependency>(), typeName => {
            const contextualResolution = resolveContextualAttributeResolution(parameter, customContextualAttributeNames);
            const excluded = relationAny([
                relationIsPresent(contextualResolution),
                relationEqual(parameter.semantic.kind, 'model_origin'),
                relationEqual(parameter.semantic.kind, 'request_origin'),
            ]);
            return relationGate(excluded, () => relationNone<ControllerDependency>(), () => relationSome<ControllerDependency>({
                kind: 'controller_dependency',
                injection: { kind: 'method' } satisfies ControllerDependencyInjection,
                resolution: resolveDependencyResolution(parameter, customContextualAttributeNames),
                parameter: createVariableName(parameter.name),
                type: createClassName(typeName),
            }));
        });
    });
    return Object.freeze(relationProject(relationSelect(candidates, relationIsPresent), candidate => relationOptionFold(candidate, () => { throw Error('unreachable relation absence'); }, value => value)));
}

function resolveDependencyResolution(parameter: ControllerParameterAst, customContextualAttributeNames: RelationMembership<string>): ControllerDependencyResolution {
    return relationOptionFold(resolveContextualAttributeResolution(parameter, customContextualAttributeNames), () => ({ kind: 'container' as const }), value => value);
}

function resolveContextualAttributeResolution(
    parameter: ControllerParameterAst,
    customContextualAttributeNames: RelationMembership<string>
): RelationOption<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>> {
    const candidates = relationProject(parameter.attributes, attribute => {
        const known = contextualAttributeName(attribute.name);
        return relationOptionFold<ControllerContextualAttributeName, RelationOption<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>>>(known,
            () => {
                const normalized = relationOptionFold(
                    relationFirstOption(attribute.name.split('\\').reverse(), value => value.length > 0),
                    () => attribute.name,
                    value => value,
                );
                const custom = relationAny([
                    relationContains(customContextualAttributeNames, attribute.name),
                    relationContains(customContextualAttributeNames, normalized),
                ]);
                return relationGate(custom, () => relationSome<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>>({
                    kind: 'contextual_attribute',
                    attribute: {
                        kind: 'custom_contextual_attribute',
                        name: createClassName(attribute.name),
                        arguments: expressionArgumentsFromParameterAttribute(attribute, '<controller-parameter>'),
                    },
                }), () => relationNone<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>>());
            },
            name => relationSome<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>>({
                kind: 'contextual_attribute',
                attribute: {
                    kind: 'laravel_contextual_attribute',
                    name,
                    arguments: expressionArgumentsFromParameterAttribute(attribute, '<controller-parameter>'),
                },
            }),
        );
    });
    return relationOptionFold(relationFirstOption(candidates, relationIsPresent), () => relationNone<RelationVariant<ControllerDependencyResolution, 'contextual_attribute'>>(), candidate => candidate);
}

const FRAMEWORK_REQUEST_TYPE_KNOWLEDGE: Readonly<Record<string, true>> = Object.freeze({
    Request: true,
    'Illuminate\\Http\\Request': true,
});

const CONTEXTUAL_ATTRIBUTE_KNOWLEDGE: Readonly<Record<string, ControllerContextualAttributeName>> = Object.freeze({
    Auth: 'auth',
    Authenticated: 'authenticated',
    Cache: 'cache',
    Config: 'config',
    Context: 'context',
    DB: 'db',
    Database: 'database',
    Give: 'give',
    Log: 'log',
    RequestAttribute: 'request_attribute',
    RouteParameter: 'route_parameter',
    Storage: 'storage',
    Tag: 'tag',
    CurrentUser: 'current_user',
});

function contextualAttributeName(value: string): RelationOption<ControllerContextualAttributeName> {
    const normalized = relationOptionFold(
        relationFirstOption(value.split('\\').reverse(), item => item.length > 0),
        () => value,
        item => item,
    );
    return relationFirstOption([CONTEXTUAL_ATTRIBUTE_KNOWLEDGE[normalized]], (candidate): candidate is ControllerContextualAttributeName => relationEqual(typeof candidate, 'string'));
}

function expressionArgumentsFromParameterAttribute(attribute: ControllerParameterAst['attributes'][number], file: string): ExpressionArguments {
    const items: readonly ExpressionArgument[] = relationProject(attribute.arguments, argument => relationGate(
        relationEqual(argument.kind, 'positional'),
        () => ({ kind: 'positional', value: expressionFromPhpAst(argument.value, file) }),
        () => relationGate(
            relationEqual(argument.kind, 'unpacked'),
            () => ({ kind: 'unpacked', value: expressionFromPhpAst(argument.value, file) }),
            () => {
                const named = relationVariantValue(argument, 'named');
                return {
                    kind: 'named',
                    name: { kind: 'expression_argument_name', value: { kind: 'string_value', value: named.name } },
                    value: expressionFromPhpAst(named.value, file),
                };
            },
        ),
    ));
    return {
        kind: 'expression_arguments',
        items: sequence(items),
    };
}

function createVariableName(value: string): VariableName {
    return { kind: 'variable_name', value: { kind: 'string_value', value } };
}


function resolveRequest(
    parameters: readonly ControllerParameterAst[],
    formRequestIndex: RelationIndex<string, FormRequestSource>
): RequestContract {
    const candidates = relationProject(parameters, parameter => {
        const typeName = relationGate(
            relationEqual(parameter.semantic.kind, 'request_origin'),
            () => relationSome(parameter.semantic.name.value.value),
            () => relationNone<string>(),
        );
        return relationOptionFold(typeName, () => relationNone<RequestContract>(), name => {
            const source = relationIndexLookup(formRequestIndex, name);
            return relationGate(
                relationEqual(source.kind, 'some'),
                () => relationOptionFold(source, () => relationNone<RequestContract>(), value => relationSome<RequestContract>({ kind: 'form_request', source: value })),
                () => relationGate(
                    relationEqual(FRAMEWORK_REQUEST_TYPE_KNOWLEDGE[name], true),
                    () => relationSome<RequestContract>({ kind: 'framework_request', type: SemanticValueFactory.className(name) }),
                    () => relationNone<RequestContract>(),
                ),
            );
        });
    });
    return relationOptionFold(relationFirstOption(candidates, relationIsPresent), () => ({ kind: 'no_request' as const }), candidate => relationOptionFold(candidate, () => ({ kind: 'no_request' as const }), value => value));
}

function resolveResponse(method: ControllerMethodAst, sourceProject: SourceProjectIdentity, returned: ControllerReturnSet): ResponseDescriptor {
    return relationGate(
        relationEqual(method.responseAttribute.kind, 'absent'),
        () => VoidResponseDescriptor.create(),
        () => resolveResponseAttributeAst(relationVariantValue(method.responseAttribute, 'declared'), sourceProject, returned),
    );
}

function resolveRuntimeReturn(method: ControllerMethodAst): RuntimeReturnContract {
    return relationGate(
        relationEqual(method.returns.length, 0),
        () => ({ kind: 'none' as const }),
        () => ({
            kind: 'expressions',
            expressions: Object.freeze(relationProject(method.returns, item => mapResourcePhpAstToUpstream(item.expression, '<controller-action>'))),
        }),
    );
}

function resolveSchema(request: RequestContract, body: ControllerBodyResolution): RouteSchemaPayload {
    return resolveActionSchema(request, body.schema);
}
