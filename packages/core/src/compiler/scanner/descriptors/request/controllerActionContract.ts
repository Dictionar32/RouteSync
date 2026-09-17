import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import type { RouteSchemaPayload } from '../../../../types/route';
import { ScannedFormRequestDescriptor, type ResponseDescriptor } from '../../../../types/route';
import type { ControllerMethodAst, ControllerParameterAst, PhpParameterTypeAst } from '../../lexer/controllerAstTypes';
import type { ControllerExpressionContract } from './controllerExpressionContract';
import { resolveControllerExpression } from './controllerExpressionContract';
import { resolveResponseAttributeAst } from '../../subscanners/controller/responseAttributeScanner';
import { VoidResponseDescriptor } from '../../../../types/route';
import { resolveControllerBody, type ControllerBodyResolution } from '../../subscanners/controller/controllerBodyResolver';
import { resolveActionSchema } from '../../subscanners/controller/actionValidationExtractor';
import { createControllerDataflowContract, type ControllerDataflowContract } from '../../subscanners/controller/controllerDataflowContract';

export interface ControllerActionIdentity {
    readonly controllerName: string;
    readonly actionName: string;
}

export type RequestContract =
    | { readonly kind: 'none' }
    | { readonly kind: 'form_request'; readonly typeName: string }
    | { readonly kind: 'typed'; readonly type: PhpParameterTypeAst };

export type RuntimeReturnContract =
    | { readonly kind: 'none' }
    | { readonly kind: 'expression'; readonly expression: ControllerExpressionContract };

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
    readonly formRequestMap: ReadonlyMap<string, RequestType>;
    readonly projectRoot: string;
}

export function resolveControllerActionContract(
    method: ControllerMethodAst,
    controllerName: string,
    sourceFile: string,
    context: ControllerActionContractResolverContext
): ControllerActionContract {
    const body = resolveControllerBody(method.body);
    const returned = method.returns.length === 0
        ? { kind: 'absent' as const }
        : { kind: 'present' as const, value: method.returns[0].expression };
    const dataflow = createControllerDataflowContract(body.dataflow, method.parameters, returned);
    const request = resolveRequest(method.parameters, context.formRequestMap);
    return Object.freeze({
        identity: Object.freeze({ controllerName, actionName: method.name }),
        parameters: Object.freeze([...method.parameters]),
        request,
        response: resolveResponse(method, context.projectRoot),
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
    formRequestMap: ReadonlyMap<string, RequestType>
): RequestContract {
    const parameter = parameters[0];
    if (!parameter) return { kind: 'none' };
    if (parameter.type.kind !== 'named') return { kind: 'typed', type: parameter.type };
    return formRequestMap.has(parameter.type.name)
        ? { kind: 'form_request', typeName: parameter.type.name }
        : { kind: 'typed', type: parameter.type };
}

function resolveResponse(method: ControllerMethodAst, projectRoot: string): ResponseDescriptor {
    switch (method.responseAttribute.kind) {
        case 'absent':
            return new VoidResponseDescriptor();
        case 'declared':
            return resolveResponseAttributeAst(method.responseAttribute, projectRoot);
    }
}

function resolveRuntimeReturn(method: ControllerMethodAst): RuntimeReturnContract {
    const first = method.returns[0];
    return first ? { kind: 'expression', expression: resolveControllerExpression(first.expression) } : { kind: 'none' };
}

function resolveSchema(request: RequestContract, body: ControllerBodyResolution, formRequestMap: ReadonlyMap<string, RequestType>, sourceFile: string): RouteSchemaPayload {
    const formRequests = request.kind === 'form_request'
        ? [ScannedFormRequestDescriptor.create(request.typeName, sourceFile)]
        : [];
    return resolveActionSchema(formRequests, formRequestMap, body.schemaRules);
}
