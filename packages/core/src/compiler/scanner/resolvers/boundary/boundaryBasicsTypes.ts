/**
 * boundaryBasicsTypes.ts
 *
 * Closed contracts and types for route perimeter boundary resolution.
 * Conforms to Level 6/7 Correct-by-Construction: Zero 'any', zero porous Record.
 *
 * @module core/compiler/scanner/resolvers/boundary
 */

import type {
    HttpMethod, RouteActionKind, CrudRole, RouteHookKind, RequestContentType,
    RouteParameter, RouteQueryParameter, ResponseDescriptor, HttpErrorResponseDescriptor,
    RouteCacheInvalidationDescriptor, RouteExecutionSignature, RouteSchemaPayload,
    FormRequestDescriptor, RouteHandlerDescriptor
} from "../../../../types/route";

import type { ScannedRouteCompleteContracts } from "../../descriptors/route/routeContracts";
import type { RouteRequestBinding } from "../../../../types/domain/request";
import type { ControllerRuntimeReturn } from "../../../../types/domain/controllerExpression";

export type RouteBoundaryContract = ScannedRouteCompleteContracts;

export interface RouteBoundaryCommonOptions {
    readonly method: HttpMethod;
    readonly path: string;
    readonly resourceName?: string;
    readonly domain?: string;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly response: ResponseDescriptor;
    readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
    readonly executionSignature?: RouteExecutionSignature;
    readonly requestContentType?: RequestContentType;
    readonly hookKind?: RouteHookKind;
    readonly crudRole?: CrudRole;
    readonly constantKey?: string;
    readonly runtimePath?: string;
    readonly groupName?: string;
    readonly schema: RouteSchemaPayload;
    readonly request: RouteRequestBinding;
    readonly runtimeReturn: ControllerRuntimeReturn;
}

export interface ControllerActionBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "controller_action";
    readonly name?: string;
    readonly controllerName: string;
    readonly actionName: string;
    readonly action: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface ControllerReferenceBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "controller_reference";
    readonly name?: string;
    readonly controllerName: string;
    readonly actionName: string;
    readonly action: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface ClosureBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "closure";
    readonly name?: string;
    readonly controllerName?: string;
    readonly actionName: string;
    readonly action?: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface SyntheticBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "synthetic";
    readonly name?: string;
    readonly controllerName?: string;
    readonly actionName?: string;
    readonly action?: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export type RouteBoundaryOptions =
    | ControllerActionBoundaryOptions
    | ControllerReferenceBoundaryOptions
    | ClosureBoundaryOptions
    | SyntheticBoundaryOptions;


export interface ResolvedRouteBoundaryOptions {
    readonly origin: RouteBoundaryOptions["origin"];
    readonly method: HttpMethod;
    readonly path: string;
    readonly name: string;
    readonly resourceName: string;
    readonly domain: string;
    readonly controllerName: string;
    readonly actionName: string;
    readonly action: string;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
    readonly auth: boolean;
    readonly middleware: readonly string[];
    readonly parameters: readonly RouteParameter[];
    readonly pathParameters: readonly RouteParameter[];
    readonly queryParameters: readonly RouteQueryParameter[];
    readonly response: ResponseDescriptor;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly invalidation: RouteCacheInvalidationDescriptor;
    readonly executionSignature: RouteExecutionSignature;
    readonly requestContentType: RequestContentType;
    readonly hookKind: RouteHookKind;
    readonly crudRole: CrudRole;
    readonly constantKey: string;
    readonly runtimePath: string;
    readonly groupName: string;
    readonly schema: RouteSchemaPayload;
    readonly request: RouteRequestBinding;
}

export interface IntermediateRouteBoundaryBasics {
    readonly resolvedControllerName: string;
    readonly resolvedActionName: string;
    readonly resolvedAction: string;
    readonly isGetMethod: boolean;
    readonly isHeadMethod: boolean;
    readonly resolvedActionKind: RouteActionKind;
    readonly resolvedIsMutating: boolean;
    readonly resolvedDomain: string;
    readonly resolvedResourceName: string;
    readonly resolvedParameters: readonly RouteParameter[];
    readonly resolvedPathParameters: readonly RouteParameter[];
    readonly resolvedQueryParameters: readonly RouteQueryParameter[];
    readonly resolvedGroupName: string;
    readonly resolvedRuntimePath: string;
    readonly resolvedConstantKey: string;
    readonly resolvedRouteName: string;
}
