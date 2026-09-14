/**
 * actionRouteFactories.ts
 *
 * Active Consumer Coordinator: Route creation from Controller Actions and References.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

export {
    type ControllerActionRouteOptions,
    createRouteFromControllerAction
} from "./controllerActionRouteFactory";

export {
    type ControllerReferenceRouteOptions,
    createRouteFromControllerReference
} from "./controllerReferenceRouteFactory";
