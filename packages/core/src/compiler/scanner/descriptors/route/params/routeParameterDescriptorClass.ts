/**
 * routeParameterDescriptorClass.ts
 *
 * ScannedRouteParameterDescriptor class implementation.
 *
 * @module compiler/scanner/descriptors/route/params
 */

import {
    type RouteParameter,
    type PathParameterDescriptor,
    type QueryParameterDescriptor,
    type HeaderParameterDescriptor,
    type RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { ScannedRouteParameterParams } from "./types";

export class ScannedRouteParameterDescriptor implements RouteParameter {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly bindingField: string | null;
    public readonly in: RouteParameterLocation;
    public readonly required: boolean;
    public readonly type: RouteParameterType;

    constructor(params: ScannedRouteParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName;
        this.bindingField = params.bindingField;
        this.in = params.in;
        this.required = params.required;
        this.type = params.type;
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName = toCamelCase(name),
        bindingField = null,
        in: location = "path",
        required = true,
        type
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly in?: RouteParameterLocation;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): ScannedRouteParameterDescriptor {
        const bField = (bindingField !== undefined && bindingField !== null) ? bindingField : null;
        const isNumeric = bField
            ? (bField === "id" || bField.endsWith("_id") || bField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: bField,
            in: location,
            required,
            type: type !== undefined ? type : (isNumeric ? RouteParameterType.Number : RouteParameterType.String)
        });
    }

    public static fromPathSegment(rawSegment: string): PathParameterDescriptor {
        const [rawName, bindingField] = rawSegment.split(":");
        const isOptional = rawName.endsWith("?");
        const name = isOptional ? rawName.slice(0, -1) : rawName;
        const isNumeric = bindingField
            ? (bindingField === "id" || bindingField.endsWith("_id") || bindingField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName: toCamelCase(name),
            bindingField: bindingField ? bindingField : null,
            in: "path",
            required: !isOptional,
            type: isNumeric ? RouteParameterType.Number : RouteParameterType.String
        }) as PathParameterDescriptor;
    }

    public static path({
        name,
        propertyName = toCamelCase(name),
        bindingField = null,
        required = true,
        type
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): PathParameterDescriptor {
        const bField = (bindingField !== undefined && bindingField !== null) ? bindingField : null;
        const isNumeric = bField
            ? (bField === "id" || bField.endsWith("_id") || bField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: bField,
            in: "path",
            required,
            type: type !== undefined ? type : (isNumeric ? RouteParameterType.Number : RouteParameterType.String)
        }) as PathParameterDescriptor;
    }

    public static query({
        name,
        propertyName = toCamelCase(name),
        required = false,
        type = RouteParameterType.String
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): QueryParameterDescriptor {
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: null,
            in: "query",
            required,
            type
        }) as QueryParameterDescriptor;
    }

    public static header({
        name,
        propertyName = toCamelCase(name),
        required = true,
        type = RouteParameterType.String
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): HeaderParameterDescriptor {
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: null,
            in: "header",
            required,
            type
        }) as HeaderParameterDescriptor;
    }
}
