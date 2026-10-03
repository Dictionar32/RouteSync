/**
 * routeSemanticFactories.ts
 *
 * Semantic factories for creating RouteSemanticFlowFactory instances from
 * ControllerAction ASTs, Controller References, Closures, and Synthetic test fixtures.
 * Active Consumer: Orchestrates route semantic factory methods.
 *
 * @module core/compiler/scanner/descriptors/route/routeSemanticFactories
 */

export {
    type RouteDescriptorConstructor,
    createRouteFromSubcontracts,
    createRouteFromSparse,
    createRouteFromControllerAction,
    createRouteFromControllerReference,
    createRouteFromClosure,
    createSyntheticRoute
} from './factories/index';
