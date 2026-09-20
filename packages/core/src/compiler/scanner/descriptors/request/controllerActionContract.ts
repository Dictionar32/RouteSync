import type { FormRequestSource, RouteRequestBinding } from '../../../../types/domain/request';
import type { RouteSchemaPayload } from '../../../../types/route';
import { ScannedFormRequestDescriptor, type ResponseDescriptor } from '../../../../types/route';
import type { ControllerMethodAst, ControllerParameterAst, PhpParameterTypeAst } from '../../lexer/controllerAstTypes';
import type { ControllerExpressionContract } from './controllerExpressionContract';
import { resolveControllerExpression } from './controllerExpressionContract';
import { resolveResponseAttributeAst } from '../../subscanners/controller/responseAttributeScanner';
import { VoidResponseDescriptor } from '../../../../types/route';
import { resolveControllerBody, type ControllerBodyResolution } from '../../subscanners/controller/controllerBodyResolver';
import { resolveActionSchema } from '../../subscanners/controller/actionValidationExtractor';
import { createControllerDataflowContract, createControllerReturnSet, type ControllerDataflowContract, type ControllerReturnSet } from '../../subscanners/controller/controllerDataflowContract';

export interface ControllerActionIdentity {
    readonly controllerName: string;
    readonly actionName: string;
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

export type RuntimeReturnContract =
    | { readonly kind: 'none' }
    | { readonly kind: 'expressions'; readonly expressions: readonly ControllerExpressionContract[] };

export interface ControllerActionContract {
    readonly identity: ControllerActionIdentity;
    readonly parameters: readonly ControllerParameterAst[];
    readonly request: RequestContract;
    readonly response: ResponseDescriptor;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly body: ControllerBodyResolution;
    readonly dataflow: ControllerDataflowContract;
    readonly schema: RouteSchemaPayload;
    readonly sourceFile: string;
    readonly sourceLine: number;
}

export interface ControllerActionContractResolverContext {
    readonly formRequestMap: ReadonlyMap<string, FormRequestSource>;
    readonly projectRoot: string;
}

export function resolveControllerActionContract(
    method: ControllerMethodAst,
    controllerName: string,
    sourceFile: string,
    context: ControllerActionContractResolverContext
): ControllerActionContract {
    const body = resolveControllerBody(method.body);
    const returned = createControllerReturnSet(method.returns.map(item => item.expression));
    const dataflow = createControllerDataflowContract(body.dataflow, method.parameters, returned);
    const request = resolveRequest(method.parameters, context.formRequestMap);
    return Object.freeze({
        identity: Object.freeze({ controllerName, actionName: method.name }),
        parameters: Object.freeze([...method.parameters]),
        request,
        response: resolveResponse(method, context.projectRoot, returned),
        runtimeReturn: resolveRuntimeReturn(method),
        body,
        dataflow,
        schema: resolveSchema(request, body, context.formRequestMap, sourceFile),
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

function resolveResponse(method: ControllerMethodAst, projectRoot: string, returned: ControllerReturnSet): ResponseDescriptor {
    switch (method.responseAttribute.kind) {
        case 'absent':
            return new VoidResponseDescriptor();
        case 'declared':
            return resolveResponseAttributeAst(method.responseAttribute, projectRoot, returned);
    }
}

function resolveRuntimeReturn(method: ControllerMethodAst): RuntimeReturnContract {
    if (method.returns.length === 0) return { kind: 'none' };
    return {
        kind: 'expressions',
        expressions: Object.freeze(method.returns.map(item => resolveControllerExpression(item.expression)))
    };
}

function resolveSchema(request: RequestContract, body: ControllerBodyResolution, formRequestMap: ReadonlyMap<string, FormRequestSource>, sourceFile: string): RouteSchemaPayload {
    const inlineSchema = body.schema;
    const requestBinding = request.kind === 'form_request' ? request : { kind: 'no_request' as const };
    const resolvedSchema = resolveActionSchema(requestBinding, formRequestMap, inlineSchema);
    return resolvedSchema;
}
