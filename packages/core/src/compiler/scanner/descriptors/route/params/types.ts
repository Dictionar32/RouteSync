import type {
    RouteParameter,
    RouteParameterBinding,
    RouteParameterConstraint,
    RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";
import type { PropertyName, RouteParameterName } from "../../../../../types/upstream/names";
import type { Cardinality, Presence } from "../../../../../types/upstream/primitiveVocabulary";
import type { Option } from "../../../../../types/upstream/collections";
import type { RequestRuntimeValue } from "../../../../../types/domain/requestModels";

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
    readonly name: RouteParameterName;
    readonly propertyName: PropertyName;
    readonly presence: Presence;
    readonly type: RouteParameterType;
    readonly cardinality: Cardinality;
    readonly defaultValue: Option<RequestRuntimeValue>;
}

export type ScannedRouteParameter = RouteParameter;
