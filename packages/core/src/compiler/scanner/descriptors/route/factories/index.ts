/**
 * Route Semantic Factories Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/scanner/descriptors/route/factories
 */

export {
    type RouteDescriptorConstructor,
    createRouteFromSubcontracts,
    createRouteFromSparse
} from './contractRouteFactories';

export {
    createRouteFromControllerAction,
    createRouteFromControllerReference
} from './actionRouteFactories';

export {
    createRouteFromClosure,
    createSyntheticRoute
} from './closureSyntheticFactories';
