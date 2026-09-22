import type { FormRequestSource, RouteRequestBinding } from '../../../../types/domain/request';
import type { SourceProjectIdentity } from '../../../../types/upstream/highLevelSourceModel';
import { createActionName } from '../../../../types/domain/semanticValues';
import type { ActionName, ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { RouteSchemaPayload } from '../../../../types/route';
import { ScannedFormRequestDescriptor, type ResponseDescriptor } from '../../../../types/route';
import type { ControllerMethodAst, ControllerParameterAst, PhpParameterTypeAst } from '../../lexer/controllerAstTypes';
import type { ControllerRuntimeReturn } from '../../../../types/domain/controllerExpression';
import { mapResourcePhpAstToUpstream } from '../../subscanners/resource/resourceUpstreamExpressionCanonical';
import { resolveResponseAttributeAst } from '../../subscanners/controller/responseAttributeScanner';
import { VoidResponseDescriptor } from '../../../../types/route';
import { resolveControllerBody, type ControllerBodyResolution } from '../../subscanners/controller/controllerBodyResolver';
import { resolveActionSchema } from '../../subscanners/controller/actionValidationExtractor';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerDataflowContract, type ControllerReturnSet, type ControllerResourceResponseEvidence } from '../../subscanners/controller/controllerDataflowContract';

export interface ControllerActionIdentity {
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
}

export type ControllerRequestBinding =
    | { readonly kind: 'no_request' }
    | { readonly kind: 'form_request'; readonly source: FormRequestSource }
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
    readonly request: RequestContract;
    readonly response: ResponseDescriptor;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly body: ControllerBodyResolution;
    readonly dataflow: ControllerDataflowContract;
    readonly schema: RouteSchemaPayload;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
}

export interface ControllerActionContractResolverContext {
    readonly formRequestMap: ReadonlyMap<string, FormRequestSource>;
    readonly sourceProject: SourceProjectIdentity;
}

export function resolveControllerActionContract(
    method: ControllerMethodAst,
    controllerName: ControllerName,
    sourceFile: SourceFile,
    context: ControllerActionContractResolverContext
): ControllerActionContract {
    const body = resolveControllerBody(method.body);
    const returned = createControllerReturnSet(method.returns.map(item => item.expression));
    const response = resolveResponse(method, context.sourceProject, returned);
    const resourceResponse: ControllerResourceResponseEvidence = response.kind === 'resource'
        ? { kind: 'present', response: { kind: 'response_reference', name: response.responseTypeName() } }
        : { kind: 'absent' };
    const dataflow = createControllerDataflowContract(body.dataflow, method.parameters, returned, resourceResponse);
    const request = resolveRequest(method.parameters, context.formRequestMap);
    return Object.freeze({
        identity: Object.freeze({ controllerName, actionName: createActionName(method.name) }),
        parameters: Object.freeze([...method.parameters]),
        request,
        response,
        runtimeReturn: resolveRuntimeReturn(method),
        body,
        dataflow,
        schema: resolveSchema(request, body, context.formRequestMap, sourceFile.value.value),
        sourceFile,
        sourceLine: method.source.line,
    });
}

function resolveRequest(
    parameters: readonly ControllerParameterAst[],
    formRequestMap: ReadonlyMap<string, FormRequestSource>
): RequestContract {
    const parameter = parameters[0];
    if (!parameter) return { kind: 'no_request' };
    if (parameter.type.kind !== 'named') return { kind: 'typed', type: parameter.type };
    const source = formRequestMap.get(parameter.type.name);
    return source === undefined
        ? { kind: 'typed', type: parameter.type }
        : { kind: 'form_request', source };
}

function resolveResponse(method: ControllerMethodAst, sourceProject: SourceProjectIdentity, returned: ControllerReturnSet): ResponseDescriptor {
    switch (method.responseAttribute.kind) {
        case 'absent':
            return new VoidResponseDescriptor();
        case 'declared':
            return resolveResponseAttributeAst(method.responseAttribute, sourceProject, returned);
    }
}

function resolveRuntimeReturn(method: ControllerMethodAst): RuntimeReturnContract {
    if (method.returns.length === 0) return { kind: 'none' };
    return {
        kind: 'expressions',
        expressions: Object.freeze(method.returns.map(item => mapResourcePhpAstToUpstream(item.expression, '<controller-action>')))
    };
}

function resolveSchema(request: RequestContract, body: ControllerBodyResolution, formRequestMap: ReadonlyMap<string, FormRequestSource>, sourceFile: string): RouteSchemaPayload {
    const inlineSchema = body.schema;
    const requestBinding = request.kind === 'form_request' ? request : { kind: 'no_request' as const };
    const resolvedSchema = resolveActionSchema(requestBinding, formRequestMap, inlineSchema);
    return resolvedSchema;
}
