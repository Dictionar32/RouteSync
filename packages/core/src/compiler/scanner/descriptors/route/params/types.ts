/**
 * types.ts
 *
 * Route parameter descriptor parameter types.
 *
 * @module compiler/scanner/descriptors/route/params
 */

import type {
    RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";

export interface ScannedRouteParameterParams {
    readonly name: string;
    readonly propertyName: string;
    readonly bindingField: string | null;
    readonly in: RouteParameterLocation;
    readonly required: boolean;
    readonly type: RouteParameterType;
}

export interface ScannedRouteQueryParameterParams {
    readonly name: string;
    readonly propertyName: string;
    readonly required: boolean;
    readonly type: RouteParameterType;
    readonly isArray: boolean;
    readonly default: unknown;
}
