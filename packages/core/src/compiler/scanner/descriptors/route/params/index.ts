/**
 * Route Parameters Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/scanner/descriptors/route/params
 */

export {
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from './types';

export {
    ScannedRouteParameterDescriptor
} from './routeParameterDescriptorClass';

export {
    ScannedRouteQueryParameterDescriptor
} from './routeQueryParameterDescriptorClass';
