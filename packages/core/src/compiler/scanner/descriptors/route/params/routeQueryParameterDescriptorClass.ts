/**
 * routeQueryParameterDescriptorClass.ts
 *
 * ScannedRouteQueryParameterDescriptor class implementation.
 *
 * @module compiler/scanner/descriptors/route/params
 */

import {
    type RouteQueryParameter,
    RouteParameterType
} from "../../../../../types/route";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { ScannedRouteQueryParameterParams } from "./types";

export class ScannedRouteQueryParameterDescriptor implements RouteQueryParameter {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly required: boolean;
    public readonly type: RouteParameterType;
    public readonly isArray: boolean;
    public readonly default: unknown;

    constructor(params: ScannedRouteQueryParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName;
        this.required = params.required;
        this.type = params.type;
        this.isArray = params.isArray;
        this.default = params.default;
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName = toCamelCase(name),
        required = false,
        type = RouteParameterType.String,
        isArray = false,
        default: defaultValue = null
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
        readonly isArray?: boolean;
        readonly default?: unknown;
    }): ScannedRouteQueryParameterDescriptor {
        return new ScannedRouteQueryParameterDescriptor({
            name,
            propertyName,
            required,
            type,
            isArray,
            default: defaultValue
        });
    }
}
