/**
 * routeDeclarations.ts
 *
 * Structural route semantic projection. The route descriptor is an immutable
 * semantic witness assembled from the four closed sub-contracts; construction
 * is a relation projection, not a class/constructor boundary.
 */

import type {
    RouteSemanticFlow,
    HttpMethod,
    RouteActionKind,
    CrudRole,
    RouteHookKind,
    RequestContentType,
    ResponseDescriptor,
    RouteExecutionSignature,
    ResourceAssignment,
    EndpointContract,
    RouteSchemaPayload,
    RouteHandlerDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import type { RouteSecurityDescriptor } from "../../../../types/upstream/route";
import type { RouteMiddlewares } from "../../../../types/upstream/collections";
import type { ControllerName } from "../../../../types/upstream/names";
import type { RouteSemanticFlowConstructorInput } from "./routeContracts";
import { relationGate } from "../../../../semantic/foundation/relationalSequence";
import { relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ROUTE_ACTION_KIND_REGISTRY } from "../../../../types/route";

export type RouteSemanticFlowFields = RouteSemanticFlow & {
    readonly name: RouteIdentityContract["coordinates"]["name"];
    readonly method: HttpMethod;
    readonly path: RouteIdentityContract["coordinates"]["path"];
    readonly resourceName: RouteIdentityContract["domain"]["resource"];
    readonly domain: RouteIdentityContract["domain"];
    readonly action: RouteBindingContract["operation"]["name"];
    readonly handler: RouteHandlerDescriptor;
    readonly actionName: RouteBindingContract["operation"]["name"];
    readonly groupName: RouteIdentityContract["domain"]["group"];
    readonly crudRole: CrudRole;
    readonly runtimePath: RouteIdentityContract["coordinates"]["runtimePath"];
    readonly responseTypeName: ReturnType<RouteBindingContract["response"]["responseTypeName"]>;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly hookKind: RouteHookKind;
    readonly invalidation: RouteCapabilityContract["invalidation"];
    readonly executionSignature: RouteExecutionSignature;
    readonly requestContentType: RequestContentType;
    readonly auth: RouteCapabilityContract["auth"];
    readonly security: RouteSecurityDescriptor;
    readonly middleware: RouteMiddlewares;
    readonly policies: RouteCapabilityContract["policies"];
    readonly rateLimit: RouteCapabilityContract["rateLimit"];
    readonly parameters: RouteIdentityContract["parameters"]["all"];
    readonly pathParameters: RouteIdentityContract["parameters"]["path"];
    readonly queryParameters: RouteIdentityContract["parameters"]["query"];
    readonly response: ResponseDescriptor;
    readonly errorResponses: RouteCapabilityContract["errorResponses"];
    readonly sourceFile: RouteProvenanceContract["sourceFile"];
    readonly sourceLine: RouteProvenanceContract["sourceLine"];
    readonly schema: RouteSchemaPayload;
    readonly runtimeReturn: RouteBindingContract["runtimeReturn"];
    readonly semanticReturn: RouteBindingContract["semanticReturn"];
    readonly assignments: readonly ResourceAssignment[];
    readonly uri: RouteProvenanceContract["uri"];
    readonly controllerName: ControllerName;
};

export const createRouteSemanticFlowFields = (
    params: RouteSemanticFlowConstructorInput
): RouteSemanticFlowFields => {
    const identity = params.identity;
    const binding = params.binding;
    const capability = params.capability;
    const provenance = params.provenance;
    const contract = params.contract;
    const handler = binding.operation.handler;
    const controllerName = relationGate(
        relationEqual(handler.kind, "controller_action"),
        () => SemanticValueFactory.controllerName(handler.controllerName.value.value),
        () => relationGate(
            relationEqual(handler.kind, "invokable_controller"),
            () => SemanticValueFactory.controllerName(handler.controllerName.value.value),
            () => SemanticValueFactory.controllerName("")
        )
    );

    return Object.freeze({
        identity,
        binding,
        capability,
        provenance,
        contract,
        name: identity.coordinates.name,
        method: identity.coordinates.method,
        path: identity.coordinates.path,
        runtimePath: identity.coordinates.runtimePath,
        resourceName: identity.domain.resource,
        domain: identity.domain,
        groupName: identity.domain.group,
        parameters: identity.parameters.all,
        pathParameters: identity.parameters.path,
        queryParameters: identity.parameters.query,
        handler,
        action: binding.operation.name,
        actionName: binding.operation.name,
        controllerName,
        schema: binding.schema,
        runtimeReturn: binding.runtimeReturn,
        semanticReturn: binding.semanticReturn,
        response: binding.response,
        responseTypeName: binding.response.responseTypeName(),
        assignments: binding.assignments,
        auth: capability.auth,
        security: capability.security,
        middleware: capability.middleware,
        policies: capability.policies,
        rateLimit: capability.rateLimit,
        invalidation: capability.invalidation,
        crudRole: capability.crudRole,
        hookKind: capability.hookKind,
        actionKind: capability.actionKind,
        isMutating: ROUTE_ACTION_KIND_REGISTRY[capability.actionKind].isMutating,
        requestContentType: capability.requestContentType,
        executionSignature: capability.executionSignature,
        errorResponses: capability.errorResponses,
        sourceFile: provenance.sourceFile,
        sourceLine: provenance.sourceLine,
        uri: provenance.uri
    });
};
