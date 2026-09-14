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

export interface RouteBoundaryContract {
    readonly name: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly resourceName: string;
    readonly domain: string;
    readonly groupName: string;
    readonly runtimePath: string;
    readonly constantKey: string;
    readonly controllerName: string;
    readonly actionName: string;
    readonly actionTarget: string;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly crudRole: CrudRole;
    readonly hookKind: RouteHookKind;
    readonly invalidation: RouteCacheInvalidationDescriptor;
    readonly executionSignature: RouteExecutionSignature;
    readonly requestContentType: RequestContentType;
    readonly auth: boolean;
    readonly middleware: readonly string[];
    readonly parameters: readonly RouteParameter[];
    readonly pathParameters: readonly RouteParameter[];
    readonly queryParameters: readonly RouteQueryParameter[];
    readonly response: ResponseDescriptor;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly schema: RouteSchemaPayload;
    readonly formRequests: readonly (string | FormRequestDescriptor)[];
    readonly handler: RouteHandlerDescriptor;
}

export type RouteBoundaryOptions = {
    readonly method: HttpMethod;
    readonly path: string;
    readonly name?: string;
    readonly resourceName?: string;
    readonly domain?: string;
    readonly action?: string;
    readonly actionName?: string;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly groupName?: string;
    readonly crudRole?: CrudRole;
    readonly runtimePath?: string;
    readonly constantKey?: string;
    readonly hookKind?: RouteHookKind;
    readonly invalidation?: RouteCacheInvalidationDescriptor;
    readonly executionSignature?: RouteExecutionSignature;
    readonly requestContentType?: RequestContentType;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly response?: ResponseDescriptor;
    readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
    readonly sourceFile?: string;
    readonly sourceLine?: number;
    readonly controllerName?: string;
    readonly schema?: RouteSchemaPayload;
    readonly formRequests?: readonly (string | FormRequestDescriptor)[];
    readonly handler?: RouteHandlerDescriptor;
};

/**
 * Backward-compatibility alias for RouteBoundaryOptions.
 */
export type SparseRouteParams = RouteBoundaryOptions;

export interface IntermediateRouteBoundaryBasics {
    readonly resolvedControllerName: string;
    readonly resolvedActionName: string;
    readonly resolvedAction: string;
    readonly isGetMethod: boolean;
    readonly isHeadMethod: boolean;
    readonly resolvedActionKind: RouteActionKind;
    readonly resolvedIsMutating: boolean;
    readonly resolvedDomain: string;
    readonly fallbackResource: string;
}
