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

export interface ScannedRouteQueryParameterDescriptor extends RouteQueryParameter {
    readonly name: RouteParameterName;
    readonly propertyName: PropertyName;
    readonly presence: Presence;
    readonly type: RouteParameterType;
    readonly cardinality: Cardinality;
    readonly defaultValue: Option<RequestRuntimeValue>;
}

const queryDescriptor = (params: ScannedRouteQueryParameterParams): ScannedRouteQueryParameterDescriptor => Object.freeze({ ...params });

export const ScannedRouteQueryParameterDescriptor = Object.freeze({
    create: queryDescriptor
});
