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
import type { ControllerReturnSemantic } from "../../../../types/upstream/controller";
import type {
    ActionName, ControllerName, DomainTypeName, PropertyName, ResourceName, RouteName, RoutePath, SourceFile
} from "../../../../types/upstream/names";

export type RouteBoundaryContract = ScannedRouteCompleteContracts;

export interface RouteBoundaryCommonOptions {
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly resourceName?: ResourceName;
    readonly domain?: DomainTypeName;
    readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[];
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
    readonly constantKey?: PropertyName;
    readonly runtimePath?: RoutePath;
    readonly groupName?: DomainTypeName;
    readonly schema: RouteSchemaPayload;
    readonly request: RouteRequestBinding;
    readonly runtimeReturn: ControllerRuntimeReturn;
    readonly semanticReturn: ControllerReturnSemantic;
}

export interface ControllerActionBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "controller_action";
    readonly name?: RouteName;
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly action: ActionName;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface ControllerReferenceBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "controller_reference";
    readonly name?: RouteName;
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly action: ActionName;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface ClosureBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "closure";
    readonly name?: RouteName;
    readonly controllerName?: ControllerName;
    readonly actionName: ActionName;
    readonly action?: ActionName;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
}

export interface SyntheticBoundaryOptions extends RouteBoundaryCommonOptions {
    readonly origin: "synthetic";
    readonly name?: RouteName;
    readonly controllerName?: ControllerName;
    readonly actionName?: ActionName;
    readonly action?: ActionName;
    readonly actionKind?: RouteActionKind;
    readonly isMutating?: boolean;
    readonly sourceFile: SourceFile;
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
    readonly path: RoutePath;
    readonly name: RouteName;
    readonly resourceName: ResourceName;
    readonly domain: DomainTypeName;
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly action: ActionName;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly handler: RouteHandlerDescriptor;
    readonly auth: boolean;
    readonly middleware: readonly PropertyName[];
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
    readonly constantKey: PropertyName;
    readonly runtimePath: RoutePath;
    readonly groupName: DomainTypeName;
    readonly schema: RouteSchemaPayload;
    readonly request: RouteRequestBinding;
}

export interface IntermediateRouteBoundaryBasics {
    readonly resolvedControllerName: ControllerName;
    readonly resolvedActionName: ActionName;
    readonly resolvedAction: ActionName;
    readonly isGetMethod: boolean;
    readonly isHeadMethod: boolean;
    readonly resolvedActionKind: RouteActionKind;
    readonly resolvedIsMutating: boolean;
    readonly resolvedDomain: DomainTypeName;
    readonly resolvedResourceName: ResourceName;
    readonly resolvedParameters: readonly RouteParameter[];
    readonly resolvedPathParameters: readonly RouteParameter[];
    readonly resolvedQueryParameters: readonly RouteQueryParameter[];
    readonly resolvedGroupName: DomainTypeName;
    readonly resolvedRuntimePath: RoutePath;
    readonly resolvedConstantKey: PropertyName;
    readonly resolvedRouteName: RouteName;
}
