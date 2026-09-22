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
import type { PropertyName, RouteParameterName } from "../../../../../types/upstream/names";
import type { Cardinality, Presence } from "../../../../../types/upstream/primitiveVocabulary";
import type { Option } from "../../../../../types/upstream/collections";
import type { RequestRuntimeValue } from "../../../../../types/domain/requestModels";
import type { ScannedRouteQueryParameterParams } from "./types";

export class ScannedRouteQueryParameterDescriptor implements RouteQueryParameter {
    public readonly name: RouteParameterName;
    public readonly propertyName: PropertyName;
    public readonly presence: Presence;
    public readonly type: RouteParameterType;
    public readonly cardinality: Cardinality;
    public readonly defaultValue: Option<RequestRuntimeValue>;

    constructor(params: ScannedRouteQueryParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName;
        this.presence = params.presence;
        this.type = params.type;
        this.cardinality = params.cardinality;
        this.defaultValue = params.defaultValue;
        Object.freeze(this);
    }

    public static create(params: ScannedRouteQueryParameterParams): ScannedRouteQueryParameterDescriptor {
        return new ScannedRouteQueryParameterDescriptor(params);
    }
}
