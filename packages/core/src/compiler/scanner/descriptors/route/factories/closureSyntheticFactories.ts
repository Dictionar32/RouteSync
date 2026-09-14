/**
 * closureSyntheticFactories.ts
 *
 * Active Consumer Coordinator: Route creation from Closures and Synthetic fixtures.
 * Conforms to Rule 14: Active Consumer with Pure Flow, zero wildcard re-exports.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

export {
    type ClosureRouteOptions,
    createRouteFromClosure
} from "./closureRouteFactory";

export {
    type SyntheticRouteOptions,
    createSyntheticRoute
} from "./syntheticRouteFactory";
