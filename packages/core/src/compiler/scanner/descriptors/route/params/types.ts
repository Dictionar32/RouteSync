import type {
    RouteParameter,
    RouteParameterBinding,
    RouteParameterConstraint,
    RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";
import type { PropertyName, RouteParameterName } from "../../../../../types/upstream/names";
import type { Presence } from "../../../../../types/upstream/primitiveVocabulary";

export interface ScannedRouteParameterParams {
    readonly name: RouteParameterName;
    readonly propertyName: PropertyName;
    readonly binding: RouteParameterBinding;
    readonly location: RouteParameterLocation;
    readonly presence: Presence;
    readonly type: RouteParameterType;
    readonly constraint: RouteParameterConstraint;
}

export interface RawScannedRouteParameterInput {
    readonly name: string;
    readonly propertyName: string;
    readonly bindingField: string | undefined;
    readonly location: RouteParameterLocation;
    readonly presence: Presence;
    readonly type: RouteParameterType;
    readonly constraint: RouteParameterConstraint;
}

export interface ScannedRouteQueryParameterParams {
    readonly name: string;
    readonly propertyName: string;
    readonly required: boolean;
    readonly type: RouteParameterType;
    readonly isArray: boolean;
    readonly default: unknown;
}

export type ScannedRouteParameter = RouteParameter;
