import { routeRequestSchemaEvidenceFactory } from "../../../../../types/upstream/controllerActionSchemaSemanticJudgmentAuthority";
/**
 * AST descriptor for a scanned controller action.
 * Semantic construction is an immutable structural projection.
 */
import {
    VoidResponseDescriptor,
    type RouteSchemaPayload,
    type ResponseDescriptor,
    type HttpErrorResponseDescriptor
} from "../../../../../types/route";
import { emptyRouteSchemaPayload } from "../../../../../types/domain/validationRules";
import {
    type ControllerActionInfo,
    type ScannedControllerActionParams,
    type ControllerActionCreateOptions,
    controllerActionTypeOperations
} from "./controllerActionTypes";
import type { ActionName, ControllerName, SourceFile } from "../../../../../types/upstream/names";
import type { ControllerParameterAst } from '../../../../frontend/php/controllerAstTypes';
import type { ControllerRequestBinding } from './controllerActionContract';
import { createActionName, createControllerName, sourceFileIdentityFactory, stringValue } from "../../../../../types/domain/semanticValues";

export type { ControllerActionInfo, ScannedControllerActionParams, ControllerActionCreateOptions };

export type ScannedControllerActionDescriptor = ControllerActionInfo;

const createControllerActionDescriptor = (params: ScannedControllerActionParams): ScannedControllerActionDescriptor => Object.freeze({
    controllerName: params.controllerName,
    actionName: params.actionName,
    handler: params.handler,
    sourceFile: params.sourceFile,
    sourceLine: params.sourceLine,
    response: params.response,
    runtimeReturn: params.runtimeReturn,
    semanticReturn: params.semanticReturn,
    request: params.request,
    schema: params.schema,
    schemaEvidence: params.schemaEvidence,
    dataflow: params.dataflow,
    errorResponses: Object.freeze([...params.errorResponses]),
    parameters: Object.freeze([...params.parameters]),
});

export const ScannedControllerActionDescriptor = Object.freeze({
    create(params: ControllerActionCreateOptions): ScannedControllerActionDescriptor {
        return createControllerActionDescriptor({
            controllerName: params.controllerName,
            actionName: params.actionName,
            handler: controllerActionTypeOperations.buildRouteHandler(params.controllerName, params.actionName),
            sourceFile: params.sourceFile,
            sourceLine: params.sourceLine,
            response: params.response,
            runtimeReturn: params.runtimeReturn,
            semanticReturn: params.semanticReturn,
            request: params.request,
            schema: params.schema,
            schemaEvidence: params.schemaEvidence,
            dataflow: params.dataflow,
            errorResponses: Object.freeze([...params.errorResponses]),
            parameters: Object.freeze([...params.parameters]),
        });
    },
    empty(controllerName: string, actionName: string, sourceFile: string): ScannedControllerActionDescriptor {
        return createControllerActionDescriptor({
            controllerName: createControllerName(controllerName),
            actionName: createActionName(actionName),
            sourceFile: sourceFileIdentityFactory.create(stringValue.create(sourceFile)),
            sourceLine: 1,
            response: VoidResponseDescriptor.create(),
            runtimeReturn: { kind: 'none' },
            semanticReturn: { kind: 'absent' },
            request: { kind: 'no_request' },
            schema: emptyRouteSchemaPayload(),
            schemaEvidence: routeRequestSchemaEvidenceFactory.unavailable<SourceFile>('non_controller_route_target'),
            dataflow: Object.freeze({ semantic: Object.freeze({ variables: Object.freeze({ kind: 'empty' as const }) }), resourceBindings: Object.freeze([]) }),
            errorResponses: [],
            parameters: [],
            handler: controllerActionTypeOperations.buildRouteHandler(createControllerName(controllerName), createActionName(actionName)),
        });
    },
});
