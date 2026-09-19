/**
 * Canonical scanner boundary for route parameters.
 * Raw PHP strings are converted here into upstream semantic ADTs.
 */
import type {
    RouteParameter,
    RouteParameterBinding,
    RouteParameterConstraint,
    RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";
import type { PropertyName, RouteParameterName } from "../../../../../types/upstream/names";
import type { Presence } from "../../../../../types/upstream/primitiveVocabulary";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { RawScannedRouteParameterInput, ScannedRouteParameterParams } from "./types";

const stringValue = (value: string) => Object.freeze({ kind: 'string_value' as const, value });
const routeParameterName = (value: string): RouteParameterName => Object.freeze({ kind: 'route_parameter_name' as const, value: stringValue(value) });
const propertyName = (value: string): PropertyName => Object.freeze({ kind: 'property_name' as const, value: stringValue(value) });
const binding = (value: string | null): RouteParameterBinding => value === null
    ? Object.freeze({ kind: 'convention' as const })
    : Object.freeze({ kind: 'explicit' as const, field: propertyName(value) });
const presence = (required: boolean): Presence => required
    ? Object.freeze({ kind: 'required' as const })
    : Object.freeze({ kind: 'optional' as const });
const constraint = (): RouteParameterConstraint => Object.freeze({ kind: 'unconstrained' as const });

function fromRaw(input: RawScannedRouteParameterInput): ScannedRouteParameterParams {
    return Object.freeze({
        name: routeParameterName(input.name),
        propertyName: propertyName(input.propertyName),
        binding: binding(input.bindingField ?? null),
        location: input.location,
        presence: input.presence,
        type: input.type,
        constraint: input.constraint
    });
}

export class ScannedRouteParameterDescriptor {
    public readonly kind = 'route_parameter' as const;
    public readonly name: RouteParameterName;
    public readonly propertyName: PropertyName;
    public readonly binding: RouteParameterBinding;
    public readonly location: RouteParameterLocation;
    public readonly presence: Presence;
    public readonly type: RouteParameterType;
    public readonly constraint: RouteParameterConstraint;

    constructor(params: ScannedRouteParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName;
        this.binding = params.binding;
        this.location = params.location;
        this.presence = params.presence;
        this.type = params.type;
        this.constraint = params.constraint;
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName: propertyNameValue = toCamelCase(name),
        bindingField = null,
        in: location = "path",
        required = true,
        type = inferType(name, bindingField)
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly in?: RouteParameterLocation;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): ScannedRouteParameterDescriptor {
        return new ScannedRouteParameterDescriptor(fromRaw({ name, propertyName: propertyNameValue, bindingField: bindingField ?? undefined, location, presence: presence(required), type, constraint: constraint() }));
    }

    public static fromPathSegment(rawSegment: string): Extract<RouteParameter, { readonly location: 'path' }> {
        const [rawName, bindingField] = rawSegment.split(":");
        const optional = rawName.endsWith("?");
        const name = optional ? rawName.slice(0, -1) : rawName;
        const descriptor = new ScannedRouteParameterDescriptor(fromRaw({
            name,
            propertyName: toCamelCase(name),
            bindingField: bindingField ?? undefined,
            location: "path",
            presence: presence(!optional),
            type: inferType(name, bindingField ?? null),
            constraint: constraint()
        }));
        return descriptor as Extract<RouteParameter, { readonly location: 'path' }>;
    }

    public static path({ name, propertyName: propertyNameValue = toCamelCase(name), bindingField = null, required = true, type = inferType(name, bindingField) }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: 'path' }> {
        return new ScannedRouteParameterDescriptor(fromRaw({ name, propertyName: propertyNameValue, bindingField: bindingField ?? undefined, location: 'path', presence: presence(required), type, constraint: constraint() })) as Extract<RouteParameter, { readonly location: 'path' }>;
    }

    public static query({ name, propertyName: propertyNameValue = toCamelCase(name), required = false, type = 'string' }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: 'query' }> {
        return new ScannedRouteParameterDescriptor(fromRaw({ name, propertyName: propertyNameValue, bindingField: undefined, location: 'query', presence: presence(required), type, constraint: constraint() })) as Extract<RouteParameter, { readonly location: 'query' }>;
    }

    public static header({ name, propertyName: propertyNameValue = toCamelCase(name), required = true, type = 'string' }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: 'header' }> {
        return new ScannedRouteParameterDescriptor(fromRaw({ name, propertyName: propertyNameValue, bindingField: undefined, location: 'header', presence: presence(required), type, constraint: constraint() })) as Extract<RouteParameter, { readonly location: 'header' }>;
    }
}

function inferType(name: string, bindingField: string | null): RouteParameterType {
    const field = bindingField ?? name;
    return field === 'id' || field.endsWith('_id') || field.endsWith('Id') ? 'number' : 'string';
}
